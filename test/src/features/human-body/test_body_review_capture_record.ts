import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { buildCaptureRecord } from "../../../scripts/review/buildCaptureRecord";

/**
 * The capture record identifies frames by digest and carries no pixels.
 *
 * Scenarios:
 * 1. Each capture's digest is the SHA-256 of exactly its bytes, computed by
 *    the record and not supplied, and frames keep the order they were drawn.
 * 2. The record holds the device string, the revision and the build
 *    freshness verbatim.
 * 3. Negative twin: no capture entry has a `bytes` field, and the serialized
 *    record does not contain the frame bytes, so it cannot leak an image.
 * 4. Two frames whose bytes differ by one byte get different digests, and an
 *    empty frame list gives an empty capture list.
 */
export const test_body_review_capture_record = (): void => {
  const bytes = Uint8Array.from([137, 80, 78, 71, 1, 2, 3]);
  const other = Uint8Array.from([137, 80, 78, 71, 1, 2, 4]);
  const record = buildCaptureRecord({
    kind: "body",
    renderer: "ANGLE (AMD, AMD Radeon 780M)",
    revision: "abc1234+local",
    humanBuildFresh: true,
    frames: [
      { state: "a", view: "front", pass: "beauty", file: "one.png", bytes },
      { state: "a", view: "back", pass: "beauty", file: "two.png", bytes: other },
    ],
  });
  TestValidator.equals(
    "digest of the bytes",
    record.captures[0].sha256,
    createHash("sha256").update(bytes).digest("hex"),
  );
  TestValidator.equals(
    "order kept",
    record.captures.map((capture) => capture.file),
    ["one.png", "two.png"],
  );
  TestValidator.equals("header", [record.kind, record.renderer, record.revision, record.humanBuildFresh], [
    "body",
    "ANGLE (AMD, AMD Radeon 780M)",
    "abc1234+local",
    true,
  ]);
  TestValidator.predicate(
    "no bytes field",
    record.captures.every((capture) => !("bytes" in capture)),
  );
  TestValidator.predicate(
    "no pixels in the text",
    !JSON.stringify(record).includes("137,80,78"),
  );
  TestValidator.predicate(
    "different bytes, different digest",
    record.captures[0].sha256 !== record.captures[1].sha256,
  );
  TestValidator.equals(
    "no frames",
    buildCaptureRecord({
      kind: "face",
      renderer: "r",
      revision: "v",
      humanBuildFresh: false,
      frames: [],
    }).captures,
    [],
  );
};
