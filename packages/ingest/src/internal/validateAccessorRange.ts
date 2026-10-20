import { accessorElementByteLength } from "./accessorElementByteLength";
import { object } from "./object";

/**
 * Admit one accessor's dense byte extent using its component shape and stride.
 *
 * The caller has admitted component type, shape, positive count, nonnegative offset and referenced view. Dense storage requires offset + (count - 1) * stride + paddedElementBytes to fit the view and stride to cover one element. Missing dense storage is accepted only when a sparse declaration exists, whose own gate checks its ranges; this gate does not check component alignment or payload values.
 *
 * @evidence contracts/common.md#principled-implementation Count, zero-default byte offset and padded element size determine final extent; validated buffer views bound the resulting range.
 * @evidence contracts/common.md#clear-and-simple-design Dense range arithmetic belongs here and shared element sizing supplies matrix-column padding without another table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An accessor lacking both a buffer view and sparse payload is refused; no fallback data is synthesized.
 * @evidence contracts/common.md#meaningful-documentation Comments give the dense extent formula, sparse-only allowance and prevalidated metadata premise.
 * @evidence contracts/performance.md#efficient-algorithms Constant-time arithmetic resolves one view and shape without visiting accessor elements.
 * @evidence contracts/performance.md#reuse-equivalent-work Padded element sizing is shared with sparse validation and component readers; no computed payload values are cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The gate borrows metadata for the duration of one call and owns no reader or resident bytes.
 */
export const validateAccessorRange: (
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
) => void = (
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
): void => {
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
};
