import { IAutoMovieCurrentSubjectReviewObservation } from "@automovie/engine";
import { IAutoMovieCaptureRuntimeIdentity, IAutoMovieSubjectReviewViewpoint } from "@automovie/interface";
import fs from "node:fs";
import path from "node:path";
import { encodeAutoMoviePathSegment } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { readAutoMovieProductionOwnedFile } from "./productionRenderJob";
import { AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE } from "./AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE";
import { IAutoMovieSubjectInspectionPlanRecord } from "./IAutoMovieSubjectInspectionPlanRecord";
import { IAutoMovieSubjectInspectionObservationRecord } from "./IAutoMovieSubjectInspectionObservationRecord";
import { IAutoMovieSubjectInspectionAttemptRecord } from "./IAutoMovieSubjectInspectionAttemptRecord";
import { IAutoMovieSubjectInspectionAttemptJournal } from "./IAutoMovieSubjectInspectionAttemptJournal";
import { parseAutoMovieSubjectInspectionPlan } from "./parseAutoMovieSubjectInspectionPlan";
import { parseAutoMovieSubjectInspectionObservation } from "./parseAutoMovieSubjectInspectionObservation";
import { verifyAutoMovieSubjectInspectionObservation } from "./verifyAutoMovieSubjectInspectionObservation";
import { inspectionDirectory } from "./inspectionDirectory";
import { subjectInspectionInspectionJournalRelative } from "./subjectInspectionInspectionJournalRelative";
import { subjectInspectionParseInspectionJournal } from "./subjectInspectionParseInspectionJournal";

/**
 * Reopen the exact supplied plan's journal and admit its physically available observations.
 *
 * @evidence contracts/common.md#principled-implementation Strict current-plan identity and journal admission precede exact encoded record/artifact paths, guarded reads and record/byte/runtime verification.
 * @evidence contracts/common.md#clear-and-simple-design The reader returns denominator, verified per-view receipts and same-plan attempt history without constructing a new plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed/unsafe/missing reads are skipped or empty; failed attempts' admitted prefixes may remain readable, and supplied plan/runtime currentness is not independently observed here.
 * @evidence contracts/common.md#meaningful-documentation Version-one plans are historical; observations preserve journal traversal order rather than being explicitly sorted into plan order.
 * @evidence contracts/performance.md#efficient-algorithms Work includes plan/journal reads, every listed record/PNG byte population and repeated plan canonicalization/viewpoint searches in per-record verification.
 * @evidence contracts/performance.md#reuse-equivalent-work Expected plan/directory/journal serve the sweep, but verification reparses the same plan for each candidate and no disk verdict cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned planned/history arrays alias admitted records and observation projections are new; guarded readers release handles and no pixel cache survives.
 */
