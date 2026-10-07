/**
 * A canonical source sample's ordered chart: the three original source
 * vertices it is read over and its dimensionless [u, v] coordinates, meaning
 * originals[0] + u (originals[1] - originals[0]) + v (originals[2] - originals[0]).
 * An original vertex repeats itself at [0, 0]; a cut point uses [t, 0].
 *
 * @evidence contracts/common.md#principled-implementation Every canonical sample, original, cut or refinement, is exactly one ordered triangle chart.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Charts are read from the captured compiled partition; nothing is fitted.
 * @evidence contracts/common.md#meaningful-documentation States both fields and the affine formula they define.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A chart defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A chart emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions IDs and affine coordinates are dimensionless and carry no frame.
 * @evidence contracts/modeling.md#shared-boundaries Both complementary skins and the normal field read a shared sample through this same chart.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourceChart {
  /** Ordered original source vertex IDs of the chart's corners. */
  originals: readonly [number, number, number];

  /** Dimensionless [u, v] coordinates over those corners. */
  coordinates: readonly [number, number];
}
