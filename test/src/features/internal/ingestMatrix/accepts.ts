import { resolveOnlyBuffer } from "./resolveOnlyBuffer";
import { inspect } from "./inspect";

/**
 * Run a static inspection and expose successful completion as a named fact.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const accepts: (document: unknown, resolver?: (uri: string) => Uint8Array | null) => boolean = (
  document: unknown,
  resolver: (uri: string) => Uint8Array | null = resolveOnlyBuffer,
): boolean => {
  inspect(document, "gltf-static-v1", resolver);
  return true;
};
