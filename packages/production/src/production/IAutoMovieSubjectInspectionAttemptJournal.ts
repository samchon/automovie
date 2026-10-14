import { IAutoMovieSubjectInspectionAttemptRecord } from "./IAutoMovieSubjectInspectionAttemptRecord";

/**
 * Group retained attempts under one exact ordered plan identity.
 *
 * @evidence contracts/common.md#principled-implementation Version one, plan identity, ordered attempts and false delivery lane define one journal schema.
 * @evidence contracts/common.md#clear-and-simple-design A separate plan directory keeps histories for changed contexts distinct.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The journal is mutable during locked transactions and has no fixed history cap; its schema does not freeze or physically verify records.
 * @evidence contracts/common.md#meaningful-documentation Attempt order is canonical and serialized history remains inspection evidence only.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Full-journal reads, schema checks and serialization execute in mutation/read owners.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One common transaction owner serves begin, record and finish, rather than this type coordinating effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Journal arrays belong to the publisher/reader and stored history lifetime is externally managed.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectInspectionAttemptJournal {
  /** Journal record format. */
  version: 1;

  /** Exact plan identity this journal belongs to. */
  planIdentity: string;

  /** Every attempt in monotonic order. */
  attempts: IAutoMovieSubjectInspectionAttemptRecord[];

  /** Never delivery evidence, and typed so it cannot become it. */
  deliveryEvidence: false;
}
