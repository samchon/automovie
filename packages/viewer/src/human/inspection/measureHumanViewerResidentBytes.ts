import type * as THREE from "three";

/**
 * Counted array-byte weight of a preview resident: its Three group's attribute and index arrays plus any numerical arrays the renderer retains beside them. A typed array counts its byte length. A plain array counts eight bytes per element as a numerical storage estimate. Repeated views or references are counted repeatedly; this is not a measured memory upper bound. Strings, object headers, textures and backing-store alias identity are not measured. The page uses this declared weight for its resident cache budget; actual page/worker heap observation belongs to separate readers.
 *
 * @evidence contracts/common.md#principled-implementation Supplied retained numerical arrays and each mesh attribute/index contribute their actual view byteLength or declared eight-byte plain-element weight.
 * @evidence contracts/common.md#clear-and-simple-design One counter and count helper traverse existing resident arrays without copying values or querying another memory authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current producers supply ordinary BufferAttribute arrays; an external interleaved attribute's data.array is not counted by this reader. Duplicate views and omitted object/texture storage keep this weight distinct from a physical memory bound.
 * @evidence contracts/common.md#meaningful-documentation Documentation states the weight policy, repeated-reference accounting, exclusions and separate actual heap observation.
 * @evidence contracts/performance.md#efficient-algorithms The function visits supplied arrays and scene attributes once and reads lengths instead of scanning elements, so cost follows array/mesh counts rather than geometry value count.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing views are read without allocating alternate arrays, but equal or aliased references are intentionally not deduplicated as a physical backing-store measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number and traversal callback are local; group and arrays are borrowed and no buffers, textures or resident cache entries are acquired by this accounting helper.
 */
export function measureHumanViewerResidentBytes(
  group: THREE.Group | null,
  arrays: readonly (ArrayLike<number | null> | null | undefined)[],
): number {
  let bytes: number = 0;
  const count: (array: ArrayLike<number | null> | null | undefined) => void = (array: ArrayLike<number | null> | null | undefined): void => {
    if (array === null || array === undefined) return;
    bytes += ArrayBuffer.isView(array) ? array.byteLength : array.length * 8;
  };
  for (const array of arrays) count(array);
  group?.traverse((object: THREE.Object3D): void => {
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    for (const attribute of Object.values(mesh.geometry.attributes))
      count((attribute as THREE.BufferAttribute).array);
    count(mesh.geometry.index?.array);
  });
  return bytes;
}
