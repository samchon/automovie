import type { IAccessorSource } from "./IAccessorSource";
import { object } from "./object";
import { SHAPE_COMPONENTS } from "./SHAPE_COMPONENTS";
import type { IExternalModelAccessorReader } from "./IExternalModelAccessorReader";
import { accessorReader } from "./accessorReader";

/**
 * Read a finite non-sparse FLOAT accessor into caller-owned motion values.
 *
 * The source inventories and byte ranges are already admitted. The requested SCALAR, VEC3 or VEC4 shape must match an accessor with a buffer view, FLOAT components and no sparse overrides. Every component is copied in element order and checked finite; a mismatch or non-finite value throws with the supplied path.
 *
 * @evidence contracts/common.md#principled-implementation Shape and FLOAT storage are checked before stride-aware component reads; every copied numeric value must be finite.
 * @evidence contracts/common.md#clear-and-simple-design Motion-specific shape admission stays here while shared reader code owns buffer view, stride and little-endian decoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sparse or normalized integer motion data is not coerced into the profile's exact FLOAT interpretation.
 * @evidence contracts/common.md#meaningful-documentation Comments state source admission premises, permitted shapes, finite-value refusal and flat element/component order.
 * @evidence contracts/performance.md#efficient-algorithms Count times shape width drives time and output space; one reader and DataView serve the entire accessor copy.
 * @evidence contracts/performance.md#reuse-equivalent-work The inspector caches this complete decoded accessor by index and expected shape within one immutable input revision.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The output array belongs to its caller; the reader's borrowed payload reference ends when decoding completes.
 * @author Samchon
 */
export const readMotionAccessor: (source: IAccessorSource, accessorIndex: number, expectedType: "SCALAR" | "VEC3" | "VEC4", path: string) => number[] = (
  source: IAccessorSource,
  accessorIndex: number,
  expectedType: "SCALAR" | "VEC3" | "VEC4",
  path: string,
): number[] => {
  const accessor: Record<string, unknown> = object(
    source.accessors[accessorIndex],
    `accessors[${accessorIndex}]`,
  );
  if (
    accessor.componentType !== 5126 ||
    accessor.type !== expectedType ||
    accessor.bufferView === undefined ||
    accessor.sparse !== undefined
  )
    throw new Error(
      `${path} must resolve to a non-sparse FLOAT ${expectedType} accessor.`,
    );
  const width: number = SHAPE_COMPONENTS[expectedType]!;
  const count: number = accessor.count as number;
  const read: IExternalModelAccessorReader = accessorReader(
    source,
    accessorIndex,
    `Motion accessor ${accessorIndex}`,
  );
  const values: number[] = new Array<number>(count * width);
  for (let element: number = 0; element < count; ++element)
    for (let component: number = 0; component < width; ++component) {
      const value: number = read(element, component);
      if (Number.isFinite(value) === false)
        throw new Error(`${path} contains a non-finite value.`);
      values[element * width + component] = value;
    }
  return values;
};
