import type { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { resolveAutoMovieSubjectReviewUnit } from "@automovie/engine";
import { IAutoMovieCompiledShotSource, IAutoMovieSubjectReviewTarget, type IAutoMovieSubjectReviewUnit } from "@automovie/interface";
import typia from "typia";
import { digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { subjectInspectionIResolvedInspectionSubject } from "./subjectInspectionIResolvedInspectionSubject";
import { subjectInspectionCompiledSubjectSpellings } from "./subjectInspectionCompiledSubjectSpellings";

/**
 * Read current compiled shot bytes and try supported subject spellings in order.
 *
 * @evidence contracts/common.md#principled-implementation Exact acquired bytes provide the revision digest and strict compiled-shot assertion before the engine resolves a subject unit.
 * @evidence contracts/common.md#clear-and-simple-design The spelling adapter is separate from native subject resolution and the returned description shares its resolved unit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Read/schema/selector errors collapse to null or the next spelling; this helper does not independently compare the generated manifest's entry digest.
 * @evidence contracts/common.md#meaningful-documentation The result carries the actual acquired revision, not the caller's discarded viewer suffix.
 * @evidence contracts/performance.md#efficient-algorithms Shot acquisition/hash/schema and up to two engine subject-resolution calls dominate work.
 * @evidence contracts/performance.md#reuse-equivalent-work One parsed shot/revision serves both spelling attempts without a cross-request compiled cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned unit/description retain their parsed artifact references; guarded reads own handles and temporary bytes leave when unreferenced.
 */
export function subjectInspectionResolveSubject(
  services: IAutoMovieProductionServices,
  target: IAutoMovieSubjectReviewTarget
): subjectInspectionIResolvedInspectionSubject | null {
  let bytes: Uint8Array;
  let compiled: IAutoMovieCompiledShotSource;
  try {
    bytes = services.project.readGeneratedFile(
      `shots/${encodeAutoMoviePathSegment(target.shot)}.json`,
    );
    // Read and schema failures share the unresolved-subject outcome.
    compiled = typia.assertEquals<IAutoMovieCompiledShotSource>(
      parseAutoMovieStructuredJson({
        record: `generated shot ${target.shot}`,
        bytes,
      }),
    );
  } catch {
    return null;
  }
  const revision: string = digestAutoMovieBytes(bytes);
  for (const subject of subjectInspectionCompiledSubjectSpellings(target.subject))
    try {
      const unit: IAutoMovieSubjectReviewUnit = resolveAutoMovieSubjectReviewUnit(
        { revision, compiled },
        { shot: target.shot, subject },
      );
      return { revision, unit, description: unit.description };
    } catch {
      continue;
    }
  return null;
}
