import {
  ViolationCollector,
  compileCameraClearanceReports,
  evaluateCameraClearance,
  stageScene,
} from "@automovie/engine";
import {
  IAutoMovieCamera,
  IAutoMovieCameraClearanceFinding,
  IAutoMovieCameraClearanceReport,
  IAutoMovieConstraintViolation,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFilmClearanceStage } from "../internal/createFilmClearanceStage";
import { makeScriptWrite } from "../internal/filmFixtures";
import { createModel } from "../internal/fixtures";

/**
 * Camera clearance answers for its own work only, addresses a coverage take
 * whose camera is not staged, and orders findings the same on every host.
 *
 * Scenarios:
 *
 * 1. A collector that already holds another stage's violation still receives a
 *    clear report for a clear static take, and gains no item.
 * 2. A coverage take naming a camera the scene does not stage is an addressed
 *    violation at that take's camera, not a thrown `TypeError`.
 * 3. Two contacted obstacles whose ids differ in letter case are reported in
 *    UTF-16 code-unit order, which a locale collation reverses.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `compileCameraClearanceReports` and `evaluateCameraClearance` and asserts the returned reports, the collector items and the finding order, catching a compiler that reads foreign collector items as its own failure, one that dereferences an unstaged coverage camera, and an evaluator whose finding order follows the host locale; any addressed refusal at the coverage camera and any code-unit order pass.
 * @evidence contracts/testing.md#independent-expectations The clear verdict follows from the staged geometry, a 0.01 m camera sphere two metres from both knights; the refusal path is the take's own input address; the order is the definition of code-unit comparison, where `B` (U+0042) precedes `a` (U+0061) while English collation puts `a` first.
 * @evidence contracts/testing.md#distinguishing-cases Covers a non-empty foreign collector beside a clear take, an unstaged coverage camera beside a staged hero, and a case-differing id pair; contact, staleness, sampling and motion-bound refusals are owned by `test_film_camera_clearance`.
 * @evidence contracts/testing.md#execution-ownership A unit test of pure engine functions over in-memory fixtures, discovered by its `test_` export under `test/src/features/film`, with no host, consumer or native artifact involved.
 */
export function test_film_camera_clearance_boundaries(): void {
  const staged = stageScene(
    makeScriptWrite(),
    createFilmClearanceStage({
      body: { center: { x: 0, y: 0, z: 0 }, radius: 0.01 },
      parentRig: null,
    }),
  );
  if (staged.success !== true)
    throw new Error("clearance boundary fixture must stage");
  const hero: IAutoMovieCamera = staged.scene.cameras[0]!;
  const compile = (
    out: ViolationCollector,
    coverage: Parameters<
      typeof compileCameraClearanceReports
    >[0]["coverage"] = [],
  ): IAutoMovieCameraClearanceReport[] | undefined =>
    compileCameraClearanceReports({
      scene: staged.scene,
      hero: { camera: hero, motion: null },
      coverage,
      duration: 1,
      motions: {},
      objectMotions: [],
      models: [
        { ...createModel(), id: "stickman" },
        { ...createModel(), id: "knightB" },
      ],
      runtime: { revision: "r", currentRevision: "r", sampleRate: 4 },
      out,
    });

  const foreign: ViolationCollector = new ViolationCollector();
  foreign.push("type", "$input.elsewhere", "an earlier stage's refusal", null);
  const reports: IAutoMovieCameraClearanceReport[] | undefined =
    compile(foreign);
  TestValidator.equals(
    "a foreign violation does not suppress a clear report",
    [reports?.map(
      (report: IAutoMovieCameraClearanceReport): string => report.status,
    ), foreign.items.length],
    [["clear"], 1],
  );

  const ghost: ViolationCollector = new ViolationCollector();
  let thrown: boolean = false;
  try {
    compile(ghost, [
      { camera: "ghost-camera", cameraMotion: null, cameraIntent: [] },
    ]);
  } catch {
    thrown = true;
  }
  TestValidator.equals(
    "an unstaged coverage camera is addressed",
    [
      thrown,
      ghost.items.map(
        (item: IAutoMovieConstraintViolation): string => item.path,
      ),
    ],
    [false, ["$input.coverage[0].camera"]],
  );

  const identity: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const post: IAutoMovieSubjectBox = {
    min: { x: -1, y: -1, z: -1 },
    max: { x: 1, y: 1, z: 1 },
  };
  type ISample = Parameters<
    typeof evaluateCameraClearance
  >[0]["samples"][number];
  const ordered: IAutoMovieCameraClearanceReport = evaluateCameraClearance({
    camera: "camera-main",
    envelope: {
      body: { center: { x: 0, y: 0, z: 0 }, radius: 0.1 },
      parentRig: null,
    },
    revision: "r",
    currentRevision: "r",
    sampleRate: 1,
    duration: 1,
    samples: [0, 1].map(
      (time: number): ISample => ({
        time,
        camera: identity,
        obstacles: [
          { node: "a-post", bounds: post },
          { node: "B-post", bounds: post },
        ],
      }),
    ),
  });
  TestValidator.equals(
    "findings follow code-unit order",
    ordered.findings.map(
      (finding: IAutoMovieCameraClearanceFinding): string => finding.obstacle,
    ),
    ["B-post", "a-post"],
  );
}
