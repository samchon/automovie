import {
  ViolationCollector,
  compileCameraClearanceReports,
  compileDefinedShot,
  defineShot,
  evaluateCameraClearance,
  performShot,
  stageScene,
} from "@automovie/engine";
import {
  IAutoMovieCamera,
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieCameraClearanceReport,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMovieSceneNode,
  IAutoMovieShotProgram,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceAdapterOverrides } from "../internal/IFilmCameraClearanceAdapterOverrides";
import type { IFilmCameraClearanceAdapterResult } from "../internal/IFilmCameraClearanceAdapterResult";
import type { IFilmCameraClearanceBox } from "../internal/IFilmCameraClearanceBox";
import type { IFilmCameraClearanceEvaluationOverrides } from "../internal/IFilmCameraClearanceEvaluationOverrides";
import type { IFilmCameraClearanceSample } from "../internal/IFilmCameraClearanceSample";
import { assertFilmCameraClearanceArtifacts } from "../internal/assertFilmCameraClearanceArtifacts";
import { assertFilmCameraClearanceDeformation } from "../internal/assertFilmCameraClearanceDeformation";
import { assertFilmCameraClearanceEvaluation } from "../internal/assertFilmCameraClearanceEvaluation";
import { assertFilmCameraClearanceStage } from "../internal/assertFilmCameraClearanceStage";
import { createFilmClearanceStage as stageWithClearance } from "../internal/createFilmClearanceStage";
import {
  makeBlockingWrite,
  makePerformanceWrite,
  makeScriptWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createModel, createSkeleton } from "../internal/fixtures";
import { throwsError as throws } from "../internal/throwsError";

const identity: (x?: number, y?: number, z?: number) => IAutoMovieTransform = (
  x: number = 0,
  y: number = 0,
  z: number = 0,
): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const box: (
  center: IAutoMovieVector3,
  half?: number,
) => IFilmCameraClearanceBox = (
  center: IAutoMovieVector3,
  half: number = 0.1,
): IFilmCameraClearanceBox => ({
  min: { x: center.x - half, y: center.y - half, z: center.z - half },
  max: { x: center.x + half, y: center.y + half, z: center.z + half },
});

const envelope: (
  body?: IAutoMovieCameraClearanceEnvelope["body"],
  parentRig?: IAutoMovieCameraClearanceEnvelope["parentRig"],
) => IAutoMovieCameraClearanceEnvelope = (
  body: IAutoMovieCameraClearanceEnvelope["body"] = {
    center: { x: 0, y: 0, z: 0 },
    radius: 0.1,
  },
  parentRig: IAutoMovieCameraClearanceEnvelope["parentRig"] = null,
): IAutoMovieCameraClearanceEnvelope => ({ body, parentRig });

const evaluate: (
  over?: IFilmCameraClearanceEvaluationOverrides,
) => ReturnType<typeof evaluateCameraClearance> = (
  over: IFilmCameraClearanceEvaluationOverrides = {},
): ReturnType<typeof evaluateCameraClearance> =>
  evaluateCameraClearance({
    camera: "camera-main",
    envelope: over.envelope ?? envelope(),
    revision: over.revision ?? "revision-7",
    currentRevision: over.currentRevision ?? "revision-7",
    sampleRate: over.sampleRate ?? 1,
    duration: over.duration ?? 1,
    samples:
      over.samples ??
      [0, 1].map(
        (time: number): IFilmCameraClearanceSample => ({
          time,
          camera: identity(),
          obstacles: [{ node: "wall", bounds: box({ x: 5, y: 0, z: 0 }) }],
        }),
      ),
  });

const runtimeModels: () => IAutoMovieModel[] = (): IAutoMovieModel[] => [
  { ...createModel(), id: "stickman" },
  { ...createModel(), id: "knightB" },
];

