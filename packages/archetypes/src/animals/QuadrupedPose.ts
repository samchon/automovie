import type { AutoMovieArchetype } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { PrepareQuadrupedPose } from "./PrepareQuadrupedPose";
import type { QuadrupedPosePlan } from "./QuadrupedPosePlan";

/**
 * Prepare one animal for shared solved-world-chain pose emission.
 *
 * @param animal Source geometry and original contact identities; never changed.
 * @param parts Carrier of every non-bone part.
 * @param contacts Carrier of every source affordance.
 * @returns Reusable root/axial preview, exact non-limb floor support and complete-limb sampling.
 * @throws {RangeError} For invalid models, non-rigid frames, incomplete carriers, broken neutral chains or a current solved chain the source cannot close.
 * @evidence contracts/development/common.md#meaningful-documentation States source/contact ownership, one-time rigid preparation, complete world-point chains, included root placement, independent geometry/frames and refusal of unsupported geometry or closure.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the model, prepare its named generic rig once, snapshot parts/contact frames and verify neutral bar adjacency. Shared basis-aware lowering computes current FK; every requested origin and endpoint must agree with those fixed-length bars before one rigid carrier delta emits the model.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preparation owns admission, private source measurements/bindings and reusable graph/lowering metadata. read previews parents; bodyFloor uses shared carrier deltas and exact primitive/span owners without model emission; sample verifies achieved chains and delegates emission to the shared carrier owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species case, human bone, scaled geometry, per-limb root shift, stretched bar, stale contact, completed-frame cache or silent partial chain is accepted. The only positional budget is scale-dependent binary64 arithmetic error, not an authored goal gap.
 * @evidence contracts/development/implementation.md#efficient-algorithms Preparation and sampling cost O(B+P+A+V); preview costs O(B+G). Body floor costs O(B+P) without spans and O(B+P+A+S(P+A)) with the existing span locator, using shallow current records and span-only geometry. B/P/A/V/G/S count bones, parts, contacts, copied geometry values, goals and spans; four fixed chains add constant closure checks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One admitted rig/reader, neutral state, private source geometry/span records, lengths and explicit carrier copies serve every query. Model emission and body floor share the same rigid-delta owner; current frames and bounds are never cached by sampled time.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prepared owner retains O(B+P+A+V) independent source data for its lifetime; returned models/frames own their mutable geometry/transforms. No caller goal map, prior sample, process, file or global resource is retained.
 */
export function QuadrupedPose<Id extends string, Dimension extends string>(
  animal: AutoMovieArchetype<Id, Dimension>,
  parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
  contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>,
): QuadrupedPosePlan.IPrepared<Id, Dimension> {
  return PrepareQuadrupedPose.ordinary(animal, parts, contacts);
}
