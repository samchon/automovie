import { AutoMovieRenderPicture } from "@automovie/render";
import { AutoMovieCliCapture } from "automovie";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

/**
 * Reopen a bounded selection of exact native PNGs by record and stream
 * identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names exact record and stream matching, file integrity, missing frames and truncation.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the installed CLI helper on a temporary capture with real PNG bytes. It verifies opened bytes, timestamp and explicit unavailable reasons without a renderer or decoder.
 * @evidence contracts/development/testing.md#independent-expectations Input ticks 500 and 800 in units of 1/1000 differ from estimated seconds .3 and .4. The fixture hashes the original PNG, then writes a different byte digest for frame four. A two-row limit omits the final requested ordinal.
 */
export async function test_cli_capture_read_retained_frames(): Promise<void> {
  const root: string = await fs.mkdtemp(
    path.join(tmpdir(), "automovie-retained-"),
  );
  const hash = (bytes: Uint8Array): string =>
    createHash("sha256").update(bytes).digest("hex");
  try {
    const png: Uint8Array = await AutoMovieRenderPicture.encodeRasterPng(
      {
        width: 1,
        height: 1,
        pixels: Uint8ClampedArray.from([255, 0, 0, 255]),
      },
      { alpha: false },
    );
    await fs.writeFile(path.join(root, "frame-3.png"), png);
    await fs.writeFile(path.join(root, "frame-4.png"), png);
    const fileSha256: string = "a".repeat(64);
    const record = {
      state: "complete",
      subject: { name: "test" },
      rows: [3, 4].map((frame: number) => ({
        state: "drawn",
        time: { seconds: frame / 10, frame },
        view: "file",
        pass: "beauty",
        file: `frame-${frame}.png`,
        fileSha256: frame === 3 ? hash(png) : "b".repeat(64),
      })),
      video: {
        presentation: {
          type: "decoded",
          fileSha256,
          streamIndex: 2,
          timeBase: [1, 1000],
          frames: [
            { frame: 3, ticks: 500 },
            { frame: 4, ticks: 800 },
          ],
        },
      },
    };
    const recordBytes: Buffer = Buffer.from(JSON.stringify(record));
    await fs.writeFile(path.join(root, "record.json"), recordBytes);
    const request = {
      root,
      record: "record.json",
      recordSha256: hash(recordBytes),
      subject: "test",
      source: { type: "video" as const, fileSha256, streamIndex: 2 },
      view: "file",
      pass: "beauty",
      fromFrame: 3,
      endFrame: 6,
      limit: 2,
    };
    const lookup = await AutoMovieCliCapture.readRetainedFrames(request);
    assert.equal(lookup.requested, 3);
    assert.equal(lookup.truncated, true);
    const frame = lookup.frames[0]!;
    assert(frame.type === "retained");
    assert.equal(frame.frame, 3);
    assert.deepEqual(frame.presentation, { ticks: 500, timeBase: [1, 1000] });
    assert.equal(hash(frame.bytes), hash(png));
    assert.deepEqual(lookup.frames[1], {
      type: "unavailable",
      frame: 4,
      reason: "The stored PNG does not match its byte digest.",
    });
    await assert.rejects(
      AutoMovieCliCapture.readRetainedFrames({
        ...request,
        source: { ...request.source, streamIndex: 1 },
      }),
      /expected file and stream/u,
    );
    await assert.rejects(
      AutoMovieCliCapture.readRetainedFrames({
        ...request,
        recordSha256: "0".repeat(64),
      }),
      /expected SHA-256/u,
    );
  } finally {
    await fs.rm(root, { recursive: true });
  }
}
