import { transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";
import { p } from "./p";

/**
 * The sole millimetre-to-metre boundary. Every part uses the engine's same
 * transform, so GLTF export and AutoMovie viewing see identical metric buffers.
 * Geometry is already placed in the head frame; part transforms stay identity.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Places every procedural facial component in the same metric model representation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Uses the engine transform for the sole millimetre-to-metre conversion and emits an unbound mesh part with no extra part transform.
 */
export const portraitPart = (
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
