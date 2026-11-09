/**
 * An inspection camera view written as `x,y,z:tx,ty,tz` (camera position and
 * look-at target, metres), refusing anything else. Review-only: a host
 * applies it to its inspection camera and redraws the same displayed second;
 * it never changes a delivered camera plan.
 *
 * @param value The written view.
 * @returns The position and target.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (An inspection camera view written as `x,y,z:tx,ty,tz` (camera position and look-at target, metres), refusing anything else) and documents parameter `value`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (An inspection camera view written as `x,y,z:tx,ty,tz` (camera position and look-at target, metres), refusing anything else) directly over its typed inputs (`value`) as nested iteration of depth 2 (map over value .split(":"); map over part.split(","); some over parts), delegating to `value .split`, `part.split`, `parts.some`, `p.every`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 3, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 16 lines and 3 top-level statements that reuses `value .split`, `part.split`, `parts.some`, `p.every` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 2 type assertion(s), 0 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is nested iteration of depth 2 (map over value .split(":"); map over part.split(","); some over parts), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function parseAutoMovieInspectionView(value: string): {
  position: [number, number, number];
  target: [number, number, number];
} {
  const parts: number[][] = value
    .split(":")
    .map((part: string): number[] => part.split(",").map(Number));
  if (
    parts.length !== 2 ||
    parts.some(
      (p: number[]): boolean => p.length !== 3 || !p.every(Number.isFinite),
    )
  )
    throw new Error("An inspection view is x,y,z:tx,ty,tz");
  return {
    position: parts[0] as [number, number, number],
    target: parts[1] as [number, number, number],
  };
}
