import {
  AutoMovieEngineViolationCollector,
  compileCameraClearanceReports,
  evaluateCameraClearance,
} from "@automovie/engine";
import {
  IAutoMovieCamera,
  IAutoMovieCameraClearanceEvaluation,
  IAutoMovieCameraClearanceFinding,
  IAutoMovieCameraClearanceReport,
  IAutoMovieConstraintViolation,
  IAutoMovieScene,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

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
 * 4. A zero-duration take has one fixed-clock instant. Nonfinite clock input
 *    reports its own field before sampling, including during a zero-duration take.
 */
export function test_engine_film_camera_clearance_boundaries(): void {
  const hero: IAutoMovieCamera = {
    id: "lens",
    transform: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    fovY: 40,
    near: 0.1,
    far: 100,
    depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 1 },
    clearance: {
      body: { center: { x: 0, y: 0, z: 0 }, radius: 0.01 },
      parentRig: null,
    },
  };
  const scene: IAutoMovieScene = {
    id: "studio",
    name: null,
    cameras: [hero],
    lights: [],
    nodes: [],
  };
  const compile = (
    out: IAutoMovieViolationCollector,
    coverage: Parameters<
      typeof compileCameraClearanceReports
    >[0]["coverage"] = [],
    duration: number = 1,
    sampleRate: number = 4,
  ): IAutoMovieCameraClearanceReport[] | undefined =>
    compileCameraClearanceReports({
      scene,
      hero: { camera: hero, motion: null },
      coverage,
      duration,
      motions: {},
      objectMotions: [],
      models: [],
      runtime: { revision: "r", currentRevision: "r", sampleRate },
      out,
    });

  const foreign: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  foreign.push("type", "$input.elsewhere", "an earlier stage's refusal", null);
  const reports: IAutoMovieCameraClearanceReport[] | undefined =
    compile(foreign);
  TestValidator.equals(
    "a foreign violation does not suppress a clear report",
    [
      reports?.map(
        (report: IAutoMovieCameraClearanceReport): string => report.status,
      ),
      foreign.items.length,
    ],
    [["clear"], 1],
  );

  const ghost: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
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
  const instant: IAutoMovieCameraClearanceReport | undefined = compile(
    new AutoMovieEngineViolationCollector(),
    [],
    0,
  )?.[0];
  const badRate: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  TestValidator.predicate(
    "a valid single instant is preserved and an infinite rate is addressed",
    instant?.status === "clear" &&
      instant.intervals === 0 &&
      instant.sampleTimes.length === 1 &&
      nclose(instant.sampleTimes[0]!, 0, 0) &&
      compile(badRate, [], 0, Infinity) === undefined &&
      badRate.items.length === 1 &&
      badRate.items[0]?.path === "$input.cameraClearance.sampleRate",
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
  const evaluation: IAutoMovieCameraClearanceEvaluation = {
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
  };
  const ordered: IAutoMovieCameraClearanceReport =
    evaluateCameraClearance(evaluation);
  TestValidator.equals(
    "findings follow code-unit order",
    ordered.findings.map(
      (finding: IAutoMovieCameraClearanceFinding): string => finding.obstacle,
    ),
    ["B-post", "a-post"],
  );
  TestValidator.predicate(
    "the evaluator refuses nonfinite duration and rate on their own fields",
    throwsError(
      () => evaluateCameraClearance({ ...evaluation, duration: Infinity }),
      "$input.duration",
    ) &&
      throwsError(
        () =>
          evaluateCameraClearance({
            ...evaluation,
            duration: 0,
            sampleRate: Infinity,
            samples: [evaluation.samples[0]!],
          }),
        "$input.sampleRate",
      ),
  );
}
