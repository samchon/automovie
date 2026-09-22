import { decodeConnectedAssetText } from "@automovie/playground/src/human/connectedAsset";
import { TestValidator } from "@nestia/e2e";
import { gzipSync } from "node:zlib";

/** Bytes as an exact-size ArrayBuffer, the type the transport port hands over. */
const buffer = (bytes: Uint8Array<ArrayBuffer>): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const utf8 = (text: string): ArrayBuffer =>
  buffer(new TextEncoder().encode(text));
const gzip = (bytes: Uint8Array): ArrayBuffer => buffer(gzipSync(bytes));
const refused = async (
  title: string,
  bytes: ArrayBuffer,
  expected: RegExp,
): Promise<void> => {
  let message = "";
  try {
    await decodeConnectedAssetText(bytes);
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  TestValidator.predicate(title + ": " + message, expected.test(message));
};

/**
 * The asset decoder answers by content, so the same document comes back
 * whether the transport inflated the stored gzip or handed it over as stored,
 * and refuses bytes that are neither with the reason.
 *
 * Scenarios:
 * 1. The gzip of a JSON text and the text itself decode to the same string,
 *    including non-ASCII characters, so a document survives both transports.
 * 2. An empty buffer is refused as empty before any inflation or decoding.
 * 3. A single 0x1f byte is one short of the magic, and 0x1f followed by
 *    another byte is not it either, so both are read as text and come back
 *    as those characters rather than as a gzip failure.
 * 4. Bytes that open with the magic but do not inflate are refused as a gzip
 *    that could not be inflated.
 * 5. Plain bytes that are not UTF-8 are refused as not UTF-8 text, and so is a
 *    gzip whose inflated bytes are not UTF-8, so both decode paths are strict.
 */
export const test_human_connected_asset_text = async (): Promise<void> => {
  const document = { id: "basis/1", name: "기저", values: [1, 2.5, -3] };
  const text = JSON.stringify(document);
  const stored = gzip(new TextEncoder().encode(text));
  TestValidator.equals(
    "stored gzip is not the text",
    new Uint8Array(stored)[0] === 0x1f && new Uint8Array(stored)[1] === 0x8b,
    true,
  );
  TestValidator.equals(
    "gzip bytes decode to the text",
    await decodeConnectedAssetText(stored),
    text,
  );
  TestValidator.equals(
    "inflated bytes decode to the same text",
    await decodeConnectedAssetText(utf8(text)),
    text,
  );
  TestValidator.equals(
    "both give the same document",
    JSON.parse(await decodeConnectedAssetText(stored)),
    JSON.parse(await decodeConnectedAssetText(utf8(text))),
  );
  await refused("empty asset", new ArrayBuffer(0), /empty/u);
  TestValidator.equals(
    "one byte short of the magic is text",
    await decodeConnectedAssetText(buffer(new Uint8Array([0x1f]))),
    "\u001f",
  );
  TestValidator.equals(
    "the first magic byte alone is text",
    await decodeConnectedAssetText(buffer(new Uint8Array([0x1f, 0x7b]))),
    "\u001f{",
  );
  await refused(
    "corrupt gzip",
    buffer(new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0x41, 0x42, 0x43])),
    /could not be inflated/u,
  );
  await refused(
    "plain bytes that are not UTF-8",
    buffer(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d])),
    /not UTF-8/u,
  );
  await refused(
    "gzip of bytes that are not UTF-8",
    gzip(new Uint8Array([0x7b, 0xff, 0xfe, 0x7d])),
    /not UTF-8/u,
  );
};
