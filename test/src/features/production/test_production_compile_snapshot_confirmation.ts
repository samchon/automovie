import type {
  IAutoMovieBuildProjectOutput,
  IAutoMovieDiagnostic,
} from "@automovie/interface";
import { AutoMovieProductionInputRaceError } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

type SnapshotConfirmationModule = {
  confirmAutoMovieBuildInputSnapshot(props: {
    diagnostics: IAutoMovieDiagnostic[];
    inputCurrent: () => boolean;
    inputFingerprint: string;
    inputRevision: number;
    authority: {
      confirmCurrentSnapshot: (
        current: () => boolean,
        revision: number,
      ) => number;
      revision: () => number;
    };
  }): IAutoMovieBuildProjectOutput | null;
};
const { confirmAutoMovieBuildInputSnapshot }: SnapshotConfirmationModule = loadSourceModule<SnapshotConfirmationModule>(
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
 *
 * @evidence contracts/testing.md#behavioral-verification Confirms compilation through a supplied authority, asserting exact guard/revision forwarding, null success with no extra read, typed-race conversion at current revision and unrelated Error propagation without observation.
 * @evidence contracts/testing.md#independent-expectations The authority handoff contract supplies expected identities, base revision 7, current revision 8 and selective race classification; the authored callbacks do not prove real locking, filesystem currentness or atomicity.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts successful confirmation, dedicated input-race refusal and unrelated failure, asserting exact callback identity and revision-read counts; secondary race-observation failure belongs to the race formatter unit.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit reaches the production confirmation owner through the existing source loader with supplied callback capabilities and owns all assertions; it starts no native project or dynamic cases.
 */
export function test_production_compile_snapshot_confirmation(): void {
  const inputCurrent: () => boolean = (): boolean => true;
  const common: Omit<Parameters<SnapshotConfirmationModule["confirmAutoMovieBuildInputSnapshot"]>[0], "authority"> = {
    diagnostics: [] as IAutoMovieDiagnostic[],
    inputCurrent,
    inputFingerprint: `sha256:${"a".repeat(64)}` as string,
    inputRevision: 7,
  };
  let revisionReads: number = 0;
  let confirmed: boolean = false;
  const revision: () => number = (): number => {
    revisionReads += 1;
    return 8;
  };
  const successful: IAutoMovieBuildProjectOutput | null = confirmAutoMovieBuildInputSnapshot({
    ...common,
    authority: {
      confirmCurrentSnapshot: (current: () => boolean, expected: number): number => {
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
  const race: AutoMovieProductionInputRaceError = new AutoMovieProductionInputRaceError(
    "A concurrent source edit changed the input.",
  );
  const refused: IAutoMovieBuildProjectOutput | null = confirmAutoMovieBuildInputSnapshot({
    ...common,
    authority: {
      confirmCurrentSnapshot: (): number => {
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
  const unrelated: Error = new Error("The observation transport is unavailable.");
  let caught: unknown;
  try {
    confirmAutoMovieBuildInputSnapshot({
      ...common,
      authority: {
        confirmCurrentSnapshot: (): number => {
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
}