/**
 * Camera body and parent-rig clearance use sampled interval bounds and a
 * current-revision gate over the represented portable geometry.
 *
 * Scenarios:
 *
 * 1. Exact sphere/box boundary contact blocks a static camera.
 * 2. Clear endpoints do not hide a midpoint wall penetration, including an
 *    authored camera key that does not land on the base fixed clock.
 * 3. A parent rig can collide while the camera body remains clear.
 * 4. A moving subject crossing a fixed camera is compared at the same samples.
 * 5. Rotation of an offset envelope carries the conservative arc, not merely
 *    its endpoint chord.
 * 6. A current clear result is publishable while a stale revision is not.
 * 7. Malformed clocks, boxes, duplicate obstacles, and changing identity sets
 *    are refused at the evaluator boundary.
 * 8. Stage validation rejects malformed nested envelopes and copies the
 *    valid body's centre against later mutation of the author object.
 * 9. Performance preserves a clear report, while builder-visible body contact
 *    and a stale geometry snapshot return addressed refusal.
 * 10. A zero-duration public evaluation still detects contact at its single
 *     fixed-clock instant.
 * 11. Artifact validation requires exactly one clear report per declared take,
 *     an exact carried sample plan, and retention of every base-clock instant.
 * 12. An evaluator throw remains addressed even when the thrown value refuses
 *     diagnostic string coercion.
 * 13. Overshooting interpolation and open loop seams are refused rather than
 *     trusted as endpoint-bounded motion.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the numerical evaluator, staging, performShot, clearance adapter, artifact validators, and compileDefinedShot through the four existing assertion helpers and the local integration cases, checking collision/refusal paths and retained reports.
 * @evidence contracts/testing.md#independent-expectations Authored contact, crossing, parent-rig, offset-rotation, and separated boxes determine fixed clear/blocked expectations. Explicit violation fragments/paths and mutated artifact members independently anchor admission; no result from the evaluator serves as its own collision oracle.
 * @evidence contracts/testing.md#distinguishing-cases Boundary contact, midpoint and off-clock crossings, clear skew motion, body versus rig contact, stale-before-geometry authority, invalid clocks/identities, malformed envelopes, unsupported interpolation, deformation reach, and hostile diagnostic coercion distinguish geometric, structural, and runtime failures.
 * @evidence contracts/testing.md#execution-ownership Uses local scene/model/motion records, caller-owned malformed proxies, and existing skeleton/synthesizer callbacks through product seams without global replacement, filesystem, clocks, or rendering. Numerical conservative-bound checks and artifact admission do not establish actual external asset or rendered clearance, nor universal continuous-motion correctness.
 */
