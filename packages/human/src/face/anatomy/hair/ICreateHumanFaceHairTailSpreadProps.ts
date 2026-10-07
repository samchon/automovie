import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Numerical tail frame, derived per-lock phase and shared spread target.
 * The gather stage supplies actual root and entry geometry; the tail owner
 * derives its cross-section direction without authored strand positions.
 *
 * @evidence contracts/common.md#principled-implementation Axis and attachment geometry distinguish the tail frame from the radius and arc-length reach; phase and radial fraction retain the existing deterministic population distribution.
 * @evidence contracts/common.md#clear-and-simple-design The gather stage passes one spread operation to createHumanFaceHairTailSpread after tie entry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Root, entry and population phase are derived by the existing gather stage rather than supplied as personal styling paths.
 * @evidence contracts/common.md#meaningful-documentation Separates head-frame metre geometry, dimensionless sequence values and the metre spread transition.
 * @evidence contracts/modeling.md#spatial-conventions Axis is a head-frame direction; anchor, entry, root, radius and reach use metres, phase uses radians and radialFraction is dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry for an existing scalp and hair population without assigning a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Internal compiler state preserves the hairstyle document's controls and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The free-tail derivative owner uses this input to derive direction changes; this record emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source admission and hair-contact construction own topology; this record changes neither.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns the displayed assembly; this numerical carrier supplies no observed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns source qualification; this carrier introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Hairstyle admission retains numerical controls and bounds; this record adds no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source and derived geometry are not personal authoring fields.
 * @author Samchon
 */
export interface ICreateHumanFaceHairTailSpreadProps {
  /** Nonzero tail direction in the head frame. */
  axis: IAutoMovieVector3;

  /** Current head-frame tie point in metres. */
  anchor: IAutoMovieVector3;

  /** Current head-frame tail entry point in metres. */
  entry: IAutoMovieVector3;

  /** Current head-frame root point in metres. */
  root: IAutoMovieVector3;

  /** Derived sequence phase in radians. */
  phase: number;

  /** Derived dimensionless sequence radius fraction. */
  radialFraction: number;

  /** Requested tail cross-section radius in metres. */
  radius: number;

  /** Tail centreline transition distance in metres. */
  reach: number;
}
