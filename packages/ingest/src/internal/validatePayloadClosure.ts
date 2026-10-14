import { object } from "./object";
import { decodeDataUri } from "./decodeDataUri";

/**
 * Bind every declared glTF buffer and image to its exact resident payload.
 *
 * @evidence contracts/common.md#principled-implementation GLB buffer zero owns BIN with at most three pad bytes; URI buffers require exact lengths and views fit declared and resident bounds.
 * @evidence contracts/common.md#clear-and-simple-design One payload owner sequences buffer binding, orphan-BIN checks, view bounds and image presence before profile decoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing sidecars throw; resolver effects occur per declared entry and are not silently deduplicated or replaced.
 * @evidence contracts/common.md#meaningful-documentation Comments state read-only resident bytes, URI resolver responsibility, padding limits and no network fetch.
 * @evidence contracts/performance.md#efficient-algorithms Work follows buffer/view/image counts and encoded data-URI bytes, plus the caller's complete resolver work for each declared external URI entry; repeated URIs repeat callback effects, borrowed payloads avoid copies, and data URIs allocate decoded arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Each resolved buffer is reused by its accessors inside the call; callback effects prohibit caching by URI without caller guarantees.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The inspector owns the temporary payload list and decoded data-URI arrays only for the call; sidecar buffers remain borrowed.
 * @author Samchon
 */
export const validatePayloadClosure: (props: {
  format: "gltf" | "glb" | "vrm";
  bin: Uint8Array | null;
  buffers: unknown[];
  bufferViews: unknown[];
  images: unknown[];
  resolveResource?: (uri: string) => Uint8Array | null;
}) => Uint8Array[] = (props: {
  format: "gltf" | "glb" | "vrm";
  bin: Uint8Array | null;
  buffers: unknown[];
  bufferViews: unknown[];
  images: unknown[];
  resolveResource?: (uri: string) => Uint8Array | null;
}): Uint8Array[] => {
  const payloads: Uint8Array[] = props.buffers.map(
    (value: unknown, index: number): Uint8Array => {
      const buffer: Record<string, unknown> = object(
        value,
        `buffers[${index}]`,
      );
      const length: number = buffer.byteLength as number;
      if (buffer.uri === undefined) {
        if (props.format === "gltf" || index !== 0)
          throw new Error(
            `buffers[${index}] cannot use the GLB BIN chunk in this container.`,
          );
        if (props.bin === null)
          throw new Error(
            `buffers[${index}] declares ${length} bytes but the GLB has no BIN chunk.`,
          );
        if (
          props.bin.byteLength < length ||
          props.bin.byteLength > length + 3
        )
          throw new Error(
            `GLB BIN chunk length ${props.bin.byteLength} does not cover buffers[${index}].byteLength ${length} with at most three padding bytes.`,
          );
        return props.bin;
      }
      const uri: string = buffer.uri as string;
      if (uri.startsWith("data:")) {
        const bytes: Uint8Array = decodeDataUri(uri, `buffers[${index}].uri`);
        if (bytes.byteLength !== length)
          throw new Error(
            `buffers[${index}] data URI has ${bytes.byteLength} bytes, not declared byteLength ${length}.`,
          );
        return bytes;
      }
      const bytes: Uint8Array | null = props.resolveResource?.(uri) ?? null;
      if (bytes === null)
        throw new Error(
          `External buffer "${uri}" has no builder-resolved resident bytes.`,
        );
      if (bytes.byteLength !== length)
        throw new Error(
          `External buffer "${uri}" has ${bytes.byteLength} bytes, not declared byteLength ${length}.`,
        );
      return bytes;
    },
  );
  if (props.bin !== null && props.buffers.length === 0)
    throw new Error("GLB contains a BIN chunk but declares no buffer.");
  if (
    props.bin !== null &&
    object(props.buffers[0], "buffers[0]").uri !== undefined
  )
    throw new Error(
      "GLB BIN chunk is orphaned because buffers[0] declares an external URI.",
    );
  props.bufferViews.forEach((value: unknown, index: number): void => {
    const view: Record<string, unknown> = object(
      value,
      `bufferViews[${index}]`,
    );
    const bufferIndex: number = view.buffer as number;
    const offset: number = (view.byteOffset as number | undefined) ?? 0;
    const length: number = view.byteLength as number;
    const declared: number = object(
      props.buffers[bufferIndex],
      `buffers[${bufferIndex}]`,
    ).byteLength as number;
    if (
      offset + length > declared ||
      offset + length > payloads[bufferIndex]!.byteLength
    )
      throw new Error(
        `bufferViews[${index}] range ${offset}..${offset + length} exceeds buffers[${bufferIndex}].byteLength ${declared}.`,
      );
  });
  props.images.forEach((value: unknown, index: number): void => {
    const image: Record<string, unknown> = object(value, `images[${index}]`);
    if (typeof image.uri !== "string") return;
    const bytes: Uint8Array | null = image.uri.startsWith("data:")
      ? decodeDataUri(image.uri, `images[${index}].uri`)
      : (props.resolveResource?.(image.uri) ?? null);
    if (bytes === null || bytes.byteLength === 0)
      throw new Error(
        `External image "${image.uri}" has no non-empty builder-resolved resident bytes.`,
      );
  });
  return payloads;
};
