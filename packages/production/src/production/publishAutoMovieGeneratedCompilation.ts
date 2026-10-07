import type {
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";

import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { createAutoMovieBuildInputRaceFailure } from "./createAutoMovieBuildInputRaceFailure";
import { AUTOMOVIE_PRODUCTION_BUILD_VERSION } from "./productionBuildProtocol";

/**
 * Settle one validated compilation through the project's publication authority.
 *
 * Timed and library builders call this only after every requested gate passed.
 * The existing project transaction owns revision comparison, input confirmation,
 * output fencing and atomic writes. This stage passes the exact candidate and
 * guard to it and reports its committed revision with the prepared file status.
 *
 * A concurrent input change becomes the shared structured failure result. Other
 * publication errors propagate unchanged, and a failed revision observation
 * preserves both original causes through the race-result policy. This stage
 * creates no lock, revision owner, retry, fallback artifact or partial success.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-atomic-compilation Settles the complete generated candidate through one guarded transaction and returns no materialized files after an input race.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-atomic-invariant Delegates the exact candidate and acquired revision to the existing atomic authority and preserves refusal as a failure result.
 */
export const publishAutoMovieGeneratedCompilation = (props: {
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
}): IAutoMovieBuildProjectOutput => {
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
      currentRevision: () => props.authority.revision(),
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
};
