import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCreateProject } from "@/features/projects/hooks/useCreateProject";
import { useSnippetValidation } from "@/features/projects/hooks/useSnippetValidation";
import {
  createProjectSchema,
  projectSiteUrlSchema,
  type CreateProjectValues,
  type ProjectSiteUrlValues,
} from "@/features/projects/schemas";

type Step = "details" | "connect";

export function CreateProjectDialog({ workspaceId }: { workspaceId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState<CreateProjectValues | null>(null);
  const createProject = useCreateProject();
  const { status, validate, reset } = useSnippetValidation();

  const detailsForm = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  const urlForm = useForm<ProjectSiteUrlValues>({
    resolver: zodResolver(projectSiteUrlSchema),
    defaultValues: { siteUrl: "" },
  });

  function handleDialogOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep("details");
      setDetails(null);
      detailsForm.reset();
      urlForm.reset();
      reset();
    }
  }

  function onDetailsSubmit(values: CreateProjectValues) {
    setDetails(values);
    setStep("connect");
  }

  function onValidate(values: ProjectSiteUrlValues) {
    validate(values.siteUrl);
  }

  async function handleCreate(skipInstall: boolean) {
    if (!details) return;
    const siteUrl = urlForm.getValues("siteUrl");
    try {
      await createProject.mutateAsync({
        workspaceId,
        createdBy: user!.id,
        name: details.name,
        description: details.description,
        siteUrl,
        isInstalled: skipInstall ? false : status === "verified",
      });
      toast.success("Project created");
      handleDialogOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button>New project</Button>
      </DialogTrigger>
      <DialogContent>
        {step === "details" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
              <DialogDescription>
                Projects group related tours, e.g. one per app or platform.
              </DialogDescription>
            </DialogHeader>
            <Form {...detailsForm}>
              <form
                onSubmit={(e) => void detailsForm.handleSubmit(onDetailsSubmit)(e)}
                className="space-y-4"
              >
                <FormField
                  control={detailsForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Web App" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={detailsForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Our main product onboarding" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Continue</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Connect your site</DialogTitle>
              <DialogDescription>
                Enter the URL where you&apos;ll install OnboardFlow. We&apos;ll check that the
                tracking snippet is loaded there before you start building tours.
              </DialogDescription>
            </DialogHeader>
            <Form {...urlForm}>
              <form onSubmit={(e) => void urlForm.handleSubmit(onValidate)(e)} className="space-y-4">
                <FormField
                  control={urlForm.control}
                  name="siteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourapp.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {status === "checking" && (
                  <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Checking for the OnboardFlow snippet...
                  </div>
                )}
                {status === "verified" && (
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    Snippet detected — you&apos;re ready to build tours.
                  </div>
                )}
                {status === "failed" && (
                  <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-500">
                    <p className="flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0" />
                      We couldn&apos;t detect the snippet on that page.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Install{" "}
                      <code className="rounded bg-muted px-1 py-0.5">
                        &lt;script src=&quot;{window.location.origin}/sdk/onboardflow.iife.js&quot;&gt;&lt;/script&gt;
                      </code>{" "}
                      on the page (you can also get your project&apos;s full snippet from the
                      Install page after creating the project), then recheck. Or continue without
                      verifying — you can connect the site later.
                    </p>
                  </div>
                )}

                <DialogFooter className="flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep("details")}>
                    Back
                  </Button>
                  {status !== "verified" && (
                    <Button type="submit" variant="outline" disabled={status === "checking"}>
                      {status === "failed" ? "Recheck" : "Check installation"}
                    </Button>
                  )}
                  {status === "verified" ? (
                    <Button
                      type="button"
                      onClick={() => void handleCreate(false)}
                      disabled={createProject.isPending}
                    >
                      {createProject.isPending ? "Creating..." : "Create project"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void handleCreate(true)}
                      disabled={createProject.isPending || !urlForm.getValues("siteUrl")}
                    >
                      Skip for now
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
