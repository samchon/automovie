import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";

/**
 * Resolve the last causal native authority change for one segment. Live caches and solver-free archives share this exact arbitrary-time selection; no authored clock reconstructs contact activation or return completion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Resolve the last causal native authority change for one segment) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Resolve the last causal native authority change for one segment) directly over its typed inputs (`events`, `duration`, `body`, `bone`, `seconds`) as a single pass (for loop bounded by index >= 0), delegating to `Number.isFinite`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 10 lines and 3 top-level statements that reuses `Number.isFinite` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 1 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `events`, `duration`, `body`, `bone`, `seconds`; the dominant cost is a single pass (for loop bounded by index >= 0), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function samplePhysicalOwnership(
  events: readonly Cache.IOwnership[],
  duration: number,
  body: string,
  bone: string,
  seconds: number,
): Cache.IOwnership["kind"] {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > duration)
    throw new Error("Physics ownership read outside completed film");
  for (let index: number = events.length - 1; index >= 0; index--) {
    const entry: Cache.IOwnership = events[index]!;
    if (entry.body === body && entry.bone === bone && entry.seconds <= seconds)
      return entry.kind;
  }
  throw new Error(`Physics ownership segment missing: ${body}/${bone}`);
}
