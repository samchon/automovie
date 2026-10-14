import type { IAutoMovieProductionRenderManifest } from "@automovie/interface";
import typia from "typia";
import { admitProductionRenderLedgerValidation } from "./admitProductionRenderLedgerValidation";

/**
 * Admit materialized aggregate manifest data through its exact structural schema.
 *
 * @evidence contracts/common.md#principled-implementation Configured typia generates validateEquals, including additional-property refusal; the shared projector returns the same data or ordered schema descriptions.
 * @evidence contracts/common.md#clear-and-simple-design Owns the concrete manifest schema; byte ingress and publication/media comparisons have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No failed shape receives an unsafe cast; plain interface numbers/strings still need downstream semantic guards, and shape proves no renderer ownership.
 * @evidence contracts/common.md#meaningful-documentation Defines unknown input, same-reference success and typed schema refusal consumed after manifest JSON parsing.
 * @evidence contracts/performance.md#efficient-algorithms Generated traversal visits nested deliverables/files and exact properties; population and error description text drive work and temporary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses one materialized tree for one schema traversal without cloning it or retaining a path-keyed verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Accepted data transfers by reference; validation temporaries expire or projected strings transfer to the Error, with no persistent buffer or handle.
 */
export function assertProductionRenderManifestRecord(value: unknown): IAutoMovieProductionRenderManifest {
  return admitProductionRenderLedgerValidation("render-manifest", typia.validateEquals<IAutoMovieProductionRenderManifest>(value));
}
