/**
 * Polar hairline mask of a connected numerical hair layer.
 * Squared azimuth weights blend the four angles and only reduce shared growth.
 *
 * @evidence contracts/common.md#principled-implementation Four quadrant polar limits express a growth mask without introducing root positions; humanFaceHairlineBoundary blends them by squared azimuth components.
 * @evidence contracts/common.md#clear-and-simple-design The four front, back and paired-side limits belong to one mask read by the root sampler.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation Explains absolute polar limits and how the mask only reduces the registered growth domain.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Four absolute polar angles retain the quadrant mask; they are not neutral-zero deformation weights.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerHairline {
  /** Anterior polar angle from +Y, in [0,pi] radians. */
  front: number;

  /** Anatomical-left polar angle from +Y, in [0,pi] radians. */
  left: number;

  /** Anatomical-right polar angle from +Y, in [0,pi] radians. */
  right: number;

  /** Posterior polar angle from +Y, in [0,pi] radians. */
  back: number;
}
