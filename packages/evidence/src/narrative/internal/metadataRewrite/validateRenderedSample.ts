import type { IEvidenceMetadataRenderedSample } from "../../IEvidenceMetadataRenderedSample";
import type { IProtectedProjection } from "./IProtectedProjection";
import { errorMessage } from "./errorMessage";
import { normalizeFile } from "./normalizeFile";

/**
 * Requires and validates the auditable sample associated with a bulk batch.
 *
 * @evidence contracts/common.md#principled-implementation Require a bulk sample and check normalized file, positive line, nonempty fields and exact parsed candidate declaration text.
 * @evidence contracts/common.md#clear-and-simple-design Already-built projections bind the record without rereading or reparsing Markdown.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only changed metadata files qualify; nearby authored text or unchanged declarations cannot substitute.
 * @evidence contracts/common.md#meaningful-documentation The comment states the audit-record requirement; consistency validation does not independently observe readability.
 * @evidence contracts/performance.md#efficient-algorithms File membership scans F changed names; field checks scale with text and Map lookups reuse captured content.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing changed-file and projection populations are reused without a second filesystem scan.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Diagnostics and projections remain caller-owned; the shallow returned record holds sample fields with no handles or global state.
 */
export function validateRenderedSample(
  sample: IEvidenceMetadataRenderedSample | undefined,
  bulk: boolean,
  changedFiles: string[],
  projections: Map<
    string,
    { before: IProtectedProjection; after: IProtectedProjection }
  >,
  diagnostics: string[],
): IEvidenceMetadataRenderedSample | undefined {
  if (sample === undefined) {
    if (bulk)
      diagnostics.push(
        "bulk metadata rewrite requires an in-language rendered sample record.",
      );
    return undefined;
  }

  let file: string;
  try {
    file = normalizeFile(sample.file);
  } catch (error: unknown) {
    diagnostics.push(errorMessage(error));
    return undefined;
  }
  if (!changedFiles.includes(file))
    diagnostics.push(
      `${file}: rendered sample must belong to a file whose structural metadata changed.`,
    );
  if (!Number.isInteger(sample.line) || sample.line < 1)
    diagnostics.push(
      `${file}: rendered sample line must be a positive integer.`,
    );
  if (sample.language.trim() === "")
    diagnostics.push(`${file}: rendered sample language must be recorded.`);
  if (sample.confirmedBy.trim() === "")
    diagnostics.push(`${file}: rendered sample confirmer must be recorded.`);
  if (sample.text.trim() === "")
    diagnostics.push(`${file}: rendered sample text must not be empty.`);

  const declaration: string | undefined = projections
    .get(file)
    ?.after.declarations.get(sample.line);
  if (declaration === undefined || declaration !== sample.text)
    diagnostics.push(
      `${file}:${sample.line}: rendered sample text must exactly match a structural evidence declaration in the candidate.`,
    );
  return { ...sample, file };
}
