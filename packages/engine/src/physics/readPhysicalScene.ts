import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";

/**
 * Own one simultaneous native scene per controller tick. A later ownership write refreshes only its body's changed transforms, preserving snapshots already retained by fitted plans.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Own one simultaneous native scene per controller tick) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Own one simultaneous native scene per controller tick) directly over its typed inputs (`bound`, `previous`, `body`) as nested iteration of depth 2 (for-of over bound.segments; for-of over segments), delegating to `Object.create`, `rigid.translation`, `rigid.rotation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 39 lines and 3 top-level statements that reuses `Object.create`, `rigid.translation`, `rigid.rotation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 1 type assertion(s), 0 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `bound`, `previous`, `body`; the dominant cost is nested iteration of depth 2 (for-of over bound.segments; for-of over segments), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function readPhysicalScene(
  bound: Bound,
  previous?: Readonly<Record<string, Readonly<Record<string, P.ITransform>>>>,
  body?: string,
): Record<string, Record<string, P.ITransform>> {
  let result: Record<
    string,
    Record<string, P.ITransform>
  > = (previous as Record<string, Record<string, P.ITransform>>) ??
  Object.create(null);
  for (const [id, segments] of bound.segments) {
    if (body !== undefined && id !== body) continue;
    let current: Record<string, P.ITransform> =
      result[id] ?? Object.create(null);
    let owned: boolean = previous === undefined || result[id] === undefined;
    for (const [bone, rigid] of segments) {
      const position: P.ITransform["position"] = rigid.translation();
      const rotation: P.ITransform["rotation"] = rigid.rotation();
      const before: P.ITransform | undefined = current[bone];
      if (
        before &&
        before.position.x === position.x &&
        before.position.y === position.y &&
        before.position.z === position.z &&
        before.rotation.x === rotation.x &&
        before.rotation.y === rotation.y &&
        before.rotation.z === rotation.z &&
        before.rotation.w === rotation.w
      )
        continue;
      if (!owned) {
        current = { ...current };
        owned = true;
      }
      current[bone] = { position, rotation };
    }
    if (current !== result[id]) {
      if (result === previous) result = { ...result };
      result[id] = current;
    }
  }
  return result;
}
