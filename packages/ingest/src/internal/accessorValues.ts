import type { Accessor } from "@gltf-transform/core";

/**
 * Read a parsed glTF accessor as plain numbers in the values it means.
 *
 * A normalized integer accessor stores `round(value * max)`, which glTF allows for animation outputs (rotation and weights) and, under `KHR_mesh_quantization`, for positions and morph deltas. Copying its raw array would hand consumers 32767 where the file means 1, so such an accessor is decoded element by element through `Accessor.getElement`, which applies glTF's decoding (`max(c / max, -1)` for signed and `c / max` for unsigned components). Every other accessor, including non-normalized quantized integers whose scale lives in the node transform, is copied verbatim.
 *
 * @param accessor Accessor whose data is resident in the parsed document.
 * @returns A new flat array in element order, or `null` when the accessor holds no array data; the caller supplies a valid accessor layout.
 *
 * @evidence contracts/common.md#principled-implementation glTF defines normalized integer decoding per component type, and `Accessor.getElement` applies exactly that, so the helper delegates normalized accessors to it and copies any other accessor verbatim with `Array.from`.
 * @evidence contracts/common.md#clear-and-simple-design One helper serves node animation import and face template import, the two places that copy accessor data into plain number arrays.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-normalized quantized integers are deliberately copied raw because their scale lives in the node transform, and no component type is special-cased beyond glTF's own normalization flag.
 * @evidence contracts/common.md#meaningful-documentation The documentation states which accessors glTF lets be normalized, the decoding formulas, the raw-copy case and its reason, the result layout, and what `null` means.
 * @evidence contracts/performance.md#efficient-algorithms Linear in count times element size, with one result array and one reused element buffer for normalized data, and a single typed-array copy otherwise.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call creates an independent array; shared animation samplers are deliberately read again per track, and mutable Document data prevents a retained cache without a caller-owned invalidation contract.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The element buffer is released on return; the result array, proportional to the accessor's component count, is owned by the caller and nothing is retained by the helper.
 * @author Samchon
 */
export const accessorValues: (accessor: Accessor) => number[] | null = (accessor: Accessor): number[] | null => {
  const array: ReturnType<Accessor["getArray"]> = accessor.getArray();
  if (array === null) return null;
  if (accessor.getNormalized() === false) return Array.from(array);
  const width: number = accessor.getElementSize();
  const count: number = accessor.getCount();
  const values: number[] = new Array<number>(count * width);
  const element: number[] = new Array<number>(width);
  for (let index: number = 0; index < count; ++index) {
    accessor.getElement(index, element);
    for (let component: number = 0; component < width; ++component)
      values[index * width + component] = element[component]!;
  }
  return values;
};
