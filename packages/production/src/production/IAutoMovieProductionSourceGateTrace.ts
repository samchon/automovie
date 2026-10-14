/**
 * What one read-only source gate run read that no input fingerprint carries.
 *
 * Screenplay identity/carrier validation reads author-owned documents, and camera clearance can read supplied geometry revisions. Later reuse compares fresh document observations and, when marked, revision identity; the trace records dependencies rather than enforcing Node determinism.
 *
 * @evidence contracts/common.md#principled-implementation The trace records the exact prose returned at each read and whether clearance judged the revision, which are dependencies the builder fingerprint alone does not describe.
 * @evidence contracts/common.md#clear-and-simple-design The builder fills one execution trace; evaluation hashes its text into proof facts, and retention compares those with a later fresh observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Repeated reads and missing documents remain observable rather than collapsing to a latest value or invented empty text.
 * @evidence contracts/common.md#meaningful-documentation States read ordering, repetition, absent-document meaning and revision dependency.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The trace type runs no code; document reading and hashing costs belong to the builder and evaluator.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This trace describes one gate execution and does not itself cache or coordinate another run.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder and evaluator own the trace during one execution; retention stores digests rather than these texts. Read count and total prose length determine its transient size without a fixed cap.
 * @author Samchon
 */
export interface IAutoMovieProductionSourceGateTrace {
  /**
   * Every author-owned document recorded by the gate, in read order, with its observed text or null for absence. Repeated reads remain distinct observations.
   */
  documents: Array<{
    /** Project-relative document path. */
    path: string;

    /** Text the gate read, or `null` when the document was absent. */
    content: string | null;
  }>;

  /** Whether a clearance evaluation read the project revision. */
  revisionBound: boolean;
}
