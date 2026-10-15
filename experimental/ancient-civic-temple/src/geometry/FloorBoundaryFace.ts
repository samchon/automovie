import type { IAutoMovieVector3 } from "@automovie/interface";


export interface FloorBoundaryFace {
  id: string;
  space: string;
  slab: string;
  surface: string;
  direction: "west" | "east" | "bottom" | "top" | "north" | "south";
  corners: IAutoMovieVector3[];
}
