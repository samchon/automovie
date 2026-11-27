import type { Accessor } from "@gltf-transform/core";

/*
 * Read a parsed glTF accessor as plain numbers in the values it means.
 *
 * A normalized integer accessor stores `round(value * max)`, which glTF allows
 * for animation outputs (rotation and weights) and, under
 * `KHR_mesh_quantization`, for positions and morph deltas. Copying its raw
 * array would hand consumers 32767 where the file means 1, so such an accessor
 * is decoded element by element through `Accessor.getElement`, which applies
 * glTF's decoding (`max(c / max, -1)` for signed and `c / max` for unsigned
 * components). Every other accessor, including non-normalized quantized
 * integers whose scale lives in the node transform, is copied verbatim.
 * Parameter accessor: Accessor whose data is resident in the parsed document.
 * Returns: A new flat array in element order, or `null` when the accessor holds
 * no array data; the caller supplies a valid accessor layout.
 */
export function accessorValues(accessor: Accessor): number[] | null {
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
}
