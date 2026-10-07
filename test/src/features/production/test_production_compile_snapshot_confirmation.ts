import type {
  AutoMovieContentDigest,
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";
import { AutoMovieProductionInputRaceError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const { confirmAutoMovieBuildInputSnapshot } = loadSourceModule<{
  confirmAutoMovieBuildInputSnapshot(props: {
    diagnostics: IAutoMovieDiagnostic[];
    inputCurrent: () => boolean;
    inputFingerprint: AutoMovieContentDigest;
    inputRevision: number;
    authority: {
      confirmCurrentSnapshot: (
        current: () => boolean,
        revision: number,
      ) => number;
      revision: () => number;
    };
  }): IAutoMovieBuildProjectOutput | null;
}>(
  path.resolve(
    __dirname,
    "../../../../packages/production/src/production/confirmAutoMovieBuildInputSnapshot.ts",
  ),
);

/**
 * Read-only compilation confirmation shares the publication authority's fence.
 *
 * Scenarios:
 * 1. Successful authority confirmation receives the exact guard and revision,
 *    returns no failure, and needs no additional revision observation.
 * 2. A generation-race refusal becomes a structured failure at current revision.
 * 3. An unrelated authority failure propagates unchanged without reading state.
 */
export const test_production_compile_snapshot_confirmation = (): void => {
  const inputCurrent = (): boolean => true;
  const common = {
    diagnostics: [] as IAutoMovieDiagnostic[],
    inputCurrent,
    inputFingerprint: `sha256:${"a".repeat(64)}` as AutoMovieContentDigest,
    inputRevision: 7,
  };
  let revisionReads = 0;
  let confirmed = false;
  const revision = (): number => {
    revisionReads += 1;
    return 8;
  };
  const successful = confirmAutoMovieBuildInputSnapshot({
    ...common,
    authority: {
      confirmCurrentSnapshot: (current, expected) => {
        confirmed = current === inputCurrent && expected === 7 && current();
        return expected;
      },
      revision,
    },
  });
  TestValidator.equals(
    "successful confirmation forwards the exact fence",
    { successful, confirmed, revisionReads },
    { successful: null, confirmed: true, revisionReads: 0 },
  );
  const race = new AutoMovieProductionInputRaceError(
    "A concurrent source edit changed the input.",
  );
  const refused = confirmAutoMovieBuildInputSnapshot({
    ...common,
    authority: {
      confirmCurrentSnapshot: () => {
        throw race;
      },
      revision,
    },
  });
  TestValidator.equals(
    "race confirmation returns one structured current failure",
    {
      success: refused!.success,
      revision: refused!.revision,
      code: refused!.diagnostics[0]!.code,
      revisionReads,
    },
    {
      success: false,
      revision: 8,
      code: "compile-input-changed",
      revisionReads: 1,
    },
  );
  const unrelated = new Error("The observation transport is unavailable.");
  let caught: unknown;
  try {
    confirmAutoMovieBuildInputSnapshot({
      ...common,
      authority: {
        confirmCurrentSnapshot: () => {
          throw unrelated;
        },
        revision,
      },
    });
  } catch (error) {
    caught = error;
  }
  TestValidator.predicate(
    "unrelated authority failure preserves its exact cause",
    caught === unrelated,
  );
  TestValidator.equals(
    "unrelated failure never rereads project state",
    revisionReads,
    1,
  );
};
