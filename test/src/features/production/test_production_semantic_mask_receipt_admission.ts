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
 * Scenarios:
 * 1. Negative, fractional and unsafe frames refuse before becoming receipt identities.
 * 2. All seven original path escapes, wrong resident bytes and foreign-shot evidence retain exact diagnostics.
 */
export const test_production_semantic_mask_receipt_admission = (): void => {
  const { validEvidence, createReceipt, bytes } = createSemanticMaskEvidenceTestInputs();

  const evidence = validEvidence();

  const sidecarBytes = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const invalidPaths = [
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
          invalidPaths.map(([name, path]) => [
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
          invalidPaths.map(([name]) => [name, true]),
        ),
        wrongBytes: true,
        foreignEvidence: true,
      },
    );
};
