import { accessorElementByteLength } from "./accessorElementByteLength";
import { object } from "./object";

/**
 * Admit one accessor's dense byte extent using its component shape and stride.
 *
 * The caller has admitted component type, shape, positive count, nonnegative
 * offset and referenced view. Dense storage requires offset + (count - 1) *
 * stride + paddedElementBytes to fit the view and stride to cover one element.
 * Missing dense storage is accepted only when a sparse declaration exists,
 * whose own gate checks its ranges; this gate does not check component
 * alignment or payload values.
 */
export function validateAccessorRange(
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
): void {
  if (accessor.bufferView === undefined) {
    if (accessor.sparse === undefined)
      throw new Error(
        `accessors[${index}] needs a bufferView or a complete sparse payload.`,
      );
    return;
  }
  const view: Record<string, unknown> = object(
    bufferViews[accessor.bufferView as number],
    `bufferViews[${accessor.bufferView as number}]`,
  );
  const element: number = accessorElementByteLength(
    accessor.componentType as number,
    accessor.type as string,
  );
  const stride: number = (view.byteStride as number | undefined) ?? element;
  if (stride < element)
    throw new Error(
      `accessors[${index}] element size ${element} exceeds bufferView byteStride ${stride}.`,
    );
  const offset: number = (accessor.byteOffset as number | undefined) ?? 0;
  const count: number = accessor.count as number;
  const end: number = offset + (count - 1) * stride + element;
  if (end > (view.byteLength as number))
    throw new Error(
      `accessors[${index}] requires ${end} bytes inside a bufferView of ${String(view.byteLength)} bytes.`,
    );
}
