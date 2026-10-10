import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Numerical tail frame, derived per-lock phase and shared spread target.
 * The gather stage supplies actual root and entry geometry; the tail owner
 * derives its cross-section direction without authored strand positions.
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

  /** Tail centreline transition distance in metres. */
  reach: number;
}
