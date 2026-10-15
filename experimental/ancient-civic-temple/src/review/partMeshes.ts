import { tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieMesh } from "@automovie/interface";

/** Converts model part geometry to meshes, using public tessellation for primitives. */

export const partMeshes = (model: IAutoMovieModel): IAutoMovieMesh[] => model.parts.map((part) => part.geometry.type === "mesh" ? part.geometry.mesh : tessellateToMesh(part.geometry.shape));
