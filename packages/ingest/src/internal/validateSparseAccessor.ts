import { COMPONENT_BYTES } from "./COMPONENT_BYTES";
import { accessorElementByteLength } from "./accessorElementByteLength";
import { integerIndex } from "./integerIndex";
import { nonNegativeInteger } from "./nonNegativeInteger";
import { object } from "./object";
import { positiveInteger } from "./positiveInteger";

/**
 * Admit sparse accessor byte ranges within validated glTF buffer views.
 *
 * Absent sparse metadata does nothing. Present metadata needs a positive count
 * no greater than accessor count, valid index/value views, unsigned
 * byte/short/int indices and nonnegative zero-default offsets. Both tightly
 * packed extents must fit their views; index ordering, index values and sparse
 * payload values are not decoded, and skin/motion readers reject sparse
 * accessors separately.
 */
export function validateSparseAccessor(
  accessor: Record<string, unknown>,
  index: number,
  bufferViews: unknown[],
): void {
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
}

function validateSubViewRange(
  bufferViews: unknown[],
  viewIndex: number,
  offset: number,
  length: number,
  path: string,
): void {
  nonNegativeInteger(offset, `${path}.byteOffset`);
  const view: Record<string, unknown> = object(
    bufferViews[viewIndex],
    `bufferViews[${viewIndex}]`,
  );
  if (offset + length > (view.byteLength as number))
    throw new Error(`${path} exceeds its bufferView range.`);
}
