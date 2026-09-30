import { transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { millimetrePoint as p } from "./millimetrePoint";

/**
 * The sole millimetre-to-metre boundary. Every part uses the engine's same
 * transform, so GLTF export and AutoMovie viewing see identical metric buffers.
 * Geometry is already placed in the head frame; part transforms stay identity.
 */
export const createMetricMeshPart = (
  id: string,
  mesh: IAutoMovieMesh,
  finish: string,
): IAutoMovieModelPart & {
  geometry: { type: "mesh"; mesh: IAutoMovieMesh };
} => ({
  id,
  name: id,
  material: finish,
  attachedBone: null,
  transform: null,
  geometry: {
    type: "mesh",
    mesh: transformAutoMovieMesh(mesh, { scale: p(0.001, 0.001, 0.001) }),
  },
});
