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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real receipt verifier for every mutation and asserts an Error containing that dependency's expected refusal fragment, rather than inspecting receipt fields alone.
 * @evidence contracts/testing.md#independent-expectations The eighteen refusal fragments are literal expectations; canonical receipt and palette builders only prepare the shared valid baseline and changed resident bytes.
 * @evidence contracts/testing.md#distinguishing-cases Separates exact-key and version errors, unsafe path, frame/pass/shot/path ownership, canonical bytes, byte digest/count, semantic digest and ordered coverage population/content; a different valid palette must also refuse.
 * @evidence contracts/testing.md#execution-ownership The exported synchronous test invokes every local case through the common Error predicate with resident buffers in memory. It neither reads sidecar files nor demonstrates a successful reopen in this negative-case test.
 */
export function test_production_semantic_mask_receipt_reopening(): void {
  const { validEvidence, withCoverage, seal, payload, renameKey, bytes }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: IAutoMovieProductionSemanticMaskEvidence = validEvidence();

  const sidecarBytes: Uint8Array = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const receipt: IAutoMovieProductionSemanticMaskReceipt = createAutoMovieProductionSemanticMaskReceipt({
      frame: 0,
      expectedShot: "opening",
      evidence,
      sidecar: { path: "semantic/opening.mask.json", bytes: sidecarBytes },
    });

  const changedMask: ReturnType<typeof seal> = seal({
      ...payload(evidence.mask),
      entries: [
        { ...evidence.mask.entries[0]!, owner: "space:elsewhere" },
        ...evidence.mask.entries.slice(1),
      ],
    });

  const reopenCases: Array<readonly [string, () => void, string]> = [
      [
        "extra receipt key",
        (): void => reopen({ receipt: { ...receipt, extra: true } as never }),
        "receipt keys",
      ],
      [
        "renamed receipt key",
        (): void => reopen({ receipt: renameKey(receipt, "shot", "take") }),
        "receipt keys",
      ],
      [
        "extra sidecar key",
        (): void =>
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
        (): void =>
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
        (): void => reopen({ receipt: { ...receipt, version: 2 } as never }),
        "receipt version 2",
      ],
      [
        "escaping receipt path",
        (): void =>
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
        (): void => reopen({ receipt: { ...receipt, frame: 1 } }),
        "stale semantic receipt frame",
      ],
      [
        "foreign pass",
        (): void => reopen({ receipt: { ...receipt, pass: "beauty" } as never }),
        "stale semantic receipt frame",
      ],
      [
        "foreign shot",
        (): void => reopen({ receipt: { ...receipt, shot: "closing" } }),
        "foreign semantic receipt",
      ],
      [
        "foreign resident path",
        (): void => reopen({ residentPath: "semantic/other.mask.json" }),
        "foreign semantic sidecar path",
      ],
      [
        "tampered resident bytes",
        (): void => reopen({ residentBytes: bytes("{}\n") }),
        "do not match its canonical palette",
      ],
      [
        "stale byte digest",
        (): void =>
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
        (): void =>
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
        (): void =>
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
        (): void =>
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
        (): void =>
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
        (): void =>
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
        (): void => reopen({ evidence: { ...evidence, mask: changedMask } }),
        "do not match its canonical palette",
      ],
    ];

  TestValidator.equals(
      "receipt reopening refuses every stale or foreign dependency",
      Object.fromEntries(
        reopenCases.map(([name, attempt, message]: readonly [string, () => void, string]): [string, boolean] => [
          name,
          throwsError(attempt, message),
        ]),
      ),
      Object.fromEntries(reopenCases.map(([name]: readonly [string, () => void, string]): [string, boolean] => [name, true])),
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
}
