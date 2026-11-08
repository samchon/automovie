/** Observe completed work and cooperatively release the host at the declared interval. */
export async function yieldPhysicalSimulation(
  step: number,
  total: number,
  yieldEvery: number,
  signal?: AbortSignal,
  progress?: (completed: number, count: number) => void,
): Promise<void> {
  signal?.throwIfAborted();
  progress?.(step, total);
  signal?.throwIfAborted();
  if (step % yieldEvery === 0)
    await new Promise<undefined>(
      (resolve: (value: undefined) => void): void => {
        setTimeout((): void => resolve(undefined), 0);
      },
    );
  signal?.throwIfAborted();
}
