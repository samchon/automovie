import type { IAutoMovieBuildProjectOutput, IAutoMovieDiagnostic, IAutoMovieGeneratedManifest } from "@automovie/interface";
import { AutoMovieProductionInputRaceError, type AutoMovieProductionProject } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";

const { publishAutoMovieGeneratedCompilation } = loadSourceModule<{
  publishAutoMovieGeneratedCompilation(props: {
    authority: Pick<AutoMovieProductionProject, "commitGenerated" | "revision">;
    publication: {
      files: Parameters<AutoMovieProductionProject["commitGenerated"]>[0];
      manifest: IAutoMovieGeneratedManifest;
      inputCurrent: () => boolean;
      inputRevision: number;
    };
    inputFingerprint: IAutoMovieBuildProjectOutput["builder"]["inputFingerprint"];
    diagnostics: IAutoMovieDiagnostic[];
    materialized: IAutoMovieBuildProjectOutput["materialized"];
  }): IAutoMovieBuildProjectOutput;
}>(path.resolve(__dirname, "../../../../packages/production/src/production/publishAutoMovieGeneratedCompilation.ts"));

/**
 * Both production shapes settle their complete candidate through one authority.
 *
 * Scenarios:
 * 1. Success forwards exact bytes, manifest, guard and revision once, returning
 *    the committed revision and prepared result identities without rereading.
 * 2. An input race publishes no statuses and reports the current revision.
 * 3. An unrelated publication error propagates unchanged; a failed revision
 *    observation after a race preserves both exact failure objects.
 */
export const test_production_compilation_publication = (): void => {
  const inputFingerprint: IAutoMovieBuildProjectOutput["builder"]["inputFingerprint"] = "sha256:candidate";
  const files = new Map([["models/ship.json", Buffer.from("candidate")]]);
  const entry = {
    path: "models/ship.json", owner: "builder" as const,
    digest: `sha256:${createHash("sha256").update("candidate").digest("hex")}` as const,
    sourceTargets: ["asset:ship"],
  };
  const manifest: IAutoMovieGeneratedManifest = {
    version: 1, builder: { packageVersion: "unit", protocolVersion: "unit" },
    inputFingerprint, files: [entry],
  };
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const materialized: IAutoMovieBuildProjectOutput["materialized"] = [{ ...entry, status: "created" }];
  const inputCurrent = () => true;
  const publication = { files, manifest, inputCurrent, inputRevision: 4 };
  let committed = 0;
  let observations = 0;
  let failure: Error | undefined;
  const observation: { failure?: Error } = {};
  const authority = {
    commitGenerated: (...received: Parameters<AutoMovieProductionProject["commitGenerated"]>): number => {
      committed += 1;
      TestValidator.predicate("publication forwards all acquired identities", received[0] === files && received[1] === manifest && received[2] === inputCurrent);
      TestValidator.equals("publication forwards the acquired revision", received[3], 4);
      TestValidator.equals("the forwarded currentness guard remains callable", received[2]!(), true);
      if (failure !== undefined) throw failure;
      return 5;
    },
    revision: (): number => {
      observations += 1;
      if (observation.failure !== undefined) throw observation.failure;
      return 6;
    },
  };
  const props = { authority, publication, inputFingerprint, diagnostics, materialized };
  const success = publishAutoMovieGeneratedCompilation(props);
  TestValidator.equals("successful settlement returns the transaction result", { success: success.success, revision: success.revision, fingerprint: success.builder.inputFingerprint }, { success: true, revision: 5, fingerprint: inputFingerprint });
  TestValidator.predicate("successful settlement preserves result identities", success.diagnostics === diagnostics && success.materialized === materialized);
  TestValidator.equals("success never rereads revision", [committed, observations], [1, 0]);
  failure = new AutoMovieProductionInputRaceError("Source changed before publication.");
  const raced = publishAutoMovieGeneratedCompilation({ ...props, diagnostics: [] });
  TestValidator.equals("race returns a failure without materialized output", { success: raced.success, revision: raced.revision, files: raced.materialized, codes: raced.diagnostics.map((item) => item.code) }, { success: false, revision: 6, files: [], codes: ["compile-input-changed"] });
  const unrelated = new Error("The native transaction failed.");
  failure = unrelated;
  let caught: unknown;
  try { publishAutoMovieGeneratedCompilation(props); } catch (error) { caught = error; }
  TestValidator.predicate("unrelated failure propagates exact identity", caught === unrelated);
  TestValidator.equals("unrelated failure does not read revision", observations, 1);
  failure = new AutoMovieProductionInputRaceError("The candidate was superseded.");
  observation.failure = new Error("Root identity changed during observation.");
  try { publishAutoMovieGeneratedCompilation({ ...props, diagnostics: [] }); } catch (error) { caught = error; }
  TestValidator.predicate("secondary observation failure cannot erase the race", caught instanceof AggregateError && caught.errors[0] === failure && caught.errors[1] === observation.failure);
  TestValidator.equals("every attempted settlement uses one authority call", committed, 4);
};
