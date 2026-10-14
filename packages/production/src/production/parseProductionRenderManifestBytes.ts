import type { IAutoMovieProductionRenderManifest } from "@automovie/interface";
import { parseAutoMovieStructuredJson } from "./parseAutoMovieStructuredJson";
import { assertProductionRenderManifestRecord } from "./assertProductionRenderManifestRecord";

/**
 * Decode persisted manifest bytes through strict JSON ingress before exact schema admission.
 *
 * @evidence contracts/common.md#principled-implementation Strict UTF-8 and duplicate-aware JSON materialization precede manifest schema; delivery validation separately compares tracked bytes, renderer receipt and current publication/media facts.
 * @evidence contracts/common.md#clear-and-simple-design Composes canonical ingress and manifest schema owners without duplicating parsing or validation logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Encoding, grammar, duplicate decoded names and schema failures propagate without last-wins parsing; success grants no ownership, currentness or media proof.
 * @evidence contracts/common.md#meaningful-documentation Defines exact input bytes and admitted data, distinguishing structured-ingress Errors from typed schema refusal.
 * @evidence contracts/performance.md#efficient-algorithms Includes B-byte decoding, recursive materialization and schema traversal; ingress number-suffix copying may add quadratic text work and no byte budget is imposed.
 * @evidence contracts/performance.md#reuse-equivalent-work One materialized tree supplies validation and return without a second JSON parse or cross-read verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input bytes are borrowed synchronously; decoded text/parser state expires and the output tree transfers, with no native handle or retained byte inventory.
 */
export function parseProductionRenderManifestBytes(bytes: Uint8Array): IAutoMovieProductionRenderManifest {
  return assertProductionRenderManifestRecord(parseAutoMovieStructuredJson({ record: "render-manifest", bytes }));
}
