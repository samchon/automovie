import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";

import type { IAutoMovieProductionSourceEvaluation } from "./IAutoMovieProductionSourceEvaluation";
import type { IAutoMovieProductionSourceSnapshot } from "./IAutoMovieProductionSourceSnapshot";
import { canonicalizeAutoMovieJson } from "./contentIdentity";

/**
 * Answer the read-only source gate with freshly checked reuse of one successful evaluation.
 *
 * Every call first attempts a fresh snapshot. If it matches a retained successful answer's dependency state, a clone of that answer is returned without rerunning authored source. This reuse assumes deterministic authored behavior over declared inputs; ordinary Node execution does not prove that premise or account for arbitrary external effects.
 *
 * A revision-bound answer also requires revision equality. Otherwise reuse compares all non-revision snapshot fields and returns the answer under the fresh observation's revision; this permits a revision change that leaves every recorded input unchanged without asserting equivalence for unrecorded effects.
 *
 * Any other case runs the supplied gate and returns its output unchanged. Acquisition exceptions become unavailable observations rather than cached success; evaluation exceptions propagate. Failed evaluations, unavailable initial observations and undeclared loaded modules skip the second acquisition because their answers cannot be retained.
 *
 * A successful answer is retained only after before/after snapshots agree on non-revision fields other than requested documents, the output revision equals the later observation, and output/generated/input fingerprints agree. Every reported document read must match its later digest, including repeated reads of one path. Loaded project modules must be declared by the evaluator. These finite observations cannot detect changed-and-restored inputs or establish atomic filesystem state.
 *
 * @evidence contracts/common.md#principled-implementation Retention requires a successful gate, matching complete before/after input observations, exact gate/generated fingerprints, unchanged actual prose reads and a fully declared executed-module closure; revision comparison is required only when the gate used it. Equivalence assumes authors obey deterministic declared-input semantics, which ordinary Node effects do not prove.
 * @evidence contracts/common.md#clear-and-simple-design One closure coordinates fresh acquisition, actual evaluation and at most one retained successful answer; helpers own snapshot equality and post-run proof without another watcher or cache service.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure/incomplete observation cannot preserve a cached success, a failed gate is never retained, outputs are cloned before reuse, and before/after checks cannot detect a changed-and-restored input or arbitrary undeclared Node effect.
 * @evidence contracts/common.md#meaningful-documentation States fresh observation, retention conditions, dependency traces, revision rebinding, failure behavior and the determinism/ABA limitations.
 * @evidence contracts/performance.md#efficient-algorithms Each request acquires a full current snapshot and compares canonical snapshot text; non-reused success may acquire a second snapshot and clone its output. Time/space include total observed and output bytes, map/set construction and arbitrary domain evaluation; failed or undeclared-module outputs skip the second observation because they cannot be retained.
 * @evidence contracts/performance.md#reuse-equivalent-work A closure shares only one proved success for the same project/input/generated/prose/declared-module dependency state, invalidating retained state before each observation and requiring revision equality when bound; returned clones prevent callers mutating the retained output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources At most one successful snapshot and cloned output survive between requests, with bytes bounded by current project populations but no fixed cap; replacement, failure or closure disposal releases references. Acquisition/evaluation own their handles and tasks, and this synchronous coordinator opens none.
 */
export function retainAutoMovieProductionSourceStatus(props: {
  /**
   * Read a fresh snapshot including the given documents, or null when the observation owner cannot admit a complete revision-bracketed result.
   */
  acquire: (
    documents: readonly string[],
  ) => IAutoMovieProductionSourceSnapshot | null;

  /** Run the read-only source gate once. */
  evaluate: () => IAutoMovieProductionSourceEvaluation;
}): (() => IAutoMovieBuildProjectOutput) {
  let retained: {
    snapshot: IAutoMovieProductionSourceSnapshot;
    output: IAutoMovieBuildProjectOutput;
    revisionBound: boolean;
  } | null = null;
  return (): IAutoMovieBuildProjectOutput => {
    const previous: typeof retained = retained;
    retained = null;
    const before: IAutoMovieProductionSourceSnapshot | null = observe((): IAutoMovieProductionSourceSnapshot | null =>
      props.acquire(
        previous === null
          ? []
          : previous.snapshot.documents.map((document: IAutoMovieProductionSourceSnapshot["documents"][number]): string => document.path),
      ),
    );
    if (
      previous !== null &&
      before !== null &&
      sameInputs(before, previous.snapshot, previous.revisionBound)
    ) {
      retained = {
        snapshot: before,
        output: { ...previous.output, revision: before.revision },
        revisionBound: previous.revisionBound,
      };
      return structuredClone(retained.output);
    }
    const evaluation: IAutoMovieProductionSourceEvaluation = props.evaluate();
    const after: IAutoMovieProductionSourceSnapshot | null =
      before === null ||
      evaluation.output.success === false ||
      evaluation.undeclaredModules.length !== 0
        ? null
        : observe((): IAutoMovieProductionSourceSnapshot | null =>
            props.acquire(
              evaluation.documents.map((document: IAutoMovieProductionSourceEvaluation["documents"][number]): string => document.path),
            ),
          );
    if (
      before !== null &&
      after !== null &&
      provesSnapshot(before, evaluation, after)
    )
      retained = {
        snapshot: after,
        output: structuredClone(evaluation.output),
        revisionBound: evaluation.revisionBound,
      };
    return evaluation.output;
  };
}

/** Read a snapshot, answering `null` for a read that throws. */
function observe(read: () => IAutoMovieProductionSourceSnapshot | null): IAutoMovieProductionSourceSnapshot | null {
  try {
    return read();
  } catch {
    return null;
  }
}

/** Whether two snapshots observed the same inputs, and the same revision when asked. */
function sameInputs(left: IAutoMovieProductionSourceSnapshot, right: IAutoMovieProductionSourceSnapshot, compareRevision: boolean): boolean {
  return compareRevision
    ? canonicalizeAutoMovieJson(left) === canonicalizeAutoMovieJson(right)
    : canonicalizeAutoMovieJson({ ...left, revision: null }) ===
      canonicalizeAutoMovieJson({ ...right, revision: null });
}

/**
 * Whether one successful, fully declared run matches the admitted before/after observations and its reported document reads.
 */
function provesSnapshot(before: IAutoMovieProductionSourceSnapshot, evaluation: IAutoMovieProductionSourceEvaluation, after: IAutoMovieProductionSourceSnapshot): boolean {
  const output: IAutoMovieBuildProjectOutput = evaluation.output;
  if (
    output.revision !== after.revision ||
    output.builder.inputFingerprint !== after.inputFingerprint ||
    after.generated.inputFingerprint !== after.inputFingerprint ||
    sameInputs(
      { ...before, documents: [] },
      { ...after, documents: [] },
      false,
    ) === false
  )
    return false;
  const read: Map<string, string | null> = new Map(
    after.documents.map((document: IAutoMovieProductionSourceSnapshot["documents"][number]): [string, string | null] => [document.path, document.digest]),
  );
  return evaluation.documents.every(
    (document: IAutoMovieProductionSourceEvaluation["documents"][number]): boolean => read.get(document.path) === document.digest,
  );
}
