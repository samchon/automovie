import type { IAutoMovieBuildProjectOutput, IAutoMovieDiagnostic } from "@automovie/interface";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { createAutoMovieBuildInputRaceFailure } from "./createAutoMovieBuildInputRaceFailure";
import { AUTOMOVIE_PRODUCTION_BUILD_VERSION } from "./productionBuildProtocol";

/**
 * Publish an admitted compilation through the project's transaction authority.
 *
 * Timed and library builders supply candidates after their requested gates pass. This function forwards the exact four commit arguments and reports the authority's returned revision with the prepared status and diagnostics references. An input-race error becomes the shared failure result; other failures propagate, and failed revision observation preserves both causes.
 *
 * @evidence contracts/common.md#principled-implementation The project authority owns revision comparison, input confirmation, output fencing, individual file publication and staged recovery. Success depends on caller-admitted candidates and the commit result; prepared statuses are not independently recomputed after publication, and forwarding a complete set does not make its visibility atomic.
 * @evidence contracts/common.md#clear-and-simple-design Timed and library publication share one handoff and one structured race policy, keeping lock and revision ownership in commitGenerated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the explicit AutoMovieProductionInputRaceError is converted; unrelated errors retain identity. No retry, fallback artifact, stale revision or partial materialized success is invented.
 * @evidence contracts/common.md#meaningful-documentation Documents admission premises, argument forwarding, borrowed output lists, committed revision and distinct race/other-error behavior.
 * @evidence contracts/performance.md#efficient-algorithms The success formatter allocates fixed record structure but includes the entire delegated staged transaction and its byte/fence/rollback work. A race appends and sorts D diagnostics in O(D log D) text comparisons and freshly observes revision.
 * @evidence contracts/performance.md#reuse-equivalent-work Prepared diagnostics/status arrays are reused by reference; publication effects remain attempt-specific and are not memoized. The transaction's byte no-op detection owns permissible write reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Success transfers the supplied lists and their retained objects to the caller; race failure shares diagnostics and may retain error causes. Transaction owners attempt lock/temporary cleanup and can report retained bytes or committed state after failure; this stage starts no task or cache and imposes no bound on candidate bytes.
 */
export function publishAutoMovieGeneratedCompilation(
  props: {
  /** Shared namespace and transaction owner of this compilation. */
  authority: Pick<AutoMovieProductionProject, "commitGenerated" | "revision">;


  /** Candidate bytes, ownership manifest, currentness guard and base revision. */
  publication: {
    /** Complete candidate files acquired for this attempt. */
    files: Parameters<AutoMovieProductionProject["commitGenerated"]>[0];


    /** Exact ownership manifest derived from those files and inputs. */
    manifest: Parameters<AutoMovieProductionProject["commitGenerated"]>[1];

    /** Required confirmation of this attempt's source and content closure. */
    inputCurrent: () => boolean;


    /** Revision observed before evaluating the candidate. */
    inputRevision: number;
  };

  /** Input identity the successful candidate was derived from. */
  inputFingerprint: IAutoMovieBuildProjectOutput["builder"]["inputFingerprint"];


  /** Complete ordered findings of the passed gates. */
  diagnostics: IAutoMovieDiagnostic[];

  /** Prepared statuses of the exact files being published. */
  materialized: IAutoMovieBuildProjectOutput["materialized"];
}
): IAutoMovieBuildProjectOutput {
  let revision: number;
  try {
    revision = props.authority.commitGenerated(
      props.publication.files,
      props.publication.manifest,
      props.publication.inputCurrent,
      props.publication.inputRevision,
    );
  } catch (error) {
    if (error instanceof AutoMovieProductionInputRaceError === false)
      throw error;
    return createAutoMovieBuildInputRaceFailure({
      diagnostics: props.diagnostics,
      inputFingerprint: props.inputFingerprint,
      failure: error,
      currentRevision: (): number => props.authority.revision(),
    });
  }
  return {
    success: true,
    revision,
    builder: {
      version: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
      inputFingerprint: props.inputFingerprint,
    },
    diagnostics: props.diagnostics,
    materialized: props.materialized,
  };
}
