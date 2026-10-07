/**
 * Numerical guide hierarchy of a connected hair population.
 * Guides and interpolated locks share native root identities and the part side.
 *
 * @evidence contracts/common.md#principled-implementation Guide fraction and same-side neighbour count distinguish integrated paths from interpolated locks; optional clump adds tip attraction without replacing native roots.
 * @evidence contracts/common.md#clear-and-simple-design The hair builder selects the guide population and interpolates remaining roots using this record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation Explains integrated fraction, integral neighbour population and optional dimensionless clumping.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Fraction and neighbour count retain the guide representation; optional clump retains its dimensionless tip-attraction meaning.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerGuides {
  /** Fraction of roots integrated as guides, in (0,1]. */
  fraction: number;

  /** Nearest same-side guide population, integral in [1,8]. */
  neighbours: number;

  /** Optional tip attraction toward the nearest guide, in [0,1]. */
  clump?: number;
}
