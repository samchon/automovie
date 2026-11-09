import type { AutoMoviePerformanceMode } from "@automovie/interface";

/**
 * Resolve an explicit scene policy and optional body override without content-name defaults.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Resolve an explicit scene policy and optional body override without content-name defaults) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Resolve an explicit scene policy and optional body override without content-name defaults) directly over its typed inputs (`scene`, `body`) as a single pass (every over [selected.impulse, selected.compliance]), delegating to `Number.isFinite`, `structuredClone`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 22 lines and 4 top-level statements that reuses `Number.isFinite`, `structuredClone` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `scene`, `body`; the dominant cost is a single pass (every over [selected.impulse, selected.compliance]), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolvePhysicalPerformanceMode(
  scene: AutoMoviePerformanceMode,
  body?: AutoMoviePerformanceMode,
): AutoMoviePerformanceMode {
  const selected: AutoMoviePerformanceMode = body ?? scene;
  if (
    !selected ||
    !["kinematic", "simulated", "exaggerated"].includes(selected.kind)
  )
    throw new Error("Invalid physical performance policy");
  if (
    selected.kind === "exaggerated" &&
    (![selected.impulse, selected.compliance].every(
      (value: number): boolean => Number.isFinite(value) && value > 0,
    ) ||
      !Number.isFinite(selected.gravity) ||
      selected.gravity < 0 ||
      typeof selected.reason !== "string" ||
      !selected.reason.trim())
  )
    throw new Error(
      "Exaggerated performance requires explicit finite factors and a reason",
    );
  return structuredClone(selected);
}
