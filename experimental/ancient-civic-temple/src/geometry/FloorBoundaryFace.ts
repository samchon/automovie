import type { IAutoMovieVector3 } from "@automovie/interface";


/** One planar face of a floor slab compartment, published as a boundary face. */
export interface FloorBoundaryFace {
  /** Face identity. */
  id: string;
  /** Space whose floor the slab carries. */
  space: string;
  /** Identity of the slab compartment the face bounds. */
  slab: string;
  /** Surface identity the face's material binds to. */
  surface: string;
  /** Side of the slab the face lies on. */
  direction: "west" | "east" | "bottom" | "top" | "north" | "south";
  /** Face corners in world metres. */
  corners: IAutoMovieVector3[];
}
