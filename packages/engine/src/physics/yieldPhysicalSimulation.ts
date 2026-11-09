/**
 * Observe completed work and cooperatively release the host at the declared interval.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Observe completed work and cooperatively release the host at the declared interval) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Observe completed work and cooperatively release the host at the declared interval) directly over its typed inputs (`step`, `total`, `yieldEvery`, `signal`, `progress`) as a fixed number of statements with no loop or recursion in the body, delegating to `signal?.throwIfAborted`, `progress`, `setTimeout`, `resolve`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One async operation of 12 lines and 5 top-level statements that reuses `signal?.throwIfAborted`, `progress`, `setTimeout`, `resolve` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `step`, `total`, `yieldEvery`, `signal`, `progress`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 1 allocation site (literals and constructed values). No speedup is claimed and none is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Awaits 1 call per invocation and shares no result or in-flight work between invocations: equivalence of effectful calls is not decided here, so every call repeats its effects.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body touches I/O, timers, listeners or process state; it retains nothing after it settles beyond its result, and any handle it opens is owned and released by the call or by its callees.
 */
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
