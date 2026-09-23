import { readConnectedFaceAsset } from "@automovie/playground/src/human/connectedAsset";
import { TestValidator } from "@nestia/e2e";
import { gzipSync } from "node:zlib";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

const buffer = (bytes: Uint8Array<ArrayBuffer>): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const transport = (bytes: ArrayBuffer) => async () => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => bytes,
});

/**
 * The selected-asset adapter decodes by content when the caller supplies no
 * decoder, so every page and worker reads its asset the same way under every
 * transport; a supplied decoder still replaces that default.
 *
 * Scenarios:
 * 1. Without a decoder, the stored gzip of a basis and its inflated JSON both
 *    return the same basis object.
 * 2. Without a decoder, an empty response body is refused rather than parsed.
 * 3. With a decoder, its text is what gets parsed, so the default is a
 *    fallback and not an override.
 */
export const test_human_connected_asset_default_decoder =
  async (): Promise<void> => {
    const basis = humanFaceBasisFixture().basis;
    const encoded = new TextEncoder().encode(JSON.stringify(basis));
    TestValidator.equals(
      "gzip bytes without a decoder",
      await readConnectedFaceAsset({
        read: transport(buffer(gzipSync(encoded))),
      }),
      basis,
    );
    TestValidator.equals(
      "inflated bytes without a decoder",
      await readConnectedFaceAsset({ read: transport(buffer(encoded)) }),
      basis,
    );
    await TestValidator.error("empty body without a decoder", () =>
      readConnectedFaceAsset({ read: transport(new ArrayBuffer(0)) }),
    );
    TestValidator.equals(
      "a supplied decoder replaces the default",
      await readConnectedFaceAsset<{ supplied: boolean }>({
        read: transport(buffer(gzipSync(encoded))),
        decode: async () => JSON.stringify({ supplied: true }),
      }),
      { supplied: true },
    );
  };
