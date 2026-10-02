import { measureFaceSupportFaults } from "./measureFaceSupportFaults";

/**
 * Faults of a changed surface within a support: its triangles turned over
 * against the source, plus the pairs of the surface's triangles, one of them
 * in the support, that cross each other less those that crossed in the
 * source. A moving part that passes through skin it does not move (a nasal
 * tip lowered through the upper lip) is a fault as much as one that folds
 * through itself. Pairs entirely within the caller's
 * `contact` set are excluded. This is an inherited contact convention;
 * it also excludes crossings within one tissue if the caller groups it with
 * its neighbour, so it cannot establish that a closed mouth is valid.
 *
 * Pair identities are compared, so removing one inherited crossing cannot
 * cancel a new crossing elsewhere. Coplanar pairs and
 * pairs wholly inside the caller's contact set remain excluded. This measure
 * does not certify the excluded tissue or anatomical admission.
 *
 * @evidence contracts/common.md#principled-implementation Triangle orientation is compared against the source and each transverse crossing is compared by its ordered topology offsets, so an inherited pair is ignored while a new pair is counted even if another pair disappears. Shared vertices do not exempt actual transverse folds; the engine excludes boundary-only contact. The same topology and coordinate frame are preconditions. Coplanar and caller-designated contact pairs are not certified by this measure.
 * @evidence contracts/common.md#clear-and-simple-design Counting and affected-triangle reporting share measureFaceSupportFaults for orientation and source pair identities; the engine owns triangle intersection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document or photograph is recognized and no input is mutated. Existing explicit contact exclusions are preserved rather than replacing a result with an expected aggregate count.
 * @evidence contracts/common.md#meaningful-documentation States the source comparison, topology assumption and excluded classes that prevent this geometric count from certifying a human form.
 * @evidence contracts/modeling.md#spatial-conventions Source and result positions use metres in the same caller coordinate frame; triangle offsets address the same topology, without a coordinate conversion.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The measure defines no anatomical part or assembly.
 * @evidenceExclude contracts/modeling.md#parameter-channels The measure defines and consumes no form channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The measure emits no geometric primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The measure constructs no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The measure owns no displayed part or joint; the prepared basis and its builder own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measure carries no anatomical value or tissue model.
 * @evidenceExclude contracts/anatomy.md#permitted-range The measure reports geometric changes and admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The measure exposes no input through which a caller shapes a human form.
 */
export function faceSupportFaults(props: {
  source: readonly number[];
  positions: readonly number[];
  indices: readonly number[];
  triangles: readonly number[];
  contact?: ReadonlySet<number>;
}): number {
  const measured = measureFaceSupportFaults(props);
  return measured.turned.length + measured.crossings.length;
}
