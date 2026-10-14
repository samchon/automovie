import type {
  IAutoMovieBuildProjectOutput,
} from "@automovie/interface";

/**
 * One run of the read-only source gate and the reads its answer rests on.
 *
 * The output is what every caller receives. The document reads and the
 * executed module closure are what a later caller needs to decide whether that
 * output still answers for the project without running the gate again. A
 * document is compared by the digest of the text the gate actually read. A
 * project module outside the fingerprinted content has no field that would see
 * its edit, so its presence alone keeps the answer from being reused.
 *
 * @evidence contracts/common.md#principled-implementation Reuse depends on the gate's actual document text digests, executed module closure, and revision dependency beside its output; an undeclared executed module prevents a fingerprint from proving equivalence.
 * @evidence contracts/common.md#clear-and-simple-design Evaluation records facts about one execution, while the source snapshot records fresh observable inputs and the retained-status owner decides whether they prove the same answer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The gate output is preserved, repeated document reads remain ordered, and undeclared modules are exposed instead of being assumed covered by source identity.
 * @evidence contracts/common.md#meaningful-documentation Gives document read order, null digests, undeclared-module invalidation, and why only revision-dependent answers compare the revision itself.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result shape executes no work; the source evaluator owns module listing and document hashing.
 * @evidence contracts/performance.md#reuse-equivalent-work The retained-status owner may reuse a successful evaluation only against fresh matching inputs and unchanged read documents, with no undeclared executed modules; this carrier supplies those proof facts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One evaluation holds output, document digests and module names under its caller; the document and module populations bound its size, and no loaded module or raw document text is retained by this record.
 * @author Samchon
 */
export interface IAutoMovieProductionSourceEvaluation {
  /** The gate's own answer, returned to the caller unchanged. */
  output: IAutoMovieBuildProjectOutput;

  /**
   * Every author-owned document the gate's validation read, in read order, with
   * the digest of the text it saw or `null` when the document was absent.
   */
  documents: Array<{
    /** Project-relative document path. */
    path: string;

    /** Digest of the text the gate read, or `null` when it was absent. */
    digest: string | null;
  }>;

  /**
   * Project modules the gate executed that no fingerprinted content input
   * covers, as project-relative paths in path order.
   */
  undeclaredModules: string[];

  /**
   * Whether the answer read the project revision into what it judged.
   *
   * A camera clearance report records the geometry revision it measured, so a
   * compiled take with one depends on the revision number itself. An answer that
   * never read it depends only on the observed inputs, and a write that moves no
   * input, such as a render commit, leaves it standing.
   */
  revisionBound: boolean;
}
