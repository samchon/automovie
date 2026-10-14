import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Address one plan identity's attempts.json journal.
 *
 * @evidence contracts/common.md#principled-implementation A single encoded plan segment separates journal histories by complete ordered context.
 * @evidence contracts/common.md#clear-and-simple-design Journal mutation and read use the same relative address owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The address does not validate the plan digest or physical ancestry; callers own those admissions.
 * @evidence contracts/common.md#meaningful-documentation The returned slash path is relative to one compiled subject directory.
 * @evidence contracts/performance.md#efficient-algorithms Encoding/output allocation follows plan-id text length.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical segment encoder avoids a separate escaping convention.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only small path text escapes and no journal state or handle is retained.
 */
export function subjectInspectionInspectionJournalRelative(
  planIdentity: string
): string { return `${encodeAutoMoviePathSegment(planIdentity)}/attempts.json`; }
