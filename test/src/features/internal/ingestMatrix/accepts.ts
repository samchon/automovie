import { resolveOnlyBuffer } from "./resolveOnlyBuffer";
import { inspect } from "./inspect";

/**
 * Run a static inspection and expose successful completion as a named fact.
 */
export const accepts: (document: unknown, resolver?: (uri: string) => Uint8Array | null) => boolean = (
  document: unknown,
  resolver: (uri: string) => Uint8Array | null = resolveOnlyBuffer,
): boolean => {
  inspect(document, "gltf-static-v1", resolver);
  return true;
};
