import type { IAutoMovieRenderDrawActivity } from "../IAutoMovieRenderDrawActivity";

/* Emit the completion only after the host operation settles successfully. */
export function observeDrawActivity<T>(
  observe: ((activity: IAutoMovieRenderDrawActivity) => void) | undefined,
  operation: IAutoMovieRenderDrawActivity.IOperation,
  run: () => Promise<T>,
): Promise<T> {
  if (observe === undefined) return run();
  const started: number = performance.now();
  observe({ ...operation, type: "requested" });
  return run().then((result: T): T => {
    observe({
      ...operation,
      type: "acknowledged",
      elapsedMilliseconds: performance.now() - started,
    });
    return result;
  });
}
