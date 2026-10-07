import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness";

/**
 * The static structure that decides face buffer reuse: materials and every
 * part, with each mesh's position and normal arrays reduced to their lengths.
 * With witnesses the index and UV arrays are the witnesses' copies and every
 * other member is cloned, so the record cannot change with its source model;
 * without them (`null`) the record only borrows the candidate's arrays for one
 * comparison. Nothing is turned into text: the largest arrays are compared
 * element by element and kept once, in the witnesses.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Decides resident buffer reuse from the actual static model structure.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Reduces a face model to the structure that decides whether the displayed buffers are reused.
 */
export function connectedFaceStructure(
  model: IAutoMovieModel,
  meshes: readonly IAutoMovieMesh[],
  witnesses: readonly IConnectedFaceMeshWitness[] | null,
): unknown {
  const parts = model.parts.map((part, index) => {
    const mesh = meshes[index];
    const { positions, normals, indices, uvs, ...rest } = mesh;
    const witness = witnesses?.[index];
    return {
      ...(witnesses === null
        ? part
        : structuredClone({ ...part, geometry: undefined })),
      geometry: {
        type: part.geometry.type,
        mesh: {
          ...(witnesses === null ? rest : structuredClone(rest)),
          positions: positions.length,
          normals: normals?.length,
          indices: witness === undefined ? indices : witness.indices,
          uvs: witness === undefined ? uvs : witness.uvs,
        },
      },
    };
  });
  return {
    materials:
      witnesses === null ? model.materials : structuredClone(model.materials),
    parts,
  };
}
