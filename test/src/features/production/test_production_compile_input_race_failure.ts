import type {
  AutoMovieContentDigest,
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";
import { AutoMovieProductionInputRaceError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const { createAutoMovieBuildInputRaceFailure } = loadSourceModule<{
  createAutoMovieBuildInputRaceFailure(props: {
    diagnostics: IAutoMovieDiagnostic[];
    inputFingerprint: AutoMovieContentDigest;
    failure: AutoMovieProductionInputRaceError;
    currentRevision: () => number;
  }): IAutoMovieBuildProjectOutput;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/createAutoMovieBuildInputRaceFailure.ts",
  ),
);

/**
 * A changed compile input stays a failure even when current state cannot open.
 *
 * Scenarios:
 * 1. A readable current revision produces one ordered, source-attributed refusal
 *    and no materialized bytes, retaining the attempt's input identity.
 * 2. A refused revision observation preserves both the original race object and
 *    the exact observation failure, with no invented revision result.
 */
export const test_production_compile_input_race_failure = (): void => {
  const failure = new AutoMovieProductionInputRaceError(
    "The source snapshot moved.",
  );
  const fingerprint: AutoMovieContentDigest = `sha256:${"a".repeat(64)}`;
  const prior: IAutoMovieDiagnostic = {
    code: "source-export-missing",
    category: "warning",
    phase: "source",
    target: "ship",
    path: "src/ship.ts",
    message: "An incomplete source owner remains.",
  };
  const diagnostics = [prior];
  const result = createAutoMovieBuildInputRaceFailure({
    diagnostics,
    inputFingerprint: fingerprint,
    failure,
    currentRevision: () => 8,
  });
  TestValidator.equals(
    "race result keeps its attempted identity and publishes nothing",
    {
      success: result.success,
      revision: result.revision,
      fingerprint: result.builder.inputFingerprint,
      materialized: result.materialized,
    },
    { success: false, revision: 8, fingerprint, materialized: [] },
  );
  TestValidator.equals(
    "race diagnostic precedes the older source finding",
    result.diagnostics.map(({ code, category, phase, target, path }) => ({
      code,
      category,
      phase,
      target,
      path,
    })),
    [
      {
        code: "compile-input-changed",
        category: "error",
        phase: "compile",
        target: "builder-input",
        path: null,
      },
      {
        code: prior.code,
        category: prior.category,
        phase: prior.phase,
        target: prior.target,
        path: prior.path,
      },
    ],
  );
  TestValidator.predicate(
    "the correction carries the actual race cause",
    result.diagnostics[0]!.message.startsWith(failure.message),
  );
  TestValidator.predicate(
    "the caller's diagnostic channel is preserved",
    result.diagnostics === diagnostics && result.diagnostics[1] === prior,
  );
  const observation = new Error("The admitted root generation was replaced.");
  let caught: unknown;
  try {
    createAutoMovieBuildInputRaceFailure({
      diagnostics: [],
      inputFingerprint: fingerprint,
      failure,
      currentRevision: () => {
        throw observation;
      },
    });
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "failed current observation retains both exact causes",
    caught instanceof AggregateError &&
      caught.errors.length === 2 &&
      caught.errors[0] === failure &&
      caught.errors[1] === observation,
  );
};
