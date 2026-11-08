import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { physicalNativeVector } from "./physicalNativeVector";

/**
 * Copy display state without retaining native wrappers or changing solver order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Copy display state without retaining native wrappers or changing solver order) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Copy display state without retaining native wrappers or changing solver order) directly over its typed inputs (`bound`, `seconds`) as a single pass (for-of over bound.bodies), delegating to `Object.create`, `key.indexOf`, `key.slice`, `body.translation`, `body.rotation`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 20 lines and 3 top-level statements that reuses `Object.create`, `key.indexOf`, `key.slice`, `body.translation`, `body.rotation` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `bound`, `seconds`; the dominant cost is a single pass (for-of over bound.bodies), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function readPhysicalFrame(bound: Bound, seconds: number): Cache.IFrame {
  const bodies: Cache.IFrame["bodies"] = Object.create(null);
  for (const [key, body] of bound.bodies) {
    const slash: number = key.indexOf("/");
    const id: string = key.slice(0, slash);
    const bone: string = key.slice(slash + 1);
    const position: IAutoMovieVector3 = { ...body.translation() };
    (bodies[id] ??= Object.create(null))[bone] = {
      position,
      rotation: { ...body.rotation() },
      velocity: {
        ...physicalNativeVector(
          body.velocityAtPoint(physicalNativeVector(position)),
        ),
      },
      angularVelocity: { ...body.angvel() },
    };
  }
  return { seconds, bodies };
}
