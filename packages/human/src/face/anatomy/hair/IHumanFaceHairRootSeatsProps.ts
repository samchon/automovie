import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * Current source surface on which sampled roots are seated.
 *
 * @evidence contracts/common.md#principled-implementation Original triangle indices and current XYZ coordinates let the seating owner carry stable barycentric root attachments to current shape.
 * @evidence contracts/common.md#clear-and-simple-design One input exposes correspondence without copying unrelated face material or attachment arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current coordinates must share original incidence; the type does not repair or establish source correspondence.
 * @evidence contracts/common.md#meaningful-documentation roots retain subtype identity, indices are corner incidence, and current coordinates are head-frame metres.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Skin-host compilation and per-root interpolation belong to seatHumanFaceHairRoots.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The input itself caches no live frame; the producer builds one host shared across the root map.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns roots and coordinate arrays; seating borrows them during its synchronous evaluation.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootSeatsProps<
  T extends IHumanFaceHairRootReference,
> {
  /** Original root references and any additional sampler identity fields. */
  roots: readonly T[];

  /** Original triangle incidence over the shared current coordinates. */
  indices: readonly number[];

  /** Current flat XYZ coordinates, head-frame metres. */
  current: readonly number[];
}
