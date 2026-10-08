import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { createHumanLocalModelPart } from "./createHumanLocalModelPart";
import { placeMeshPreservingFaces } from "./placeMeshPreservingFaces";

/**
 * Carry an existing local part through an owner's source-frame placement.
 * Original TRS is consumed before the placement, then a previously local
 * publication receives one new compensating frame. Identity parts retain
 * their original representation. A pure translation leaves normals intact.
 *
 * @evidence contracts/common.md#principled-implementation Consumes the original placement exactly once before the existing geometry owner runs.
 * @evidence contracts/common.md#clear-and-simple-design One adapter owns local-to-source and source-to-local representation around placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves part identity and geometry incidence without a tissue or ordinal exception.
 * @evidence contracts/common.md#meaningful-documentation States transform order, unchanged identity representation and normal ownership.
 * @evidence contracts/modeling.md#spatial-conventions Existing local TRS restores source metres before the supplied source-frame placement.
 * @evidence contracts/modeling.md#shared-boundaries Source physical correspondence passes through the existing placement owner.
 * @evidence contracts/modeling.md#emitted-geometry Preserves the supplied complete geometry and standard model transform boundary.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Copies the existing part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation Product viewports own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no anatomical dimension.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing geometry and physical guards remain authoritative.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal input.
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
