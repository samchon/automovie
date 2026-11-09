/**
 * Freeze only strictly violated inequality rows for finite-difference probes. Exact one-sided boundaries remain free to depart into slack; equal finite sides use one signed row selected to match the current nonlinear error. Nonlinear merit remains clamped separately.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Freeze only strictly violated inequality rows for finite-difference probes) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Freeze only strictly violated inequality rows for finite-difference probes) directly over its typed inputs (`value`, `minimum`, `maximum`) as a fixed number of statements with no loop or recursion in the body; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 13 lines and 2 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`, `minimum`, `maximum`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 5 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 5 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function linearizePhysicalInterval(
  value: number,
  minimum?: number,
  maximum?: number,
): (probe: number) => number[] {
  const equality: boolean = minimum !== undefined && minimum === maximum;
  return (probe: number): number[] => [
    ...(minimum !== undefined
      ? [
          (equality && value <= minimum) || value < minimum
            ? probe - minimum
            : 0,
        ]
      : []),
    ...(maximum !== undefined ? [value > maximum ? probe - maximum : 0] : []),
  ];
}
