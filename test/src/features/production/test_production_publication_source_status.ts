import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import type {
  IAutoMovieBuildProjectOutput,
  IAutoMovieGeneratedManifest,
} from "@automovie/interface";
import type { IAutoMovieProductionDesignGraph } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

import { loadSourceModule } from "../internal/loadSourceModule";
import { throwsError } from "../internal/predicates";
import { SOURCE_FAILURE } from "./sourceStatus/SOURCE_FAILURE";
import { createSourceStatusWorld } from "./sourceStatus/createSourceStatusWorld";
import { fingerprintOf } from "./sourceStatus/fingerprintOf";
import { productionModule } from "./sourceStatus/productionModule";
import { textDigest } from "./sourceStatus/textDigest";

const { productionPublicationInputFingerprint }: {
  productionPublicationInputFingerprint(
    project: object,
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
    sourceStatus?: () => IAutoMovieBuildProjectOutput,
  ): string;
} = loadSourceModule<{
  productionPublicationInputFingerprint(
    project: object,
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
    sourceStatus?: () => IAutoMovieBuildProjectOutput,
  ): string;
}>(productionModule("productionPublicationSnapshot.ts"));

const GRAPH: IAutoMovieProductionDesignGraph = {
  production: null,
  models: new Map(),
  world: null,
  formations: new Map(),
  shots: new Map(),
  acceptance: new Map(),
};

/**
 * Existing synthetic project projection whose state follows one in-memory world.
 *
 * This projection is not an AutoMovieProductionProject. The erased loader
 * signature currently hides that mismatch; concrete project-owner integration
 * remains required before this unit establishes the product boundary.
 */
function projectOf(world: ReturnType<typeof createSourceStatusWorld>): {
  revision: () => number;
  projectStateRecords: () => { incarnation: Buffer };
  manifest: () => { projectId: string; formatVersion: number };
  graph: () => IAutoMovieProductionDesignGraph;
  generatedManifest: () => IAutoMovieGeneratedManifest;
  readGeneratedFile: () => Buffer;
} {
  return {
  revision: (): number => world.state.revision,
  projectStateRecords: (): { incarnation: Buffer } => ({
    incarnation: Buffer.from("harbor incarnation 1", "utf8"),
  }),
  manifest: (): { projectId: string; formatVersion: number } => ({ projectId: "harbor", formatVersion: 2 }),
  graph: (): IAutoMovieProductionDesignGraph => GRAPH,
  generatedManifest: (): IAutoMovieGeneratedManifest => ({
    version: 1,
    builder: { packageVersion: "0.1.0", protocolVersion: "unit" },
    inputFingerprint: fingerprintOf(world.state.compiled),
    files: [
      {
        path: "shots/opening.json",
        owner: "builder",
        digest: textDigest(world.state.generated),
        sourceTargets: ["shot:opening"],
      },
    ],
  }),
  readGeneratedFile: (): Buffer => Buffer.from(world.state.generated, "utf8"),
  };
}

/**
 * Repeated publication utility calls share one retained gate answer in the existing logical arrangement.
 *
 * Three sequential utility calls model a snapshot and two later checks without
 * acquiring a commit lock. Each fingerprint includes the supplied retained
 * source status. The existing synthetic project and erased loader signature
 * still owe concrete project-owner integration; no maintained production commit
 * currently consumes this utility.
 *
 * Scenarios:
 *
 * 1. A modeled snapshot and two later checks of unchanged logical state give one
 *    fingerprint and run the gate once.
 * 2. A compiled source edit between the snapshot and a check runs the gate once
 *    more and moves the fingerprint.
 * 3. An invalid current source refuses the fingerprint with its diagnostic.
 * 4. Without a retained status, a failing live authoring reader propagates its
 *    error before any builder runs.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the actual fingerprint utility and source-status retention owner through the existing logical arrangement, observing fingerprint equality/change, evaluation counts and source/live-reader refusals. The pseudo-project passed through an erased signature prevents claiming concrete project or terminal publication admission.
 * @evidence contracts/testing.md#independent-expectations Literal one/two evaluation counts and changed source strings define reuse/freshness expectations; the arrangement's synthetic digest and compile operations are not independent native compiler or physical-file observations.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts repeated unchanged calls, a logical compiled edit, invalid current source and failing live reader. There is no lock acquisition, physical namespace race, real generated-file publication or current production commit caller in this unit.
 * @evidence contracts/testing.md#execution-ownership The named entry owns the existing world, retained status and sequential callbacks in process; it opens no file, native codec, browser or GPU. Its hand-written project substitute and erased loader type remain unresolved ownership violations, reported for integration rather than hidden by a new seam or deleted case.
 */
export function test_production_publication_source_status(): void {
  const world: ReturnType<typeof createSourceStatusWorld> = createSourceStatusWorld();
  const status: () => IAutoMovieBuildProjectOutput = world.status();
  const project: ReturnType<typeof projectOf> = projectOf(world);
  const fingerprint: () => string = (): string =>
    productionPublicationInputFingerprint(project, undefined, status);
  const snapshot: string = fingerprint();
  const runsAtSnapshot: number = world.counts.evaluations;
  const checks: string[] = [fingerprint(), fingerprint()];
  TestValidator.equals(
    "an unchanged publication takes one gate run for all three checks",
    { runsAtSnapshot, checks, runsAfterChecks: world.counts.evaluations },
    { runsAtSnapshot: 1, checks: [snapshot, snapshot], runsAfterChecks: 1 },
  );

  world.state.source = "export const opening = defineShot({ beats: 5 });\n";
  world.compile();
  const moved: string = fingerprint();
  TestValidator.equals(
    "a compiled source edit moves the fingerprint through one new run",
    { moved: moved !== snapshot, runs: world.counts.evaluations },
    { moved: true, runs: 2 },
  );

  world.state.source = "export const opening = defineShot(undefined);\n";
  world.state.valid = false;
  TestValidator.equals(
    "an invalid current source refuses with its diagnostic",
    throwsError(fingerprint, [
      "requires a successful current source compile",
      SOURCE_FAILURE.message,
    ]),
    true,
  );

  TestValidator.equals(
    "a failing live reader propagates before any builder runs",
    throwsError(
      (): string =>
        productionPublicationInputFingerprint(project, (): never => {
          throw new Error("evidence graph unavailable");
        }),
      "evidence graph unavailable",
    ),
    true,
  );
}
