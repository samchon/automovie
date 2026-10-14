import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { captureProductionPayloadSnapshot } from "../../../../packages/production/src/production/captureProductionPayloadSnapshot";
import { isProductionPayloadSnapshotCurrent } from "../../../../packages/production/src/production/isProductionPayloadSnapshotCurrent";
import { throwsError } from "../internal/predicates";

/**
 * Publication snapshot guards compare actual retained bytes, not path existence.
 *
 * Scenarios:
 * 1. Empty and ordered singleton/multiple populations capture independent byte identities.
 * 2. Equal replacement bytes remain current; same-size/size changes, deletion and reader failure refuse.
 * 3. Absent members and portable case/slash duplicate paths refuse capture.
 * 4. Later mutation of the original buffer changes currentness without changing captured identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Directly calls the product snapshot producer/currentness guard and asserts exact retained identities and fresh-read decisions, catching existence-only or byte-length-only acceptance without claiming to exercise an independently reimplemented publication transaction.
 * @evidence contracts/testing.md#independent-expectations Native node:crypto SHA-256 hashes explicit byte literals independently of the production helper; exact returned order/count/digests and changed byte arrays determine expected currentness.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty, singleton/multiple and equal replacement populations; same-size and size mismatch, deletion, thrown read, capture absence, slash/case duplicates and mutation after capture. Actual locked publication and rollback belong to product transaction tests, not this portable byte-guard unit.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported unit imports actual source functions and passes their declared synchronous reader capability over caller-owned buffers/maps; it starts no host/native artifact, replaces no foreign method and dynamically registers no cases.
 */
export function test_production_payload_snapshot(): void {
  const original: Uint8Array = Uint8Array.of(1, 2, 3);
  const files: Map<string, Uint8Array> = new Map([
    ["retained.png", original], ["manifest.json", Uint8Array.of(4, 5)],
  ]);
  function read(path: string): Uint8Array | null { return files.get(path) ?? null; }
  const snapshot: ReturnType<typeof captureProductionPayloadSnapshot> = captureProductionPayloadSnapshot({ paths: ["retained.png", "manifest.json"], read });
  TestValidator.equals("ordered captured byte identities", snapshot, {
    entries: [
      { path: "retained.png", bytes: 3, digest: `sha256:${createHash("sha256").update(Uint8Array.of(1, 2, 3)).digest("hex")}` },
      { path: "manifest.json", bytes: 2, digest: `sha256:${createHash("sha256").update(Uint8Array.of(4, 5)).digest("hex")}` },
    ],
  });
  function current(): boolean { return isProductionPayloadSnapshotCurrent({ snapshot, read }); }
  TestValidator.equals("unchanged bytes are current", current(), true);
  files.set("retained.png", Uint8Array.of(1, 2, 3));
  TestValidator.equals("equal replacement bytes remain current", current(), true);
  files.set("retained.png", Uint8Array.of(1, 2, 4));
  TestValidator.equals("same-size replacement is not current", current(), false);
  files.set("retained.png", Uint8Array.of(1, 2));
  TestValidator.equals("size replacement is not current", current(), false);
  files.delete("retained.png");
  TestValidator.equals("absent retained bytes are not current", current(), false);
  TestValidator.equals("failed read is not current", isProductionPayloadSnapshotCurrent({ snapshot, read: (_path: string): Uint8Array | null => { throw new Error("Observation failed."); } }), false);
  const empty: ReturnType<typeof captureProductionPayloadSnapshot> = captureProductionPayloadSnapshot({ paths: [], read });
  TestValidator.equals("empty capture", empty, { entries: [] });
  TestValidator.equals("empty population is current", isProductionPayloadSnapshotCurrent({ snapshot: empty, read: (_path: string): Uint8Array | null => { throw new Error("Empty must not read."); } }), true);
  TestValidator.predicate("absent capture refuses", throwsError((): unknown => captureProductionPayloadSnapshot({ paths: ["missing"], read }), 'payload "missing" is absent'));
  for (const paths of [["Frame.png", "frame.png"], ["frames\\one.png", "frames/one.png"]])
    TestValidator.predicate("portable duplicate refuses", throwsError((): unknown => captureProductionPayloadSnapshot({ paths, read: (_path: string): Uint8Array => Uint8Array.of(1) }), "is duplicated"));
  const single: ReturnType<typeof captureProductionPayloadSnapshot> = captureProductionPayloadSnapshot({ paths: ["original"], read: (_path: string): Uint8Array => original });
  const captured: string = single.entries[0]!.digest;
  original[0] = 9;
  TestValidator.equals("capture retains identity without original-buffer alias", single.entries[0]!.digest, captured);
  TestValidator.equals("mutated original is stale", isProductionPayloadSnapshotCurrent({ snapshot: single, read: (_path: string): Uint8Array => original }), false);
}