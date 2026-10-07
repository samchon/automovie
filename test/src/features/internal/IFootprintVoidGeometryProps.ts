import type { footprintConvexPieces, surfaceFootprint } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieSpace, IAutoMovieSurface, IAutoMovieVector3 } from "@automovie/interface";

/** Original footprint scenario inputs shared by geometric and downstream-consumer assertions. */
export interface IFootprintVoidGeometryProps {
  holed: ReturnType<typeof surfaceFootprint>;
  holedSpace: IAutoMovieSpace;
  plate: IAutoMovieSurface;
  ell: IAutoMovieSurface;
  diamond: IAutoMovieSurface;
  relief: IAutoMovieSurface;
  v: (x: number, z: number, y?: number) => IAutoMovieVector3;
  gallery: () => IAutoMovieBuiltEnvironment;
  spaceOf: (surface: IAutoMovieSurface) => IAutoMovieSpace;
  pieceArea: (piece: ReturnType<typeof footprintConvexPieces>[number]) => number;
}
