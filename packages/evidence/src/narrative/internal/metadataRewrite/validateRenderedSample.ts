import type { IEvidenceMetadataRenderedSample } from "../../IEvidenceMetadataRenderedSample";
import type { IProtectedProjection } from "./IProtectedProjection";
import { errorMessage } from "./errorMessage";
import { normalizeFile } from "./normalizeFile";

/** Requires and validates the auditable sample associated with a bulk batch. */
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
