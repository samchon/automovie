import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * Guarded static draft bytes paired with their explicit model admission report.
 * Successful encoding does not change the owner's rejected admission outcome.
 *
 * @evidence contracts/common.md#principled-implementation exportConstruction pairs owned guarded GLB bytes with the admission report for that exact constructed model, retaining rejection when reported.
 * @evidence contracts/common.md#clear-and-simple-design Byte encoding and model admission remain separate fields so inspection can expose a draft without presenting it as an ordinary accepted body.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Successful static serialization cannot upgrade rejected construction or certify anatomical, clinical or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation Members identify operation, owned ArrayBuffer-backed GLB output and the precise encoded model's admission result.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The output schema performs no GLB encoding or admission computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result type implements no caching of constructed drafts or encoded bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires/transfers no byte buffer or worker task; runtime and message hosts own those resources.
 * @author Samchon
 */
export interface IConnectedBodyConstructionExportResult {
  /** Matches the explicit draft encoding request. */
  operation: "exportConstruction";

  /** Owned static GLB bytes after normal export guards passed. */
  glb: Uint8Array<ArrayBuffer>;

  /** Admission of the exact constructed model encoded in these bytes. */
  admission: IAutoMovieHumanConstructionAdmission;
}