export function test_film_camera_clearance(): void {
  assertFilmCameraClearanceEvaluation({
    identity,
    box,
    envelope,
    evaluate,
    throws,
  });

  assertFilmCameraClearanceStage({ envelope, stageWithClearance });

  const clearStage: ReturnType<typeof stageScene> = stageScene(
    makeScriptWrite(),
    stageWithClearance(
      envelope({ center: { x: 0, y: 0, z: 0 }, radius: 0.01 }),
    ),
  );
  if (clearStage.success !== true)
    throw new Error("clearance performance fixture must stage");
  const performanceProps: Parameters<typeof performShot>[0] = {
    script: makeScriptWrite(),
    staged: clearStage,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
    models: runtimeModels(),
  };
  const performed: ReturnType<typeof performShot> = performShot({
    ...performanceProps,
    cameraClearance: {
      revision: "current",
      currentRevision: "current",
      sampleRate: 24,
    },
  });
  TestValidator.predicate(
    "current clear performance preserves its report",
    performed.success === true &&
      performed.shot.cameraClearance?.[0]?.status === "clear" &&
      performed.shot.cameraClearance[0].intervals >= 48 &&
      performed.shot.cameraClearance[0].sampleTimes.length ===
        performed.shot.cameraClearance[0].intervals + 1,
  );
  if (performed.success !== true)
    throw new Error("clearance performance fixture must perform");

  assertFilmCameraClearanceArtifacts({ performed, clearStage });

  const heroCamera: IAutoMovieCamera = clearStage.scene.cameras.find(
    (camera: IAutoMovieCamera): boolean => camera.id === performed.shot.camera,
  )!;
  const baseAdapterProps: Omit<
    Parameters<typeof compileCameraClearanceReports>[0],
    "out" | "runtime"
  > & {
    runtime: NonNullable<
      Parameters<typeof compileCameraClearanceReports>[0]["runtime"]
    >;
  } = {
    scene: clearStage.scene,
    hero: { camera: heroCamera, motion: performed.shot.cameraMotion },
    coverage: performed.shot.coverage ?? [],
    duration: performed.shot.duration,
    motions: performed.motions,
    objectMotions: performed.shot.objectMotions,
    models: runtimeModels(),
    runtime: {
      revision: "current",
      currentRevision: "current",
      sampleRate: 24,
    },
  };
  const inspectAdapter: (
    over?: IFilmCameraClearanceAdapterOverrides,
  ) => IFilmCameraClearanceAdapterResult = (
    over: IFilmCameraClearanceAdapterOverrides = {},
  ): IFilmCameraClearanceAdapterResult => {
    const out: ViolationCollector = new ViolationCollector();
    const reports: ReturnType<typeof compileCameraClearanceReports> =
      compileCameraClearanceReports({
        ...baseAdapterProps,
        ...over,
        out,
      });
    return { reports, out };
  };

  const plainCamera: IAutoMovieCamera = { ...heroCamera, clearance: undefined };
  const plain: IFilmCameraClearanceAdapterResult = inspectAdapter({
    scene: { ...clearStage.scene, cameras: [plainCamera] },
    hero: { camera: plainCamera, motion: performed.shot.cameraMotion },
    runtime: undefined,
  });
  const noRuntime: IFilmCameraClearanceAdapterResult = inspectAdapter({
    runtime: undefined,
  });
  TestValidator.equals(
    "legacy camera and missing builder authority remain distinct",
    [
      [plain.reports, plain.out.items.length],
      [noRuntime.reports, noRuntime.out.items[0]?.path],
    ],
    [
      [undefined, 0],
      [undefined, "$input.cameraClearance"],
    ],
  );

  const missingGeometry: IFilmCameraClearanceAdapterResult = inspectAdapter({
    models: [],
  });
  const emptyGeometry: IFilmCameraClearanceAdapterResult = inspectAdapter({
    models: runtimeModels().map(
      (model: IAutoMovieModel): IAutoMovieModel => ({ ...model, parts: [] }),
    ),
  });
  TestValidator.predicate(
    "absent and empty obstacle geometry are addressed rather than skipped",
    [missingGeometry, emptyGeometry].every(
      ({ reports, out }: IFilmCameraClearanceAdapterResult): boolean =>
        reports === undefined &&
        out.items.length === clearStage.scene.nodes.length &&
        out.items.every((item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".model"),
        ),
    ),
  );

  const propModel: IAutoMovieModel = { ...createModel(null), id: "prop" };
  const sourceNode: IAutoMovieSceneNode = clearStage.scene.nodes[0]!;
  const staticNode: IAutoMovieSceneNode = {
    ...sourceNode,
    id: "static-prop",
    model: "prop",
    transform: identity(20, 20, 20),
  };
  const movingNode: IAutoMovieSceneNode = {
    ...sourceNode,
    id: "moving-prop",
    model: "prop",
    transform: identity(30, 30, 30),
  };
  const alternateCamera: IAutoMovieCamera = { ...heroCamera, id: "cam-alt" };
  const animated: IFilmCameraClearanceAdapterResult = inspectAdapter({
    scene: {
      ...clearStage.scene,
      nodes: [...clearStage.scene.nodes, staticNode, movingNode],
      cameras: [...clearStage.scene.cameras, alternateCamera],
    },
    coverage: [{ camera: "cam-alt", cameraMotion: null, cameraIntent: [] }],
    models: [...runtimeModels(), propModel],
    objectMotions: [
      {
        id: "moving-prop-transform",
        name: null,
        duration: 2,
        loop: false,
        tracks: [
          {
            channel: {
              kind: "node",
              node: "moving-prop",
              path: "translation",
            },
            times: [0, 2],
            values: [30, 30, 30, 31, 31, 31],
            interpolation: "linear",
          },
          {
            channel: {
              kind: "node",
              node: "moving-prop",
              path: "rotation",
            },
            times: [0, 2],
            values: [0, 0, 0, 1, 0, 0, 1, 0],
            interpolation: "linear",
          },
          {
            channel: {
              kind: "node",
              node: "moving-prop",
              path: "scale",
            },
            times: [0, 2],
            values: [1, 1, 1, 2, 2, 2],
            interpolation: "linear",
          },
        ],
      },
    ],
  });
  TestValidator.predicate(
    "static and moving obstacles share the clock across hero and coverage takes",
    animated.out.items.length === 0 &&
      animated.reports?.length === 2 &&
      animated.reports.every(
        (report: IAutoMovieCameraClearanceReport): boolean =>
          report.status === "clear",
      ),
  );

  const contact: IAutoMovieVector3 = staticNode.transform.translation;
  const offClockCameraMotion: IAutoMovieClip = {
    id: "off-clock-camera-contact",
    name: null,
    duration: 2,
    loop: true,
    tracks: [
      {
        channel: {
          kind: "node" as const,
          node: heroCamera.id,
          path: "translation" as const,
        },
        times: [0, 1 / 48, 1 / 24, 2],
        values: [
          contact.x + 100,
          contact.y,
          contact.z,
          contact.x,
          contact.y,
          contact.z,
          contact.x + 100,
          contact.y,
          contact.z,
          contact.x + 100,
          contact.y,
          contact.z,
        ],
        interpolation: "linear" as const,
      },
      {
        channel: {
          kind: "node" as const,
          node: heroCamera.id,
          path: "rotation" as const,
        },
        times: [0, 2],
        values: [0, 0, 0, 1, 0, 0, 0, -1],
        interpolation: "linear" as const,
      },
    ],
  };
  const offClockContact: IFilmCameraClearanceAdapterResult = inspectAdapter({
    scene: {
      ...clearStage.scene,
      nodes: [...clearStage.scene.nodes, staticNode],
    },
    hero: { camera: heroCamera, motion: offClockCameraMotion },
    motions: {},
    objectMotions: [],
    models: [...runtimeModels(), propModel],
  });
  TestValidator.predicate(
    "an unaligned camera key refines the builder clock before interval sweep",
    offClockContact.reports === undefined &&
      offClockContact.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".clearance.body") &&
          item.expected.includes('obstacle "static-prop"'),
      ),
  );
  const hostileCoercionMotion: IAutoMovieClip =
    assertFilmCameraClearanceDeformation({
      performed,
      clearStage,
      heroCamera,
      sourceNode,
      movingNode,
      propModel,
      inspectAdapter,
      runtimeModels,
      identity,
      offClockCameraMotion,
      runtime: baseAdapterProps.runtime,
    });

  const rigCamera: IAutoMovieCamera = {
    ...heroCamera,
    clearance: envelope(
      { center: { x: 0, y: 100, z: 0 }, radius: 0.01 },
      { center: { x: 0, y: 0, z: 0 }, radius: 3 },
    ),
  };
  const rigBlocked: IFilmCameraClearanceAdapterResult = inspectAdapter({
    scene: { ...clearStage.scene, cameras: [rigCamera] },
    hero: { camera: rigCamera, motion: performed.shot.cameraMotion },
  });
  TestValidator.predicate(
    "performance addresses a parent-rig contact at its own member",
    rigBlocked.reports === undefined &&
      rigBlocked.out.items.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path.endsWith(".clearance.parentRig") &&
          item.expected.includes("parent-rig"),
      ),
  );

  const staleBeforeGeometry: IFilmCameraClearanceAdapterResult = inspectAdapter(
    {
      models: [],
      hero: { camera: heroCamera, motion: hostileCoercionMotion },
      runtime: {
        revision: "old",
        currentRevision: "current",
        sampleRate: 24,
      },
    },
  );
  TestValidator.predicate(
    "stale revision is addressed before geometry or motion is read",
    staleBeforeGeometry.reports === undefined &&
      staleBeforeGeometry.out.items.length === 1 &&
      staleBeforeGeometry.out.items[0]?.path ===
        "$input.cameraClearance.currentRevision",
  );

  const stalePerformance: ReturnType<typeof performShot> = performShot({
    ...performanceProps,
    cameraClearance: {
      revision: "old",
      currentRevision: "current",
      sampleRate: 24,
    },
  });
  TestValidator.predicate(
    "stale performance is addressed",
    stalePerformance.success === false &&
      stalePerformance.violations.some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$input.cameraClearance.currentRevision",
      ),
  );

  const blockedProgram: () => IAutoMovieShotProgram =
    (): IAutoMovieShotProgram => {
      const blocking: ReturnType<typeof makeBlockingWrite> =
        makeBlockingWrite();
      const performance: ReturnType<typeof makePerformanceWrite> =
        makePerformanceWrite();
      blocking.camera.framing = "full";
      for (const action of performance.draft)
        if (action.verb === "frame") action.framing = "full";
      return {
        actors: [
          { node: "knightA", model: "knightA", speed: 1, eyeHeight: 1.6 },
          { node: "knightB", model: "knightB", speed: 1, eyeHeight: 1.6 },
        ],
        script: makeScriptWrite(),
        stage: stageWithClearance(
          envelope({ center: { x: 0, y: 0, z: 0 }, radius: 3 }),
        ),
        blocking,
        performance,
        eventSamples: [],
      };
    };
  const blocked: ReturnType<typeof compileDefinedShot> = compileDefinedShot({
    shot: defineShot("clearance-blocked", {
      scene: "scene-duel",
      contract: {
        beat: "beat-1",
        durationSeconds: 2,
        participants: [
          { kind: "actor", id: "knightA" },
          { kind: "actor", id: "knightB" },
        ],
        opening: [],
        closing: [],
        camera: {
          intent: "Keep the duel readable without crossing the actors.",
          requiredSubjects: ["knightA", "knightB"],
          maxOcclusionRatio: 0.2,
        },
        events: [],
        reviewFrames: [],
      },
      build: blockedProgram,
    }),
    context: undefined,
    runtime: {
      synthesize: validSynthesizer,
      skeleton: (): IAutoMovieSkeleton => createSkeleton(),
      frameFormat: { width: 1920, height: 1080 },
      models: runtimeModels(),
      cameraClearance: {
        revision: "current",
        currentRevision: "current",
        sampleRate: 24,
      },
    },
  });
  TestValidator.predicate(
    "builder returns an addressed camera-body refusal",
    blocked.success === false &&
      blocked.diagnostics.some(
        (
          item: Extract<
            ReturnType<typeof compileDefinedShot>,
            { success: false }
          >["diagnostics"][number],
        ): boolean =>
          item.phase === "performance" &&
          item.path.includes(".clearance.body") &&
          item.fact.includes("contacts obstacle"),
      ),
  );
}
