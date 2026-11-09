import type { auditPhysicalOutcomes as Audit } from "./auditPhysicalOutcomes";
import { samplePhysicalContactEvents } from "./samplePhysicalContactEvents";

/**
 * Refuse invalid event windows, observed times and receipt authority before evaluating outcome promises.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Refuse invalid event windows, observed times and receipt authority before evaluating outcome promises) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Refuse invalid event windows, observed times and receipt authority before evaluating outcome promises) directly over its typed inputs (`input`) as nested iteration of depth 2 (for-of over input.actions; every over Array.from(action.actorShapes); every over Array.from(action.targetShapes)), delegating to `value.trim`, `Number.isFinite`, `Array.isArray`, `name`, `time`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (4 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 51 lines and 7 top-level statements that reuses `value.trim`, `Number.isFinite`, `Array.isArray`, `name`, `time` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (for-of over input.actions; every over Array.from(action.actorShapes); every over Array.from(action.targetShapes)), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function admitPhysicalOutcomes(input: Audit.IInput): void {
  const name: (value: string) => boolean = (value: string): boolean =>
    typeof value === "string" && !!value.trim();
  const time: (seconds: number, tolerance: number) => boolean = (
    seconds: number,
    tolerance: number,
  ): boolean =>
    Number.isFinite(seconds) &&
    seconds >= 0 &&
    Number.isFinite(tolerance) &&
    tolerance >= 0;
  if (
    !Array.isArray(input.actions) ||
    !Array.isArray(input.falls) ||
    !Array.isArray(input.contacts) ||
    !input.observedFalls ||
    Array.isArray(input.observedFalls) ||
    typeof input.missDistance !== "function" ||
    typeof input.allowUnplanned !== "function"
  )
    throw new Error("Invalid physical outcome population");
  for (const action of input.actions)
    if (
      !action ||
      !name(action.id) ||
      !time(action.seconds, action.tolerance) ||
      !name(action.actor) ||
      !name(action.target) ||
      !["contact", "miss"].includes(action.expected) ||
      !["geometric", "solver"].includes(action.source) ||
      !Array.isArray(action.actorShapes) ||
      !action.actorShapes.length ||
      !Array.from(action.actorShapes).every(name) ||
      !Array.isArray(action.targetShapes) ||
      !action.targetShapes.length ||
      !Array.from(action.targetShapes).every(name)
    )
      throw new Error("Invalid physical outcome promise");
  for (const fall of input.falls)
    if (
      !fall ||
      !name(fall.id) ||
      !name(fall.body) ||
      !time(fall.seconds, fall.tolerance)
    )
      throw new Error("Invalid physical fall promise");
  for (const [body, seconds] of Object.entries(input.observedFalls))
    if (!name(body) || !Number.isFinite(seconds) || seconds < 0)
      throw new Error("Invalid observed physical fall time");
  for (const receipt of input.contacts) samplePhysicalContactEvents(receipt, 0);
}
