import { COMPONENT_BYTES } from "./COMPONENT_BYTES";
import type { IAccessorSource } from "./IAccessorSource";
import type { IExternalModelAccessorReader } from "./IExternalModelAccessorReader";
import { accessorElementByteLength } from "./accessorElementByteLength";
import { object } from "./object";

/**
 * Resolve one admitted accessor's resident component reader.
 *
 * The caller has already checked buffer indices, dense ranges and vector/scalar
 * layout. Sparse storage and formats other than unsigned byte, unsigned short
 * or FLOAT throw with the supplied role. Element and component indices are
 * caller-owned bounds; the closure borrows the payload and decodes
 * little-endian components, scaling normalized integers by 255 or 65535.
 */
export function accessorReader(
  source: IAccessorSource,
  accessorIndex: number,
  role: string,
): IExternalModelAccessorReader {
  const accessor: Record<string, unknown> = object(
    source.accessors[accessorIndex],
    `accessors[${accessorIndex}]`,
  );
  if (accessor.sparse !== undefined)
    throw new Error(
      `${role} may not use sparse overrides at the production ingest boundary.`,
    );
  const viewIndex: number = accessor.bufferView as number;
  const bufferView: Record<string, unknown> = object(
    source.bufferViews[viewIndex],
    `bufferViews[${viewIndex}]`,
  );
  const type: number = accessor.componentType as number;
  if (type !== 5121 && type !== 5123 && type !== 5126)
    throw new Error(
      `${role} uses componentType ${type}, which this profile does not read.`,
    );
  const size: number = COMPONENT_BYTES.get(type)!;
  const stride: number =
    (bufferView.byteStride as number | undefined) ??
    accessorElementByteLength(type, accessor.type as string);
  const base: number =
    ((bufferView.byteOffset as number | undefined) ?? 0) +
    ((accessor.byteOffset as number | undefined) ?? 0);
  const bytes: Uint8Array = source.payloads[bufferView.buffer as number]!;
  const data: DataView = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const scale: number =
    accessor.normalized === true && type !== 5126
      ? type === 5121
        ? 1 / 255
        : 1 / 65535
      : 1;
  return (element: number, component: number): number => {
    const offset: number = base + element * stride + component * size;
    const value: number =
      type === 5121
        ? data.getUint8(offset)
        : type === 5123
          ? data.getUint16(offset, true)
          : data.getFloat32(offset, true);
    return scale === 1 ? value : value * scale;
  };
}
