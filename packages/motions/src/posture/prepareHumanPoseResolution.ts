import { preparePoseResolution } from "@automovie/engine";

/**
 * Own a lazy exact-FK reader for one synchronous person evaluation, or borrow
 * its parent's reader/supplier. No reader or supplier is evaluated until the
 * first actual FK demand. Release the returned getter with that evaluation;
 * it must not enter a retained plan, body fit entry or public result closure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States accepted borrowed sources, lazy first demand, synchronous ownership and the nonescaping getter boundary.
 * @evidence contracts/development/implementation.md#principled-implementation Every demand returns the same operation-owned preparePoseResolution reader, whose scalar dependency checks determine equivalent FK work independently of targets and solves.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This one lazy-owner adapter serves posture/refit, limb fitting and paired arms; the engine alone owns joint admission, FK computation and exact dependency snapshots.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not memoize a pose, numerical callback, fit, goal, near seed or query result. The optional supplier provides only the parent's exact FK workspace; all actual fits and changed dependencies remain evaluated normally.
 * @evidence contracts/development/implementation.md#efficient-algorithms One constant-size closure is created; the reader or supplied factory is used only on first demand, and later demands are constant-time reads. Memory hits and no-FK paths do not allocate the reader; runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A parent explicitly lending its reader establishes one synchronous person's scope; otherwise first demand creates a fresh engine reader. Separate evaluations receive separate local getters and no global context is consulted.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one getter borrowing its optional parent source and holding at most one exact reader until synchronous return or throw. No global map, plan, body entry, task or external handle retains either object.
 */
export function prepareHumanPoseResolution(
  source?:
    | ReturnType<typeof preparePoseResolution>
    | (() => ReturnType<typeof preparePoseResolution>),
): () => ReturnType<typeof preparePoseResolution> {
  let reader: ReturnType<typeof preparePoseResolution> | undefined =
    typeof source === "function" ? undefined : source;
  return (): ReturnType<typeof preparePoseResolution> => {
    if (reader === undefined)
      reader =
        typeof source === "function" ? source() : preparePoseResolution();
    return reader;
  };
}
