/**
 * One used vertex's admitted normal binding: its raw source parent and, for
 * a feature binding, the global fixed-cell ordinal and its owned dimensionless
 * [u, v] chart over that cell's ordered corners. A raw binding has neither and
 * reads the canonical source chart.
 *
 * @evidence contracts/common.md#principled-implementation A vertex's normal is read either through its canonical chart or through one named fixed cell and chart.
 * @evidence contracts/common.md#clear-and-simple-design One field and two optional fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cell ordinals are offset into the admitted global cell list; charts are copied, never refitted.
 * @evidence contracts/common.md#meaningful-documentation States each member and what their absence means.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A binding defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Not a shaping channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A binding emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Ordinals and affine coordinates are dimensionless and carry no frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A binding belongs to one vertex of one half; sharing is decided by the cells it names.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal source lineage that is not observed directly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits numerical lineage, not a biological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Compiled or derived lineage, not a caller's shaping input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonNormalBinding {
  /** Raw parent ordinal in the source triangle tree. */
  parent: number;

  /** Global fixed normal-cell ordinal, for a feature binding. */
  cell?: number;

  /** Dimensionless [u, v] chart over that cell's corners, for a feature binding. */
  coordinates?: [number, number];
}
