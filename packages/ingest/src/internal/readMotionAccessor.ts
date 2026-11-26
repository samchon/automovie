import type { IAccessorSource } from "./IAccessorSource";
import type { IExternalModelAccessorReader } from "./IExternalModelAccessorReader";
import { SHAPE_COMPONENTS } from "./SHAPE_COMPONENTS";
import { accessorReader } from "./accessorReader";
import { object } from "./object";

/**
 * Read a finite non-sparse FLOAT accessor into caller-owned motion values.
 *
 * The source inventories and byte ranges are already admitted. The requested
 * SCALAR, VEC3 or VEC4 shape must match an accessor with a buffer view, FLOAT
 * components and no sparse overrides. Every component is copied in element
 * order and checked finite; a mismatch or non-finite value throws with the
 * supplied path.
 */
export function readMotionAccessor(
  source: IAccessorSource,
  accessorIndex: number,
  expectedType: "SCALAR" | "VEC3" | "VEC4",
  path: string,
): number[] {
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
}
