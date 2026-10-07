/**
 * Outward styling bias and its arc-length decay on a connected hair lock.
 * This direction field is authored kinematics, not a force or tissue law.
 *
 * @evidence contracts/common.md#principled-implementation Separate outward bias and exponential arc-decay reach represent a styling direction that weakens along a lock rather than a tissue force.
 * @evidence contracts/common.md#clear-and-simple-design evaluateHumanFaceHairDirection consumes strength and reach together when adding the current surface-normal bias.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation Identifies dimensionless direction strength and metre decay distance, with authored kinematics distinguished from force.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Dimensionless outward strength and metre decay distance retain independent direction-field meanings.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerLift {
  /** Nonnegative dimensionless outward direction weight. */
  strength: number;

  /** Positive exponential decay distance along the lock, metres. */
  reach: number;
}
