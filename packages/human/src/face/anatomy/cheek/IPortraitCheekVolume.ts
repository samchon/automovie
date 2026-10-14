/**
 * A compact envelope of soft-tissue displacement. Lengths use millimetres.
 * Projection is a surface offset, not a measurement of fat volume or thickness.
 * Zero projection and lift retain the supplied host's existing expression.
 *
 *
 * @evidence contracts/common.md#principled-implementation Positive ellipsoidal support radii bound explicitly authored projection/lift around one bound skin anchor.
 * @evidence contracts/common.md#clear-and-simple-design Optional local offset, support dimensions and peak displacements separate attachment location from relief shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Projection represents a surface offset, not observed fat volume or tissue thickness; zero projection/lift preserves host expression.
 * @evidence contracts/common.md#meaningful-documentation The documentation states millimetres, mirrored outward offsets, omission semantics and anterior/upward displacement axes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitCheekVolume is a TypeScript-only schema and executes no guide, surface or field algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitCheekVolume declares inputs or results; copying and equivalence belong to its concrete producer/consumer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitCheekVolume acquires no runtime state or handle; array, map and callback lifetimes remain with their owning operations.
 *
 * @author Samchon
 */
export interface IPortraitCheekVolume {
  /**
   * Optional support-centre shift [outward, up, forward] from the bound skin
   * anchor, in mm. Outward is mirrored by the anatomical side; a negative first
   * coordinate moves both cheeks towards the nose. Omission retains the anchor.
   */
  offset?: [number, number, number];

  /** Positive transverse support radius in the head frame. */
  width: number;

  /** Positive vertical support radius in the head frame. */
  height: number;

  /** Positive depth support radius; limits influence through the head. */
  reach: number;

  /** Peak anterior displacement along head Z, in mm. */
  projection: number;

  /** Peak upward displacement along head Y, in mm. */
  lift: number;
}
