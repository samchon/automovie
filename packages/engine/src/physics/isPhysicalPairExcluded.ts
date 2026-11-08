import type { IAutoMovieContactReceipt } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { isPhysicalProfilePairExcluded } from "./isPhysicalProfilePairExcluded";

/**
 * Resolve only provider-declared overlapping pivot neighbours, never all self contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Resolve only provider-declared overlapping pivot neighbours, never all self contact) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Resolve only provider-declared overlapping pivot neighbours, never all self contact) directly over its typed inputs (`input`, `bound`, `first`, `second`) as a single pass (find over input.bodies), delegating to `isPhysicalProfilePairExcluded`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 18 lines and 3 top-level statements that reuses `isPhysicalProfilePairExcluded` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `bound`, `first`, `second`; the dominant cost is a single pass (find over input.bodies), performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function isPhysicalPairExcluded(
  input: AutoMoviePhysicalSimulation.IInput,
  bound: Bound,
  first: number,
  second: number,
): boolean {
  const a: IAutoMovieContactReceipt["a"] | undefined =
    bound.colliders.get(first);
  const b: IAutoMovieContactReceipt["a"] | undefined =
    bound.colliders.get(second);
  return (
    !!a &&
    !!b &&
    a.body === b.body &&
    isPhysicalProfilePairExcluded(
      input.bodies.find(
        (body: (typeof input.bodies)[number]): boolean => body.id === a.body,
      )!.profile,
      a.bone,
      b.bone,
    )
  );
}
