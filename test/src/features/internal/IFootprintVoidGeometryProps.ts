import { footprintConvexPieces, surfaceFootprint } from "@automovie/engine";
import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Original authored region inputs and numeric helpers shared with the owning footprint test's geometric and downstream-consumer assertions.
 */
export interface IFootprintVoidGeometryProps {
  /** Prepared outer and void rings for the authored plate. */
  holed: ReturnType<typeof surfaceFootprint>;

  /** The same plate as a space queried by downstream readers. */
  holedSpace: IAutoMovieSpace;

  /** Eight-by-eight plate with its four-by-four atrium. */
  plate: IAutoMovieSurface;

  /** Concave L whose notch is the upper-right quadrant. */
  ell: IAutoMovieSurface;

  /** Holed diamond whose outer slab bands close to points. */
  diamond: IAutoMovieSurface;

  /** The plate with authored heightfield relief. */
  relief: IAutoMovieSurface;

  /** Existing world-point constructor; default height is zero. */
  v: (x: number, z: number, y?: number) => IAutoMovieVector3;

  /** Existing building fixture containing the authored plate. */
  gallery: () => IAutoMovieBuiltEnvironment;

  /** Wrap one authored surface in the existing walkable space record. */
  spaceOf: (surface: IAutoMovieSurface) => IAutoMovieSpace;

  /** Shoelace area of the emitted convex piece, in square metres. */
  pieceArea: (
    piece: ReturnType<typeof footprintConvexPieces>[number],
  ) => number;
}
