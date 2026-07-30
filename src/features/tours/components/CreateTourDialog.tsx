import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useTourMutations } from "@/features/tours/hooks/useTourMutations";
import { createTourSchema, type CreateTourValues } from "@/features/tours/schemas";

export function CreateTourDialog({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const { create } = useTourMutations(projectId);

  const form = useForm<CreateTourValues>({
    resolver: zodResolver(createTourSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: CreateTourValues) {
    try {
      await create.mutateAsync({ projectId, createdBy: user!.id, name: values.name });
      toast.success("Tour created");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create tour");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New tour</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create tour</DialogTitle>
          <DialogDescription>
            Starts as a draft. You&apos;ll add steps in the tour editor next.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Welcome tour" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating..." : "Create tour"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
