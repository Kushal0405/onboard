import { useCallback, useEffect, useRef, useState } from "react";

const MAX_HISTORY = 50;

export function useStepHistory<T>(stepId: string | undefined, current: T) {
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const lastPushedRef = useRef<T | null>(null);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    setPast([]);
    setFuture([]);
    lastPushedRef.current = current;
  }, [stepId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      lastPushedRef.current = current;
      return;
    }
    if (lastPushedRef.current === null) {
      lastPushedRef.current = current;
      return;
    }
    if (JSON.stringify(lastPushedRef.current) === JSON.stringify(current)) return;

    setPast((prev) => {
      const next = [...prev, lastPushedRef.current as T];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    });
    setFuture([]);
    lastPushedRef.current = current;
  }, [current]);

  const undo = useCallback(
    (applyState: (state: T) => void) => {
      setPast((prev) => {
        if (prev.length === 0) return prev;
        const previous = prev[prev.length - 1]!;
        setFuture((f) => [current, ...f]);
        isRestoringRef.current = true;
        applyState(previous);
        return prev.slice(0, -1);
      });
    },
    [current],
  );

  const redo = useCallback(
    (applyState: (state: T) => void) => {
      setFuture((prev) => {
        if (prev.length === 0) return prev;
        const next = prev[0]!;
        setPast((p) => [...p, current]);
        isRestoringRef.current = true;
        applyState(next);
        return prev.slice(1);
      });
    },
    [current],
  );

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
  };
}
