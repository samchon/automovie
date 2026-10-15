import { type IAutoMovieSubdivisionSurface } from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";

import { subdivisionPoint } from "./subdivisionPoint";

/** The limit normal a surface assigns to vertex `vertex` in its first face, by the face-varying normal indices. */
export function subdivisionCornerNormal(
  surface: IAutoMovieSubdivisionSurface,
  vertex: number,
): IAutoMovieVector3 {
  return subdivisionPoint(
    surface.normals,
    surface.normalFaces[surface.faces.indexOf(vertex)]!,
  );
}
