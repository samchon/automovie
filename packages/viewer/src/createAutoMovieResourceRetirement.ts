import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * One owned retirement with one completion, shared by repeated and reentrant
 * requests. Every operation starts independently, so a synchronous failure or
 * a pending asynchronous owner cannot prevent another owner from being asked
 * to retire. Completion waits for all attempts before reporting their results.
 *
 * The primary cause, when supplied, remains first. Original failure identities,
 * ordered nested aggregate causes and opaque empty aggregates follow the same
 * policy as render-state restoration. A fulfilled completion means all public
 * operations fulfilled; it is not proof that native allocations were freed.
 * The caller retains failed or indeterminate resource ownership until its
 * supported physical lifetime boundary ends.
 *
 * @evidence contracts/common.md#principled-implementation Promise.allSettled attempts independent owners and retains original errors under the existing restoration cause policy.
 * @evidence contracts/common.md#clear-and-simple-design One memoized completion separates synchronous publication from owned asynchronous retirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Calls supplied release operations without retries, native-counter changes or foreign method replacement.
 * @evidence contracts/common.md#meaningful-documentation Describes start order, memoization, primary causes and the difference between public completion and native release proof.
 */
export function createAutoMovieResourceRetirement(
  operations: readonly ((() => void) | (() => Promise<void>))[],
  primary: { error: unknown },
): () => Promise<never>;
export function createAutoMovieResourceRetirement(
  operations: readonly ((() => void) | (() => Promise<void>))[],
): () => Promise<void>;
export function createAutoMovieResourceRetirement(
  operations: readonly ((() => void) | (() => Promise<void>))[],
  primary?: { error: unknown },
): () => Promise<void> {
  let completion: Promise<void> | undefined;
  return () => {
    if (completion === undefined)
      completion = Promise.allSettled(
        operations.map((operation) => Promise.resolve().then(operation)),
      ).then((results) => {
        const failed = results.filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );
        const reporting = failed.map((result) => () => {
          throw result.reason;
        });
        reportAutoMovieResourceRetirement(reporting, primary);
      });
    return completion;
  };
}
