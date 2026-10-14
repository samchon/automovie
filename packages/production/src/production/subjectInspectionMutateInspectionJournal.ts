import fs from "node:fs";
import path from "node:path";
import { acquireCommitLock, releaseCommitLock } from "../project/commitLock";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { subjectInspectionINSPECTION_LOCK_PATH } from "./subjectInspectionINSPECTION_LOCK_PATH";
import { IAutoMovieSubjectInspectionAttemptJournal } from "./IAutoMovieSubjectInspectionAttemptJournal";
import { subjectInspectionInspectionJournalRelative } from "./subjectInspectionInspectionJournalRelative";
import { subjectInspectionParseInspectionJournal } from "./subjectInspectionParseInspectionJournal";

/**
 * Serialize one same-plan journal mutation under the project inspection lock.
 *
 * @evidence contracts/common.md#principled-implementation The current journal is parsed or initialized, mutated, written to a same-directory staged path and renamed while holding the shared lock.
 * @evidence contracts/common.md#clear-and-simple-design Beginning, recording and finishing attempts share this transaction rather than separate numbering/serialization logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Directory ancestry is not independently fenced by these raw fs writes; failures can leave a staged file, and no broader sweep transaction is claimed.
 * @evidence contracts/common.md#meaningful-documentation Mutation is synchronous and lock release runs in finally; journal history is retained rather than erased on failure.
 * @evidence contracts/performance.md#efficient-algorithms Every edit rereads/parses/serializes the whole growing journal, plus mkdir/lock work; repeated history edits can accumulate quadratic byte work.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared lock owner handles reentrancy/release, but journal state is not cached across operations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The lock token is released on success/failure; journal/text buffers are local while disk history grows without eviction and staged failure bytes can remain.
 */
export function subjectInspectionMutateInspectionJournal(
  props: {
    root: string;
    directory: string;
    planIdentity: string;
  },
  mutate: (journal: IAutoMovieSubjectInspectionAttemptJournal) => void
): void {
  const relative: string = `${props.directory}/${subjectInspectionInspectionJournalRelative(
    props.planIdentity,
  )}`;
  const absolute: string = path.join(props.root, ...relative.split("/"));
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  const lockFile: string = path.join(props.root, ...subjectInspectionINSPECTION_LOCK_PATH.split("/"));
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  const token: string = acquireCommitLock(lockFile);
  try {
    let journal: IAutoMovieSubjectInspectionAttemptJournal;
    if (fs.existsSync(absolute))
      journal = subjectInspectionParseInspectionJournal(
        parseAutoMovieStructuredJson({
          record: relative,
          bytes: fs.readFileSync(absolute),
        }),
        props.planIdentity,
      );
    else
      journal = {
        version: 1,
        planIdentity: props.planIdentity,
        attempts: [],
        deliveryEvidence: false,
      };
    mutate(journal);
    const staged: string = `${absolute}.staged`;
    fs.writeFileSync(staged, `${JSON.stringify(journal, null, 2)}\n`, "utf8");
    fs.renameSync(staged, absolute);
  } finally {
    releaseCommitLock(lockFile, token);
  }
}
