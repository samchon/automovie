import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Numerical tail frame, derived per-lock phase and shared spread target. The gather stage supplies actual root and entry geometry; the tail owner derives its cross-section direction without authored strand positions.
 *
 * @evidence contracts/common.md#principled-implementation A derived per-lock phase and radius fraction select a transverse target around a nonzero tail axis, retaining current root and tie-entry geometry.
 * @evidence contracts/common.md#clear-and-simple-design The numerical tail frame keeps input geometry and spread dimensions together, without adding an authored strand-position interface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequence-derived phase and radial fraction represent supported deterministic sampling rather than fixture-specific tail coordinates.
 * @evidence contracts/common.md#meaningful-documentation The fields identify head-frame metre positions, radians, dimensionless radius fraction and positive transition distance used by the spread derivative.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This eight-field tail input chooses no integration strategy; the spread factory performs fixed vector arithmetic and returns a field.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Per-lock entry geometry distinguishes spread fields, and this schema declares no merging of fields that happen to share a tail axis.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Axis and position references carry no native ownership; lifetime is limited to the caller and any returned field retaining their derived frame.
 *
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

  /** Positive tail centreline transition distance in metres. */
  reach: number;
}
