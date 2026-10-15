import type { IAutoMovieVector3 } from "@automovie/interface";


/** One planar polygon of emitted wall, roof or ground surface. */
export interface WallFace {
  /** Complete surface identity the face belongs to. */
  surface: string;
  /** Face corners in world metres, in winding order. */
  corners: IAutoMovieVector3[];
}
