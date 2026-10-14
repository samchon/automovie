import type { IAutoMovieMesh, IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness.js";

/**
 * The static structure that decides face buffer reuse: materials and every
 * part, with each mesh's position and normal arrays reduced to their lengths.
 * With witnesses the index and UV arrays are the witnesses' copies and every
 * other member is cloned, so the record cannot change with its source model;
 * without them (`null`) the record only borrows the candidate's arrays for one
 * comparison. Nothing is turned into text: the largest arrays are compared
 * element by element and kept once, in the witnesses.
 *
 * @evidence contracts/common.md#principled-implementation Builds a part-ordered static reuse record with coordinate/normal lengths, actual material/static part values and exact indices/UVs. With witnesses it clones other records and borrows copied witness buffers; null uses candidate references only for immediate comparison. Mesh and witness arrays must correspond to model part order.
 * @evidence contracts/common.md#clear-and-simple-design Static configuration projection is separate from exact geometry-gate witnesses, allowing coordinates to change while the resident renderer decides whether native buffers/materials can be reused.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record contains actual configuration and topology rather than prose fingerprints or a fixture model key. Colors and physical metadata remain in static rest fields; no full-model text serialization hides large array costs.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes borrowed candidate comparison from retained copied structure and names the coordinate/normal-length reduction and witness buffer sharing.
 * @evidence contracts/performance.md#efficient-algorithms Visits P parts and clones their non-coordinate records/materials when retaining structure; exact static buffer lengths contribute copied/compared data cost. Witness indices/UVs are reused instead of creating duplicate retained arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work The retained record represents one resident's static allocation dependencies, while candidate records are compared with sameHumanPreviewValue. A matching record permits native buffer reuse but does not skip current coordinate/physical witness checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retained structure follows resident lifetime and can hold copied metadata/array data proportional to model size. Null candidate structure borrows source values for its immediate compare, owns no GPU handle and must not become an untracked retained snapshot.
 */
export function connectedFaceStructure(
  model: IAutoMovieModel,
  meshes: readonly IAutoMovieMesh[],
  witnesses: readonly IConnectedFaceMeshWitness[] | null,
): unknown {
  /** Static part allocation data; coordinate values are supplied at publication. */
  type PartStructure = Omit<IAutoMovieModelPart, "geometry"> & {
    geometry: {
      type: IAutoMovieModelPart["geometry"]["type"];
      mesh: Omit<IAutoMovieMesh, "positions" | "normals" | "indices" | "uvs"> & {
        positions: number;
        normals: number | undefined;
        indices: readonly number[] | null;
        uvs: readonly number[] | null;
      };
    };
  };

  const parts: PartStructure[] = model.parts.map((part: IAutoMovieModelPart, index: number): PartStructure => {
    const mesh: IAutoMovieMesh = meshes[index];
    const { positions, normals, indices, uvs, ...rest }: IAutoMovieMesh = mesh;
    const witness: IConnectedFaceMeshWitness | undefined = witnesses?.[index];
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
