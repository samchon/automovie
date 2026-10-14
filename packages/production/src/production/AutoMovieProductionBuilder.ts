import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type { IAutoMovieBuildProjectInput, IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieProductionSourceGateTrace } from "./IAutoMovieProductionSourceGateTrace";
import { runAutoMovieProductionBuild } from "./runAutoMovieProductionBuild";

/**
 * Compile one admitted project's authored modules through observed source and domain gates.
 *
 * The builder captures project and host evidence dependencies. Build delegates the admitted artifact set to the guarded project transaction; lint uses the same coordinator with generated repair and publication disabled, and lintSource additionally traces prose and revision dependencies for source-status reuse. The transaction applies individual file operations and can report incomplete recovery; this facade provides no atomic visibility of the whole set.
 *
 * @evidence contracts/common.md#principled-implementation One run coordinator binds observed design, normalized source, fixed content and authoring ownership to a current input fingerprint before returning or publishing; the engine owns geometry, motion and domain semantics.
 * @evidence contracts/common.md#clear-and-simple-design The public facade exposes writable, read-only and traced source scopes; source observation, shot compilation, production review and finalization are separate concrete phases of that same attempt.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lint cannot repair ownership or publish output, errors cannot publish, and changed input is refused rather than silently retried against another revision.
 * @evidence contracts/common.md#meaningful-documentation States captured dependencies, scope effects, delegated staged publication and trace purpose; ordinary Node execution is not a determinism certificate.
 * @evidence contracts/performance.md#efficient-algorithms Each call pays the complete attempt's design/content/source observation, runtime materialization, domain validation, hashing and diagnostic sorting; work scales with those declared populations and their geometry/media algorithms, accounted for on the coordinator and phase owners.
 * @evidence contracts/performance.md#reuse-equivalent-work A call shares observed content, source buffers and runtime indexes across its phases. The separate retained-status owner may skip a later run only after fresh input equivalence is proved; this builder itself caches no compile answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains the admitted project and host dependency references for its lifetime. Attempt buffers transfer to output or are released; project readers and publication own handles, while the process module cache keeps executed source until the next attempt evicts its project closure.
 */
export class AutoMovieProductionBuilder {
  public constructor(
    /** Admitted namespace and existing reader/publication authority shared by each call. */
    private readonly project: AutoMovieProductionProject,

    /** Fixed authoring declaration used when a fresh reader is not supplied. */
    private readonly authoringEvidence?: IAutoMovieProductionEvidence,

    /** Fresh declaration reader consulted by the coordinator's currentness checks. */
    private readonly currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,

    /** Host-supplied render plan used by final-scope admission. */
    private readonly finalRenderPlan?: IAutoMovieProductionRenderJobPlan,
  ) {}

  /**
   * Validate the requested scope and delegate admitted output to guarded publication.
   *
   * @evidence contracts/common.md#principled-implementation The coordinator accumulates scope findings against an observed revision, confirms current input identity and publishes only error-free non-design output through the project transaction.
   * @evidence contracts/common.md#clear-and-simple-design This entry selects writable execution; domain phases and the project authority own compilation and physical publication.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused or raced attempt returns no materialized success, and no output bytes are fabricated to satisfy the gate.
   * @evidence contracts/common.md#meaningful-documentation States requested-scope admission and staged publication ownership; file visibility, rollback and postcommit failures follow the project transaction contract.
   * @evidence contracts/performance.md#efficient-algorithms Full attempt cost follows declared source/content, shot/model populations and domain geometry/media checks, then hashing, sorting and guarded generated-byte publication.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each invocation is a separate effectful compile attempt; normalized buffers and runtime indexes are shared only inside it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Attempt data is local to the coordinator or transferred through the project transaction; readers own descriptor cleanup, and publisher cleanup/rollback can report failures that leave temporary or published bytes and fences resident.
   */
  public build(input: IAutoMovieBuildProjectInput): IAutoMovieBuildProjectOutput {
    return this.run(input, true);
  }

  /**
   * Observe the requested gate scope without repair or generated-file publication.
   *
   * @evidence contracts/common.md#principled-implementation Read-only execution runs the same input and domain gates with materialization disabled, so existing ownership and freshness faults remain observable.
   * @evidence contracts/common.md#clear-and-simple-design The single materialization choice selects read-only behavior in the shared coordinator rather than maintaining another compiler.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Lint cannot fix the generated state it is meant to judge, and it returns the gate's actual findings.
   * @evidence contracts/common.md#meaningful-documentation States shared requested-scope coordination with repair and publication disabled; prerequisite refusals can prevent dependent phases from running.
   * @evidence contracts/performance.md#efficient-algorithms Lint pays source evaluation, materialization in memory, identity hashing and domain validation for its requested scope, plus currentness observation; it avoids physical generated publication rather than claiming compilation work disappears.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This entry executes a fresh attempt; the external source-status owner decides when a proved equivalent answer permits skipping it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Attempt-local buffers and findings are released or returned, readers close their handles, and no output ownership transfers to resident generated files.
   */
  public lint(input: IAutoMovieBuildProjectInput): IAutoMovieBuildProjectOutput {
    return this.run(input, false);
  }

  /**
   * Run read-only source gates and record exact prose and revision dependencies.
   *
   * Repeated document reads remain ordered. A revision-bound clearance answer is marked so retained status can require that revision on later reuse.
   *
   * @evidence contracts/common.md#principled-implementation One execution trace records actual prose text or absence for every validation read and whether clearance read the revision, the dependencies omitted from the ordinary builder fingerprint.
   * @evidence contracts/common.md#clear-and-simple-design The source-only facade returns output beside its trace; evaluation hashes the observed text and the status owner proves reuse from fresh snapshots.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing and repeated reads remain distinct, and read-only source execution cannot repair or publish generated output.
   * @evidence contracts/common.md#meaningful-documentation Gives source scope, actual read ordering, revision-bound meaning and retained-status purpose.
   * @evidence contracts/performance.md#efficient-algorithms This performs the full source-scope attempt plus O(R+B) trace storage for R prose reads and B total returned text bytes; repeat reads remain because each observation may differ.
   * @evidence contracts/performance.md#reuse-equivalent-work The trace supplies later equivalence proof rather than caching execution here; one trace belongs to one gate run and records every read that run made.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Trace text and output transfer to the caller; the evaluator retains their digests for status proof, while this builder keeps no trace after return.
   */
  public lintSource(): IAutoMovieProductionSourceGateTrace & { output: IAutoMovieBuildProjectOutput } {
    const trace: IAutoMovieProductionSourceGateTrace = { documents: [], revisionBound: false };
    const output: IAutoMovieBuildProjectOutput = this.run({ scope: "source" }, false, trace);
    return { ...trace, output };
  }

  private run(input: IAutoMovieBuildProjectInput, materialize: boolean, trace?: IAutoMovieProductionSourceGateTrace): IAutoMovieBuildProjectOutput {
    return runAutoMovieProductionBuild({
      project: this.project,
      authoringEvidence: this.authoringEvidence,
      currentAuthoringEvidence: this.currentAuthoringEvidence,
      finalRenderPlan: this.finalRenderPlan,
      input,
      materialize,
      trace,
    });
  }
}
