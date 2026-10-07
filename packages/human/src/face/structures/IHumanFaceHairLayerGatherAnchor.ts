/**
 * Angular ray locating one connected hair tie on its shared neutral scalp chart.
 * The current scalp supplies the actual hit, not a saved point or vertex.
 *
 * @evidence contracts/common.md#principled-implementation Polar and azimuth locate a ray in the neutral source chart; the resolver derives its current barycentric attachment instead of accepting a personal point.
 * @evidence contracts/common.md#clear-and-simple-design resolveHumanFaceHairGatherAnchor consumes these two angles against the shared scalp domain.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation States polar from +Y and azimuth from +Z toward +X in radians.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Polar and azimuth retain the shared-chart ray location in radians, not a personal point.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerGatherAnchor {
  /** Polar angle from +Y, radians. */
  polar: number;

  /** Azimuth from +Z toward +X, radians. */
  azimuth: number;
}