export function readAutoMovieSubjectInspection(
  props: {
  /** Project root the inspection published into. */
  projectRoot: string;

  /** Production namespace the inspection ran in. */
  productionId: string;

  /** Compiled artifact owning the subject. */
  shot: string;

  /** Compiled subject id. */
  subject: string;

  /** Exact current ordered plan and context. */
  plan: IAutoMovieSubjectInspectionPlanRecord;

  /** Complete capture runtime expected now, or null when unidentified. */
  runtimeIdentity: IAutoMovieCaptureRuntimeIdentity | null;
}
): {
  /** Declared viewpoint population, empty when nothing was ever planned. */
  planned: IAutoMovieSubjectReviewViewpoint[];

  /** Admitted observations in journal traversal order, including passed prefixes. */
  observations: IAutoMovieCurrentSubjectReviewObservation[];

  /** Same-plan attempt history, including non-passed terminal outcomes. */
  history: IAutoMovieSubjectInspectionAttemptRecord[];
} {
  const directory: string = inspectionDirectory(
    props.productionId,
    props.shot,
    props.subject,
  );
  let expected: IAutoMovieSubjectInspectionPlanRecord;
  try {
    expected = parseAutoMovieSubjectInspectionPlan(props.plan);
  } catch {
    return { planned: [], observations: [], history: [] };
  }
  const ownedDirectory: string = path.join(props.projectRoot, ...directory.split("/"));
  const readOwned: (relative: string) => Uint8Array | null = (relative: string): Uint8Array | null => {
    try {
      if (fs.existsSync(ownedDirectory) === false) return null;
      return readAutoMovieProductionOwnedFile({
        root: props.projectRoot,
        directory: ownedDirectory,
        relative,
        optional: true,
      });
    } catch {
      return null;
    }
  };
  const planBytes: Uint8Array<ArrayBufferLike> | null = readOwned(AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE);
  if (planBytes === null) return { planned: [], observations: [], history: [] };
  let plan: IAutoMovieSubjectInspectionPlanRecord;
  try {
    plan = parseAutoMovieSubjectInspectionPlan(
      parseAutoMovieStructuredJson({
        record: `${directory}/${AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE}`,
        bytes: planBytes,
      }),
    );
  } catch {
    // v1 and every malformed/unknown version are historical, never inferred.
    return { planned: [], observations: [], history: [] };
  }
  if (
    expected.productionId !== props.productionId ||
    expected.target.shot !== props.shot ||
    expected.target.subject !== props.subject ||
    plan.planIdentity !== expected.planIdentity
  )
    return { planned: expected.planned, observations: [], history: [] };
  const journalBytes: Uint8Array<ArrayBufferLike> | null = readOwned(
    subjectInspectionInspectionJournalRelative(expected.planIdentity),
  );
  if (journalBytes === null)
    return { planned: expected.planned, observations: [], history: [] };
  let journal: IAutoMovieSubjectInspectionAttemptJournal;
  try {
    journal = subjectInspectionParseInspectionJournal(
      parseAutoMovieStructuredJson({
        record: `${directory}/${subjectInspectionInspectionJournalRelative(expected.planIdentity)}`,
        bytes: journalBytes,
      }),
      expected.planIdentity,
    );
  } catch {
    return { planned: expected.planned, observations: [], history: [] };
  }
  const observations: IAutoMovieCurrentSubjectReviewObservation[] = [];
  for (const attempt of journal.attempts)
    for (const recordPath of attempt.observations) {
      const prefix: string = `${directory}/`;
      if (recordPath.startsWith(prefix) === false) continue;
      const relativeRecord: string = recordPath.slice(prefix.length);
      const recordBytes: Uint8Array<ArrayBufferLike> | null = readOwned(relativeRecord);
      if (recordBytes === null) continue;
      let record: IAutoMovieSubjectInspectionObservationRecord;
      try {
        record = parseAutoMovieSubjectInspectionObservation(
          parseAutoMovieStructuredJson({
            record: recordPath,
            bytes: recordBytes,
          }),
        );
      } catch {
        continue;
      }
      const expectedRecord: string = `${encodeAutoMoviePathSegment(
        expected.planIdentity,
      )}/attempt-${attempt.attempt}/${encodeAutoMoviePathSegment(
        record.viewpoint,
      )}.json`;
      const artifactPrefix: string = `${directory}/`;
      if (
        relativeRecord !== expectedRecord ||
        record.attempt !== attempt.attempt ||
        record.observation.artifact.startsWith(artifactPrefix) === false
      )
        continue;
      const relativeArtifact: string = record.observation.artifact.slice(
        artifactPrefix.length,
      );
      const expectedArtifact: string = expectedRecord.replace(/\.json$/u, ".png");
      if (relativeArtifact !== expectedArtifact) continue;
      const artifactBytes: Uint8Array<ArrayBufferLike> | null = readOwned(relativeArtifact);
      if (artifactBytes === null) continue;
      if (props.runtimeIdentity === null) continue;
      try {
        observations.push(
          verifyAutoMovieSubjectInspectionObservation({
            plan,
            runtimeIdentity: props.runtimeIdentity,
            record,
            artifactBytes,
          }),
        );
      } catch {
        continue;
      }
    }
  return {
    planned: expected.planned,
    observations,
    history: journal.attempts,
  };
}
