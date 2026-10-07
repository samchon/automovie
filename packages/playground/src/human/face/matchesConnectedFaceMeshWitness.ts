import type { IAutoMovieMesh } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness";

/**
 * Whether a mesh is exactly the one a witness certified. Equality is exact
 * rather than a hash: equal input arrays and the same closure obligation have
 * the same Float32 conversion and topology verdict. Vertex colours are omitted
 * because neither geometry gate reads them; the numerical model admission and
 * GPU material preparation still do.
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Reuses a gate verdict only for exactly the certified arrays.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Decides whether a mesh is exactly the certified one so its verdict may be reused.
 */
export function matchesConnectedFaceMeshWitness(
  mesh: IAutoMovieMesh,
  closed: boolean,
  witness: IConnectedFaceMeshWitness | undefined,
): boolean {
  if (witness === undefined || closed !== witness.closed) return false;
  const same = (
    values: readonly number[] | null,
    previous: readonly number[] | null,
  ): boolean =>
    values === null || previous === null
      ? values === previous
      : values.length === previous.length &&
        values.every((value, index) => value === previous[index]);
  return (
    same(mesh.positions, witness.positions) &&
    same(mesh.normals, witness.normals) &&
    same(mesh.indices, witness.indices) &&
    same(mesh.uvs, witness.uvs) &&
    witness.physical(mesh)
  );
}
