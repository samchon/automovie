import type { Box, DataStream } from "mp4box";

import { residentMp4Box } from "./residentMp4Box";

/**
 * The bytes mp4box writes for one sample-entry child box, header included.
 *
 * Two boxes with the same serialization declare the same decoder
 * configuration whatever their parser object identity, which is what
 * `sameSampleDescription` compares. A box mp4box cannot write field by field
 * is written from the raw payload the parser kept for it, so unknown boxes
 * compare by their exact bytes too. Writing sets the box's `size` field to the
 * size it just wrote, the same value the parser read for a well-formed box.
 *
 * @evidence contracts/common.md#principled-implementation The box's own `write` method is mp4box's ISO serializer, run into a fresh big-endian stream, so the output is the box's canonical byte form; the premise that it is complete holds because mp4box keeps the parsed payload of every box whose writer it does not implement and writes that payload back.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the serialization step, and the comparison that needs it, `sameSampleDescription`, decides what to compare.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The box's own writer is called as published, with no field rewritten beforehand; the `size` update is that writer's documented effect, not a patch.
 * @evidence contracts/common.md#meaningful-documentation The doc states what the bytes include, why they stand for decoder configuration, how unknown boxes serialize, and the `size` side effect on the box.
 * @evidence contracts/performance.md#efficient-algorithms Cost is linear in the box's serialized size, written once into a growing stream that is trimmed to the written length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call serializes the box as it is now, and the only caller skips the call when both sides share one box object, which is the case worth reusing.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The stream is local and the returned array, the caller's, views the stream's trimmed buffer of exactly the box's size; no handle or task is opened.
 */
export const serializeDescriptionBox: (box: Box) => Uint8Array = (box: Box): Uint8Array => {
  const stream: DataStream = new (residentMp4Box().DataStream)();
  box.write(stream);
  return new Uint8Array(stream.buffer);
};
