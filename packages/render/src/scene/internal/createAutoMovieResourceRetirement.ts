import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/*
 * One owned retirement with one completion, shared by repeated and reentrant
 * requests. Every operation starts independently, so a synchronous failure or a
 * pending asynchronous owner cannot prevent another owner from being asked to
 * retire. Completion waits for all attempts before reporting their results.
 *
 * The primary cause, when supplied, remains first. Original failure identities,
 * ordered nested aggregate causes and opaque empty aggregates follow the same
 * policy as render-state restoration. A fulfilled completion means all public
 * operations fulfilled; it is not proof that native allocations were freed. The
 * caller retains failed or indeterminate resource ownership until its supported
 * physical lifetime boundary ends.
 */
export function createAutoMovieResourceRetirement(
  operations: readonly ((() => void) | (() => Promise<void>))[],
  primary: { error: unknown },
): () => Promise<never>;
/*
 * Create an idempotent retirement operation without a primary failure.
 */
export function createAutoMovieResourceRetirement(
  operations: readonly ((() => void) | (() => Promise<void>))[],
): () => Promise<void>;
/*
 * Shared implementation for the retirement overloads.
 */
export function createAutoMovieResourceRetirement(
  operations: readonly ((() => void) | (() => Promise<void>))[],
  primary?: { error: unknown },
): () => Promise<void> {
  let completion: Promise<void> | undefined;
  return (): Promise<void> => {
    if (completion === undefined)
      completion = Promise.allSettled(
        operations.map(
          (operation: (() => void) | (() => Promise<void>)): Promise<void> =>
            Promise.resolve().then(operation),
        ),
      ).then((results: PromiseSettledResult<unknown>[]): void => {
        const failed: PromiseRejectedResult[] = results.filter(
          (
            result: PromiseSettledResult<unknown>,
          ): result is PromiseRejectedResult => result.status === "rejected",
        );
        const reporting: (() => never)[] = failed.map(
          (result: PromiseRejectedResult): (() => never) =>
            (): never => {
              throw result.reason;
            },
        );
        reportAutoMovieResourceRetirement(reporting, primary);
      });
    return completion;
  };
}
