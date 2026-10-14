import type { IAutoMovieMesh } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness.js";

/**
 * Whether a mesh is exactly the one a witness certified. Equality is exact
 * rather than a hash: equal input arrays and the same closure obligation have
 * the same Float32 conversion and topology verdict. Vertex colours are omitted
 * because neither geometry gate reads them; the numerical model admission and
 * GPU material preparation still do.
 *
 * @evidence contracts/common.md#principled-implementation Requires an existing witness with equal closure and compares exact source positions/normals/indices/UVs plus physical partition meaning. For admitted finite numerical buffers, equal inputs have the same Float32/topology gate result; unsupported NaN elements do not compare equal by the strict element comparator.
 * @evidence contracts/common.md#clear-and-simple-design One predicate owns geometry-verdict reuse, keeping appearance/static allocation equivalence with connectedFaceStructure and material admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No hash or desired vertex count replaces actual element/partition equality. Omitted color is justified because these two geometry gates do not consume it, not because material colors are irrelevant to the renderer.
 * @evidence contracts/common.md#meaningful-documentation The comment lists exact buffer/closure dependencies and separates geometry validation from color/material processing; missing witness is explicitly nonmatching.
 * @evidence contracts/performance.md#efficient-algorithms Stops at the first mismatched flag/length/element and otherwise visits complete recorded arrays plus physical partition comparison; time scales with that input population and no array copy is needed.
 * @evidence contracts/performance.md#reuse-equivalent-work A true predicate reuses the previous geometry verdict only for all matching dependencies, while any changed array or closure requires fresh full preparation gates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows mesh and witness and retains no input or cache; their frame/resident owners control witness memory and native resource lifetime.
 */
export function matchesConnectedFaceMeshWitness(
  mesh: IAutoMovieMesh,
  closed: boolean,
  witness: IConnectedFaceMeshWitness | undefined,
): boolean {
  if (witness === undefined || closed !== witness.closed) return false;
  const same: (
    values: readonly number[] | null,
    previous: readonly number[] | null,
  ) => boolean = (
    values: readonly number[] | null,
    previous: readonly number[] | null,
  ): boolean =>
    values === null || previous === null
      ? values === previous
      : values.length === previous.length &&
        values.every(
          (value: number, index: number): boolean => value === previous[index],
        );
  return (
    same(mesh.positions, witness.positions) &&
    same(mesh.normals, witness.normals) &&
    same(mesh.indices, witness.indices) &&
    same(mesh.uvs, witness.uvs) &&
    witness.physical(mesh)
  );
}
