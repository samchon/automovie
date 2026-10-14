import {
  renderAutoMovieSemanticMaskSidecar,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Receipt creation refuses nonportable location, invalid frame and foreign or noncanonical evidence.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls real receipt construction through the existing concise constructor for invalid frames, seven path escapes, wrong canonical bytes and a foreign shot; Error fragments expose incorrect range, portability or correspondence admission.
 * @evidence contracts/testing.md#independent-expectations Frames must be nonnegative safe integers, paths portable relative segments, and supplied bytes/shot match the authored palette/opening identity. Expected message fragments are literal protocol rules; valid sidecar text comes from the engine owner rather than an independent renderer.
 * @evidence contracts/testing.md#distinguishing-cases Preserves negative/fractional/unsafe frames, blank/backslash/rooted/drive/empty/dot/parent paths, empty-object bytes and foreign-shot evidence; positive construction, exact reopening and physical symlink confinement belong elsewhere.
 * @evidence contracts/testing.md#execution-ownership This named discoverable portable unit owns every local refusal and invokes receipt semantics on in-memory bytes; path strings are not opened and no browser/GPU/native host or dynamic registrations run.
 *
 * Scenarios:
 * 1. Negative, fractional and unsafe frames refuse before becoming receipt identities.
 * 2. All seven original path escapes, wrong resident bytes and foreign-shot evidence retain exact diagnostics.
 */
export function test_production_semantic_mask_receipt_admission(): void {
  const { validEvidence, createReceipt, bytes }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: ReturnType<typeof validEvidence> = validEvidence();

  const sidecarBytes: Uint8Array = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const invalidPaths: readonly (readonly [string, string])[] = [
      ["blank", ""],
      ["backslash", "semantic\\mask.json"],
      ["rooted", "/semantic/mask.json"],
      ["drive", "C:/semantic/mask.json"],
      ["empty segment", "semantic//mask.json"],
      ["dot segment", "semantic/./mask.json"],
      ["parent segment", "semantic/../mask.json"],
    ] as const;

  TestValidator.equals(
      "receipt creation refuses foreign evidence, malformed frame, path, and sidecar bytes",
      {
        negativeFrame: throwsError(
          () => createReceipt({ frame: -1, evidence, sidecarBytes }),
          "non-negative safe integer",
        ),
        fractionalFrame: throwsError(
          () => createReceipt({ frame: 0.5, evidence, sidecarBytes }),
          "non-negative safe integer",
        ),
        unsafeFrame: throwsError(
          () =>
            createReceipt({
              frame: Number.MAX_SAFE_INTEGER + 1,
              evidence,
              sidecarBytes,
            }),
          "non-negative safe integer",
        ),
        invalidPaths: Object.fromEntries(
          invalidPaths.map(([name, path]: readonly [string, string]): [string, boolean] => [
            name,
            throwsError(
              () => createReceipt({ evidence, sidecarBytes, path }),
              "portable relative path",
            ),
          ]),
        ),
        wrongBytes: throwsError(
          () => createReceipt({ evidence, sidecarBytes: bytes("{}\n") }),
          "do not match its canonical palette",
        ),
        foreignEvidence: throwsError(
          () =>
            createReceipt({
              evidence: { ...evidence, shot: "closing" },
              expectedShot: "opening",
              sidecarBytes,
            }),
          'foreign semantic evidence for shot "closing"; expected "opening"',
        ),
      },
      {
        negativeFrame: true,
        fractionalFrame: true,
        unsafeFrame: true,
        invalidPaths: Object.fromEntries(
          invalidPaths.map(([name]: readonly [string, string]): [string, boolean] => [name, true]),
        ),
        wrongBytes: true,
        foreignEvidence: true,
      },
    );
}
