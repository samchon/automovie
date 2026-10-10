import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { createHumanLocalModelPart } from "./createHumanLocalModelPart";
import { placeMeshPreservingFaces } from "./placeMeshPreservingFaces";

/**
 * Carry an existing local part through an owner's source-frame placement.
 * Original TRS is consumed before the placement, then a previously local
 * publication receives one new compensating frame. Identity parts retain
 * their original representation. A pure translation leaves normals intact.
 */
export function placeHumanLocalModelPart(
  part: IAutoMovieModelPart,
  place: (mesh: IAutoMovieMesh) => IAutoMovieMesh,
): IAutoMovieModelPart {
  if (part.geometry.type !== "mesh")
    throw new Error("Local human placement requires a mesh part: " + part.id);
  let mesh = part.geometry.mesh;
  const transform = part.transform;
  if (transform !== null) {
    const translationOnly = transform.rotation.x === 0 && transform.rotation.y === 0 &&
      transform.rotation.z === 0 && transform.rotation.w === 1 &&
      transform.scale.x === 1 && transform.scale.y === 1 && transform.scale.z === 1;
    if (translationOnly) {
      const shift = [transform.translation.x, transform.translation.y, transform.translation.z];
      mesh = { ...mesh, positions: mesh.positions.map((value, at) => value + shift[at % 3]) };
    } else mesh = placeMeshPreservingFaces(mesh, transform);
  }
  const placed: IAutoMovieModelPart = {
    ...part,
    geometry: { type: "mesh", mesh: place(mesh) },
    transform: null,
  };
  return transform === null ? placed : createHumanLocalModelPart(placed);
}
