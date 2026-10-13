import {
  renderAutoMovieSemanticMaskSidecar,
} from "@automovie/engine";
import {
  IAutoMovieProductionSemanticMaskEvidence,
  IAutoMovieProductionSemanticMaskReceipt,
  createAutoMovieProductionSemanticMaskReceipt,
  verifyAutoMovieProductionSemanticMaskReceipt,
} from "@automovie/production";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * Receipt reopening preserves schema, resident byte and ordered coverage dependencies without substituting a newer generation.
 *
 * Scenarios:
 * 1. Every original historical, extra-key, escaping, foreign frame/pass/shot/path and tampered byte dependency refuses.
 * 2. Changed semantic digest, unnamed count, unresolved population or foreign palette retains its original stale dependency refusal.
 */
export const test_production_semantic_mask_receipt_reopening = (): void => {
  const { validEvidence, withCoverage, seal, payload, renameKey, bytes } = createSemanticMaskEvidenceTestInputs();

  const evidence = validEvidence();

  const sidecarBytes = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const receipt = createAutoMovieProductionSemanticMaskReceipt({
      frame: 0,
      expectedShot: "opening",
      evidence,
      sidecar: { path: "semantic/opening.mask.json", bytes: sidecarBytes },
    });

  const changedMask = seal({
      ...payload(evidence.mask),
      entries: [
        { ...evidence.mask.entries[0]!, owner: "space:elsewhere" },
        ...evidence.mask.entries.slice(1),
      ],
    });

  const reopenCases: Array<readonly [string, () => void, string]> = [
      [
        "extra receipt key",
        () => reopen({ receipt: { ...receipt, extra: true } as never }),
        "receipt keys",
      ],
      [
        "renamed receipt key",
        () => reopen({ receipt: renameKey(receipt, "shot", "take") }),
        "receipt keys",
      ],
      [
        "extra sidecar key",
        () =>
          reopen({
            receipt: {
              ...receipt,
              sidecar: { ...receipt.sidecar, extra: true },
            } as never,
          }),
        "sidecar keys",
      ],
      [
        "extra receipt coverage key",
        () =>
          reopen({
            receipt: {
              ...receipt,
              coverage: { ...receipt.coverage, extra: true },
            } as never,
          }),
        "coverage keys",
      ],
      [
        "historical receipt",
        () => reopen({ receipt: { ...receipt, version: 2 } as never }),
        "receipt version 2",
      ],
      [
        "escaping receipt path",
        () =>
          reopen({
            receipt: {
              ...receipt,
              sidecar: { ...receipt.sidecar, path: "../opening.mask.json" },
            },
          }),
        "portable relative path",
      ],
      [
        "foreign frame",
        () => reopen({ receipt: { ...receipt, frame: 1 } }),
        "stale semantic receipt frame",
      ],
      [
        "foreign pass",
        () => reopen({ receipt: { ...receipt, pass: "beauty" } as never }),
        "stale semantic receipt frame",
      ],
      [
        "foreign shot",
        () => reopen({ receipt: { ...receipt, shot: "closing" } }),
        "foreign semantic receipt",
      ],
      [
        "foreign resident path",
        () => reopen({ residentPath: "semantic/other.mask.json" }),
        "foreign semantic sidecar path",
      ],
      [
        "tampered resident bytes",
        () => reopen({ residentBytes: bytes("{}\n") }),
        "do not match its canonical palette",
      ],
      [
        "stale byte digest",
        () =>
          reopen({
            receipt: {
              ...receipt,
              sidecar: {
                ...receipt.sidecar,
                digest: `sha256:${"3".repeat(64)}`,
              },
            },
          }),
        "tampered semantic sidecar",
      ],
      [
        "stale byte count",
        () =>
          reopen({
            receipt: {
              ...receipt,
              sidecar: { ...receipt.sidecar, bytes: receipt.sidecar.bytes + 1 },
            },
          }),
        "tampered semantic sidecar",
      ],
      [
        "stale semantic digest",
        () =>
          reopen({
            receipt: {
              ...receipt,
              semanticDigest: `sha256:${"4".repeat(64)}`,
            },
          }),
        "stale semantic payload",
      ],
      [
        "stale unnamed count",
        () =>
          reopen({
            receipt: {
              ...receipt,
              coverage: { unresolved: [], unaddressed: 1 },
            },
          }),
        "stale semantic payload",
      ],
      [
        "stale unresolved length",
        () =>
          reopen({
            receipt: {
              ...receipt,
              coverage: { unresolved: ["node:missing"], unaddressed: 0 },
            },
          }),
        "stale semantic payload",
      ],
      [
        "stale unresolved id",
        () =>
          reopen({
            receipt: {
              ...receipt,
              coverage: { unresolved: ["node:b"], unaddressed: 0 },
            },
            evidence: withCoverage(evidence, {
              unresolved: ["node:a"],
              unaddressed: 0,
            }),
          }),
        "stale semantic payload",
      ],
      [
        "foreign evidence palette",
        () => reopen({ evidence: { ...evidence, mask: changedMask } }),
        "do not match its canonical palette",
      ],
    ];

  TestValidator.equals(
      "receipt reopening refuses every stale or foreign dependency",
      Object.fromEntries(
        reopenCases.map(([name, attempt, message]) => [
          name,
          throwsError(attempt, message),
        ]),
      ),
      Object.fromEntries(reopenCases.map(([name]) => [name, true])),
    );

  function reopen(overrides: {
      receipt?: IAutoMovieProductionSemanticMaskReceipt;
      evidence?: IAutoMovieProductionSemanticMaskEvidence;
      residentPath?: string;
      residentBytes?: Uint8Array;
    }): void {
      verifyAutoMovieProductionSemanticMaskReceipt({
        receipt: overrides.receipt ?? receipt,
        expectedFrame: 0,
        expectedShot: "opening",
        evidence: overrides.evidence ?? evidence,
        resident: {
          path: overrides.residentPath ?? "semantic/opening.mask.json",
          bytes: overrides.residentBytes ?? sidecarBytes,
        },
      });
    }
};
