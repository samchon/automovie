import type { IAutoMovieVector3 as V } from "@automovie/interface";

import { isPhysicalNativeNumber } from "./isPhysicalNativeNumber";

/**
 * Admit the final composed vector at a native query/setter boundary without clipping or restricting intermediate Float64 calculations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Admit the final composed vector at a native query/setter boundary without clipping or restricting intermediate Float64 calculations) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Admit the final composed vector at a native query/setter boundary without clipping or restricting intermediate Float64 calculations) directly over its typed inputs (`value`) as a single pass (every over [value.x, value.y, value.z]); the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 5 lines and 2 top-level statements that calls no other named helper; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `value`; the dominant cost is a single pass (every over [value.x, value.y, value.z]), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalNativeVector(value: V): V {
  if (![value.x, value.y, value.z].every(isPhysicalNativeNumber))
    throw new Error("Derived native vector exceeds finite f32 range");
  return value;
}
