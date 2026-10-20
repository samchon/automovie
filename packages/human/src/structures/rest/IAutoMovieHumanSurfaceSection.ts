import { IAutoMovieHumanSurfaceEnvelope } from "./IAutoMovieHumanSurfaceEnvelope";

/** A horizontal neutral T-rest section with independent breadth, depth and convex-tape perimeter. */
export interface IAutoMovieHumanSurfaceSection extends IAutoMovieHumanSurfaceEnvelope {
  /** Height above the shared standing surface, in millimetres. */
  heightMm: number;

  /** Fraction of depth anterior to the shared skeletal support axis, in (0,1). */
  anteriorFraction: number;
}
