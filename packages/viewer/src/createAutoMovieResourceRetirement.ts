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
 * @evidence contracts/common.md#principled-implementation Creates one lazily memoized Promise.allSettled completion, scheduling every operation independently through microtasks and reporting all rejections with an optional primary cause; callback settlement indicates public operation completion, not physical GPU/native retirement.
 * @evidence contracts/common.md#clear-and-simple-design Owns completion sharing and independent async fan-out, while reportAutoMovieResourceRetirement owns ordered failure flattening and resource owners retain actual handles through uncertain native release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated/reentrant requests share the original promise rather than retrying resource release or converting failure to success; no operation identity/fixture branch skips a requested attempt.
 * @evidence contracts/common.md#meaningful-documentation Documents lazy shared completion, independent starts, settlement-before-reporting, primary/aggregate identity policy and required owner retention after indeterminate native release.
 * @evidence contracts/performance.md#efficient-algorithms Schedules R operations once and visits R settled results to report failures, O(R) coordinator references/promises plus actual operation costs; one pending operation delays final settlement but cannot prevent the other starts.
 * @evidence contracts/performance.md#reuse-equivalent-work All calls to one returned closer share exactly one in-flight/completed/rejected promise because they represent the same owned retirement; separate owners and operation lists have separate completions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closer retains its operation closures and completion for its own lifetime, so resource-owning closures must be bounded by the owner's population and released when that owner is unreachable; this coordinator acquires no resource or task beyond its finite retirement promises.
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
