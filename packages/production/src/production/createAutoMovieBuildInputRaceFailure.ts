import type {
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
 * @evidence contracts/common.md#principled-implementation One compile-input-changed finding is appended to the attempt diagnostics, deterministically sorted, and paired with a fresh fenced revision; failed revision observation throws an AggregateError preserving both original causes by identity.
 * @evidence contracts/common.md#clear-and-simple-design Timed/library confirmation and publication share one race-result formatter; project authority remains responsible for revision observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No materialized success or stale revision is invented and the original race is not discarded when the secondary read fails.
 * @evidence contracts/common.md#meaningful-documentation States diagnostic mutation/order, fresh revision ownership, refused output and both-cause preservation.
 * @evidence contracts/performance.md#efficient-algorithms For D existing diagnostics, append is amortized constant and sorting costs O(D log D) comparisons whose string cost follows diagnostic text; one revision observation and small refusal allocation follow.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A race is an independent failed attempt and its current revision must be freshly observed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned refusal shares the supplied diagnostic list and transfers it to the caller; AggregateError retains both causes when thrown. This formatter opens no handle or task.
 */
export function createAutoMovieBuildInputRaceFailure(props: {
  /** Shared diagnostic result of this compilation attempt. */
  diagnostics: IAutoMovieDiagnostic[];

  /** Input identity the refused attempt actually compiled. */
  inputFingerprint: string;

  /** The original guarded-commit failure, preserved by identity. */
  failure: AutoMovieProductionInputRaceError;

  /** Fenced observation of the project's current revision. */
  currentRevision: () => number;
}): IAutoMovieBuildProjectOutput {
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
}
