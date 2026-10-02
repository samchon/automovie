import { IPortraitDentalCrown } from "./IPortraitDentalCrown";

/**
 * One upper dental arch in a local millimetre frame. Individual crown profiles
 * describe enamel only; this group owns their spacing, curve and gingival plane.
 * +X runs across the arch, +Y towards the gingiva, +Z towards the lip. The arch's
 * anterior midpoint is the origin. These are authored portrait dimensions, not
 * a dental scan or a claim of physiological reconstruction.
 *
 * @evidence contracts/common.md#principled-implementation One arch is an ellipse of two semiaxes along which ordered crowns are placed by cumulative arc length with a clearance, which is the standard planar model of a dental arch at this fidelity; the group, not the crown, owns spacing, curvature and the gingival plane.
 * @evidence contracts/common.md#clear-and-simple-design Five members: two arch semiaxes, a clearance, an optional surface gap and the crowns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type carries data only: no special case, foreign mutation or compensating path exists in it.
 * @evidence contracts/common.md#meaningful-documentation The type states the axes, that crowns are ordered right to left, that the crown profiles are enamel only, and that the dimensions are authored portrait values and not a scan.
 * @evidence contracts/modeling.md#part-identity-and-grouping The row is the group of one dental arch: it composes its crowns, owns their order, spacing, curve and gingival plane, and copies no crown's shape into itself. A crown change reaches its neighbours only through the spacing the group resolves.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are millimetres in a local frame with +X across the arch, +Y towards the gingiva and +Z towards the lip, the arch's anterior midpoint at the origin.
 * @evidenceExclude contracts/modeling.md#parameter-channels The row's numbers are dimensions of a group and not channels that vary a form from a neutral.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive; the number of crowns is the caller's and each crown's mesh size is fixed by its constructor.
 * @evidence contracts/modeling.md#shared-boundaries The proximal boundary between neighbouring crowns has one definition, `contactGap`, which the group applies to every adjacent pair through one separation of the complete surfaces; the default of zero means neighbours touch at most and never interpenetrate. The join opens only by the caller's larger gap.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint by itself; the observation belongs to the components that build the row.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing; `preparePortraitDentalRow` refuses nonpositive semiaxes, a negative gap and an empty row.
 * @evidence contracts/anatomy.md#parametric-authority Each member is a named arch dimension in millimetres or an ordered list of named crown dimensions; none addresses a vertex, curve or patch of the placed mesh.
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
   * Omission is zero: neighbouring crowns touch at most and never interpenetrate,
   * because the row always shifts intact crowns along X until their complete
   * proximal surfaces clear.
   */
  contactGap?: number;

  /** Ordered from anatomical right to left; each crown keeps its own dimensions. */
  crowns: readonly IPortraitDentalCrown[];
}
