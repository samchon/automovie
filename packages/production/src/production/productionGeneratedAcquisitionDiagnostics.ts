import { validateGeneratedAcquisition } from "@automovie/engine";
import type {
  IAutoMovieAssetProvenance,
  IAutoMovieConstraintViolation,
  IAutoMovieDiagnostic,
  IAutoMovieValidation,
} from "@automovie/interface";

import { digestAutoMovieBytes } from "./contentIdentity";
import { autoMovieValidationFindings } from "./autoMovieValidationFindings";

/**
 * Admit optional generation provenance beside the asset's current byte identity.
 *
 * Unprocessed bytes must retain the generator's output digest. Processing
 * records declare a later transformation, so their current digest cannot prove
 * the original output; the generation record is still validated independently.
 * A published prompt must reproduce its declared digest as exact UTF-8 text.
 * Unpaired UTF-16 surrogates are refused before encoding can replace them.
 * Engine warnings remain warnings and do not block asset admission.
 *
 * @param asset Admitted asset record with current digest and optional origin.
 * @param path Ledger path attributed to every returned finding.
 *
 * @evidence contracts/common.md#principled-implementation The engine owns generation fields and reproducibility; current-byte equality applies only without processing because transformation changes those bytes. UTF-8 roundtrip equality rejects unpaired UTF-16 surrogates before SHA-256 identifies a different replacement-text instruction.
 * @evidence contracts/common.md#clear-and-simple-design One asset gate translates the engine's findings into ledger-addressed diagnostics and checks the prompt bytes that only this Node orchestration layer hashes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No provider or asset identity changes validation. Processing removes only the invalid comparison between transformed and original bytes; the acquisition's own fields remain checked.
 * @evidence contracts/common.md#meaningful-documentation States the optional metadata contract, transformed-byte limitation, prompt encoding, and warning effect. Parameters identify the asset and owning ledger path.
 * @evidence contracts/performance.md#efficient-algorithms One encoding, roundtrip decoding and hash pass take time linear in prompt length, plus the engine's linear generation-input scan. Transient space is the prompt buffer and decoded text, plus returned findings.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each ledger asset is admitted once per inventory observation; later inventories read new provenance and cannot reuse a prior verdict without that observation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The call returns owned diagnostic records and retains no asset, byte buffer, handle, or task after return.
 */
export function productionGeneratedAcquisitionDiagnostics(
  asset: IAutoMovieAssetProvenance,
  path: string,
): IAutoMovieDiagnostic[] {
  if (asset.generated === undefined) return [];
  const validation: IAutoMovieValidation = validateGeneratedAcquisition({
    acquisition: asset.generated,
    digest: (asset.processing?.length ?? 0) === 0 ? asset.digest : null,
  });
  const diagnostics: IAutoMovieDiagnostic[] = autoMovieValidationFindings(
    validation,
  ).map((finding: IAutoMovieConstraintViolation): IAutoMovieDiagnostic => ({
    code: "asset-provenance-incomplete",
    category: finding.severity,
    phase: "project",
    target: asset.path,
    path,
    message: `Asset "${asset.path}" generated${finding.path.slice("$input".length)} ${finding.expected}. Correct the recorded generation provenance before compiling.`,
  }));
  if (asset.generated.prompt !== null) {
    const promptBytes: Buffer = Buffer.from(asset.generated.prompt, "utf8");
    if (promptBytes.toString("utf8") !== asset.generated.prompt)
      diagnostics.push({
        code: "asset-provenance-incomplete",
        category: "error",
        phase: "project",
        target: asset.path,
        path,
        message: `Asset "${asset.path}" generated.prompt contains an unpaired UTF-16 surrogate and cannot identify exact UTF-8 instruction bytes. Record a Unicode instruction before compiling.`,
      });
    else if (digestAutoMovieBytes(promptBytes) !== asset.generated.promptDigest)
      diagnostics.push({
      code: "asset-provenance-incomplete",
      category: "error",
      phase: "project",
      target: asset.path,
      path,
      message: `Asset "${asset.path}" generated.promptDigest does not identify the exact published UTF-8 prompt. Record the digest of that instruction before compiling.`,
      });
  }
  return diagnostics;
}
