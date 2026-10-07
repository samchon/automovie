import type {
  AutoMovieContentDigest,
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";

import type { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { compareDiagnostics } from "./productionBuildDiagnostics";
import { AUTOMOVIE_PRODUCTION_BUILD_VERSION } from "./productionBuildProtocol";

/**
 * Return one timed or library compilation's refused input-generation result.
 *
 * The same diagnostic owner appends and orders the failure for both kinds.
 * A fresh revision belongs to the project authority, not to this result
 * formatter. If that observation is itself refused after a root or namespace
 * replacement, both the original race and the observation error remain in an
 * AggregateError. No stale revision is invented to complete the result shape.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-atomic-compilation Returns a structured changed-input failure with no materialized files, retaining the failed attempt's input identity.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-atomic-invariant Refuses to mix the attempted input generation with a later publication and preserves both causes when current state cannot be observed.
 */
export const createAutoMovieBuildInputRaceFailure = (props: {
  /** Shared diagnostic result of this compilation attempt. */
  diagnostics: IAutoMovieDiagnostic[];

  /** Input identity the refused attempt actually compiled. */
  inputFingerprint: AutoMovieContentDigest;

  /** The original guarded-commit failure, preserved by identity. */
  failure: AutoMovieProductionInputRaceError;

  /** Fenced observation of the project's current revision. */
  currentRevision: () => number;
}): IAutoMovieBuildProjectOutput => {
  props.diagnostics.push({
    code: "compile-input-changed",
    category: "error",
    phase: "compile",
    target: "builder-input",
    path: null,
    message: `${props.failure.message} Re-run the project's compile entry against the current design, source, and declared content snapshot.`,
  });
  props.diagnostics.sort(compareDiagnostics);
  let revision: number;
  try {
    revision = props.currentRevision();
  } catch (observationError) {
    throw new AggregateError(
      [props.failure, observationError],
      "Compilation inputs changed, and the current project revision could not be observed. Both causes are retained; discard the stale project handle and inspect the current root before retrying.",
    );
  }
  return {
    success: false,
    revision,
    builder: {
      version: AUTOMOVIE_PRODUCTION_BUILD_VERSION,
      inputFingerprint: props.inputFingerprint,
    },
    diagnostics: props.diagnostics,
    materialized: [],
  };
};
