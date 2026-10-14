import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";

import type { IAutoMovieProductionSourceEvaluation } from "./IAutoMovieProductionSourceEvaluation";
import type { IAutoMovieProductionSourceSnapshot } from "./IAutoMovieProductionSourceSnapshot";
import { canonicalizeAutoMovieJson } from "./contentIdentity";

/**
 * Answer the read-only source gate, running it only when its inputs moved.
 *
 * Every call reads a fresh snapshot first. When a successful answer is
 * retained and that fresh snapshot equals the one the answer was retained with,
 * the answer is returned without executing any authored source. Authored code
 * must be deterministic over declared inputs; ordinary Node execution does not
 * prove that premise, so undeclared effects remain a limitation of this reuse.
 * The observation itself is never skipped: a capture, a receipt reopen or a guarded
 * commit that asks again reads the project again.
 *
 * The revision names when a snapshot was read, and it is compared only for an
 * answer that read the revision number into what it judged. Every project write
 * that moves a gate input also moves another snapshot field, so a write that
 * moves none, such as the render commit a capture makes just before its receipt
 * is reopened, leaves an unbound answer standing, and the answer is returned
 * under the fresh observation's revision without rerunning source.
 *
 * Any other case runs the gate and returns its output unchanged. A differing
 * snapshot, a snapshot that could not be read completely, and a read that throws
 * all end there, so no read failure can turn into a success and the gate's own
 * diagnostics or exception carry the original cause. A failed answer is never
 * retained, so an invalid project runs the gate and reports its diagnostics on
 * every call, and neither it nor an answer that executed an undeclared module
 * pays for a second read after the run, because neither could be kept.
 *
 * A successful answer is retained only when it is provably the answer for one
 * snapshot. The snapshots read before and after the run must agree on every
 * input except documents. The answer's revision and input fingerprint must
 * equal the later snapshot's, and so must the fingerprint its resident generated
 * manifest records. Every document the run read must still read the same, and no
 * executed project module may sit outside the fingerprinted content. An input
 * that changed and changed back while the gate ran is the one race this cannot
 * see, which is the same limit as the builder's own before-and-after
 * publication guard.
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
   * Read a fresh snapshot, including the given documents, or `null` when no
   * complete consistent observation is available.
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
 * Whether one successful, fully declared run is the answer for the snapshot
 * read after it.
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
