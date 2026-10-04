import type * as THREE from "three";

/**
 * Bytes a preview resident keeps alive in the page: its Three group's
 * attribute and index arrays plus any numerical arrays the renderer retains
 * beside them. A typed array counts its byte length. A plain array counts
 * eight bytes per element, the size of V8's unboxed double element; a small
 * integer array may take half of that, so the count is an upper bound. Strings,
 * object headers and textures are not counted. The page uses the sum to bound
 * its resident cache by memory rather than by how many documents it holds.
 *
 * @evidence contracts/common.md#principled-implementation Counts the arrays a resident actually holds instead of the number of documents.
 * @evidence contracts/common.md#meaningful-documentation States what is counted, the plain-array upper bound and what is left out.
 */
export function measureHumanViewerResidentBytes(
  group: THREE.Group | null,
  arrays: readonly (ArrayLike<number | null> | null | undefined)[],
): number {
  let bytes = 0;
  const count = (array: ArrayLike<number | null> | null | undefined): void => {
    if (array === null || array === undefined) return;
    bytes += ArrayBuffer.isView(array) ? array.byteLength : array.length * 8;
  };
  for (const array of arrays) count(array);
  group?.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    for (const attribute of Object.values(mesh.geometry.attributes))
      count((attribute as THREE.BufferAttribute).array);
    count(mesh.geometry.index?.array);
  });
  return bytes;
}
