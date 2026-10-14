import path from "node:path";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import { AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE } from "./AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE";
import { parseAutoMovieSubjectInspectionPlan } from "./parseAutoMovieSubjectInspectionPlan";

/**
 * Reopen the published plan and compare its admitted identity before completing a sweep.
 *
 * @evidence contracts/common.md#principled-implementation Guarded plan bytes, duplicate-aware JSON and strict plan admission precede exact identity equality.
 * @evidence contracts/common.md#clear-and-simple-design The final sweep uses this disk observation separately from generated-manifest and host-runtime checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Any read/parse/admission failure becomes false, without implying absence or repairing a replaced plan.
 * @evidence contracts/common.md#meaningful-documentation Only the identity comparison escapes; plan physical ownership remains with the guarded reader.
 * @evidence contracts/performance.md#efficient-algorithms Read/schema/canonical plan hash costs scale with the complete published plan.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing plan parser is reused, but finalization rereads mutable disk bytes instead of retaining the initial verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Read buffers/parsed plan are local and guarded acquisition releases descriptors.
 */
export function subjectInspectionPublishedInspectionPlanMatches(
  props: {
  root: string;
  directory: string;
  planIdentity: string;
}
): boolean {
  try {
    const bytes: Uint8Array<ArrayBufferLike> = readAutoMovieProductionOwnedFile({
      root: props.root,
      directory: path.join(props.root, ...props.directory.split("/")),
      relative: AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE,
    });
    return (
      parseAutoMovieSubjectInspectionPlan(
        parseAutoMovieStructuredJson({
          record: `${props.directory}/${AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE}`,
          bytes,
        }),
      ).planIdentity === props.planIdentity
    );
  } catch {
    return false;
  }
}
