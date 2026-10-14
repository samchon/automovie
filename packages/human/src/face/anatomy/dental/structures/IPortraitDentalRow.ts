import { IPortraitDentalCrown } from "./IPortraitDentalCrown";

/**
 * One upper dental arch in a local millimetre frame. Individual crown profiles
 * describe enamel only; this group owns their spacing, curve and gingival plane.
 * +X runs across the arch, +Y towards the gingiva, +Z towards the lip. The arch's
 * anterior midpoint is the origin. These are authored portrait dimensions, not
 * a dental scan or a claim of physiological reconstruction.
 *
 *
 * @evidence contracts/common.md#principled-implementation A local planar arch, individual ordered enamel crowns and separate nominal/surface gaps supply one shared placement frame.
 * @evidence contracts/common.md#clear-and-simple-design Guide semiaxes and arc spacing remain separate from the engine's actual X-directed surface separation after crown rotation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored portrait dimensions are not a dental scan; directional surface clearance retains its ray-parallel/X-order premise rather than certifying arbitrary volume packing.
 * @evidence contracts/common.md#meaningful-documentation The description states millimetres/axes, origin, crown order, gap roles and absence of physiological reconstruction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IPortraitDentalRow is an erased TypeScript contract and performs no geometry or numeric algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IPortraitDentalRow declares source inputs/results; concrete producing/consuming operations own copying and equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IPortraitDentalRow acquires no runtime task, state or handle; actual array and callback lifetimes stay with their owners.
 *
 * @author Samchon
 */
export interface IPortraitDentalRow {
  /** Positive transverse semiaxis of the arch, in mm. */
  halfWidth: number;

  /** Positive anterior-to-posterior arch semiaxis, in mm. */
  depth: number;

  /** Nonnegative clearance measured along the common arch, in millimetres. */
  gap: number;

  /**
   * Minimum inter-crown surface gap along local X, in mm, finite and nonnegative.
   * Omission is zero. The row always shifts intact crowns along X using the
   * engine's directional surface-clearance instrument. Its ray-parallel face
   * and X-ordered-sequence premises remain; it does not pack arbitrary volumes
   * around a backward-turning arch.
   */
  contactGap?: number;

  /** Ordered from anatomical right to left; each crown keeps its own dimensions. */
  crowns: readonly IPortraitDentalCrown[];
}
