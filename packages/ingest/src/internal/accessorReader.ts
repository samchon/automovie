import { COMPONENT_BYTES } from "./COMPONENT_BYTES";
import type { IAccessorSource } from "./IAccessorSource";
import type { IExternalModelAccessorReader } from "./IExternalModelAccessorReader";
import { accessorElementByteLength } from "./accessorElementByteLength";
import { object } from "./object";

/**
 * Resolve one admitted accessor's resident component reader.
 *
 * The caller has already checked buffer indices, dense ranges and vector/scalar layout. Sparse storage and formats other than unsigned byte, unsigned short or FLOAT throw with the supplied role. Element and component indices are caller-owned bounds; the closure borrows the payload and decodes little-endian components, scaling normalized integers by 255 or 65535.
 *
 * @evidence contracts/common.md#principled-implementation Validated offsets/stride and unsigned byte/short or FLOAT formats define little-endian reads; normalized integers scale by their exact maximum.
 * @evidence contracts/common.md#clear-and-simple-design One closure owns DataView and addressing, shared by weight coverage and motion FLOAT decoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sparse overrides and unsupported component formats throw instead of being treated as dense data of another type.
 * @evidence contracts/common.md#meaningful-documentation Comments give admitted formats, normalized scaling, element/component arguments and borrowed payload lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Reader setup is constant time; each requested component costs one address calculation and one scalar DataView read.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved view/stride/DataView serves every component of this accessor, avoiding repeated metadata resolution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure borrows one payload until its owning profile finishes; it retains no global reader cache or handle.
 */
export const accessorReader: (
  source: IAccessorSource,
  accessorIndex: number,
  role: string,
) => IExternalModelAccessorReader = (
  source: IAccessorSource,
  accessorIndex: number,
  role: string,
): IExternalModelAccessorReader => {
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
};
