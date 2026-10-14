import { COMPONENT_BYTES } from "./COMPONENT_BYTES";
import { accessorElementByteLength } from "./accessorElementByteLength";
import { integerIndex } from "./integerIndex";
import { nonNegativeInteger } from "./nonNegativeInteger";
import { object } from "./object";
import { positiveInteger } from "./positiveInteger";

/**
 * Admit sparse accessor byte ranges within validated glTF buffer views.
 *
 * Absent sparse metadata does nothing. Present metadata needs a positive count no greater than accessor count, valid index/value views, unsigned byte/short/int indices and nonnegative zero-default offsets. Both tightly packed extents must fit their views; index ordering, index values and sparse payload values are not decoded, and skin/motion readers reject sparse accessors separately.
 *
 * @evidence contracts/common.md#principled-implementation Sparse count cannot exceed accessor count; unsigned index widths and padded matrix element sizes determine both payload ranges.
 * @evidence contracts/common.md#clear-and-simple-design The sparse gate owns count, index format and subview range checks while shared element sizing owns matrix padding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sparse layout is checked structurally but skin/motion consumers explicitly refuse sparse reading rather than inventing dense values.
 * @evidence contracts/common.md#meaningful-documentation Prose explains admitted view indices, zero-default offsets, count bounds and consumer limitations.
 * @evidence contracts/performance.md#efficient-algorithms One sparse accessor requires constant-size field checks and two range calculations independent of sparse element count.
 * @evidence contracts/performance.md#reuse-equivalent-work Subview metadata is read once per sparse payload; no byte decoding is performed or cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The range gate creates temporary metadata references only and retains no payload, reader or handle.
 * @author Samchon
 */
export const validateSparseAccessor: (
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
) => void = (
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
): void => {
  if (accessor.sparse === undefined) return;
  const sparse: Record<string, unknown> = object(
    accessor.sparse,
    `accessors[${index}].sparse`,
  );
  positiveInteger(sparse.count, `accessors[${index}].sparse.count`);
  if ((sparse.count as number) > (accessor.count as number))
    throw new Error(
      `accessors[${index}].sparse.count exceeds the accessor count.`,
    );
  const indices: Record<string, unknown> = object(
    sparse.indices,
    `accessors[${index}].sparse.indices`,
  );
  const values: Record<string, unknown> = object(
    sparse.values,
    `accessors[${index}].sparse.values`,
  );
  integerIndex(
    indices.bufferView,
    bufferViews.length,
    `accessors[${index}].sparse.indices.bufferView`,
    true,
  );
  integerIndex(
    values.bufferView,
    bufferViews.length,
    `accessors[${index}].sparse.values.bufferView`,
    true,
  );
  if (
    indices.componentType !== 5121 &&
    indices.componentType !== 5123 &&
    indices.componentType !== 5125
  )
    throw new Error(
      `accessors[${index}].sparse.indices.componentType must be unsigned byte, short or int.`,
    );
  const count: number = sparse.count as number;
  validateSubViewRange(
    bufferViews,
    indices.bufferView as number,
    (indices.byteOffset as number | undefined) ?? 0,
    count * COMPONENT_BYTES.get(indices.componentType as number)!,
    `accessors[${index}].sparse.indices`,
  );
  validateSubViewRange(
    bufferViews,
    values.bufferView as number,
    (values.byteOffset as number | undefined) ?? 0,
    count *
      accessorElementByteLength(
        accessor.componentType as number,
        accessor.type as string,
      ),
    `accessors[${index}].sparse.values`,
  );
};

const validateSubViewRange: (
  bufferViews: unknown[],
  viewIndex: number,
  offset: number,
  length: number,
  path: string,
) => void = (
  bufferViews: unknown[],
  viewIndex: number,
  offset: number,
  length: number,
  path: string,
): void => {
  nonNegativeInteger(offset, `${path}.byteOffset`);
  const view: Record<string, unknown> = object(
    bufferViews[viewIndex],
    `bufferViews[${viewIndex}]`,
  );
  if (offset + length > (view.byteLength as number))
    throw new Error(`${path} exceeds its bufferView range.`);
};
