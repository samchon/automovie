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
  IAutoMovieCameraClearanceEnvelope,
  IAutoMovieShotProgram,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IFilmCameraClearanceAdapterOverrides } from "../internal/IFilmCameraClearanceAdapterOverrides";
import type { IFilmCameraClearanceAdapterResult } from "../internal/IFilmCameraClearanceAdapterResult";
import type { IFilmCameraClearanceEvaluationOverrides } from "../internal/IFilmCameraClearanceEvaluationOverrides";
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

const identity = (x = 0, y = 0, z = 0): IAutoMovieTransform => ({
  translation: { x, y, z },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});

const box = (center: IAutoMovieVector3, half = 0.1) => ({
  min: { x: center.x - half, y: center.y - half, z: center.z - half },
  max: { x: center.x + half, y: center.y + half, z: center.z + half },
});

const envelope = (
  body: IAutoMovieCameraClearanceEnvelope["body"] = {
    center: { x: 0, y: 0, z: 0 },
    radius: 0.1,
  },
  parentRig: IAutoMovieCameraClearanceEnvelope["parentRig"] = null,
): IAutoMovieCameraClearanceEnvelope => ({ body, parentRig });

const evaluate = (over: IFilmCameraClearanceEvaluationOverrides = {}) =>
  evaluateCameraClearance({
    camera: "camera-main",
    envelope: over.envelope ?? envelope(),
    revision: over.revision ?? "revision-7",
    currentRevision: over.currentRevision ?? "revision-7",
    sampleRate: over.sampleRate ?? 1,
    duration: over.duration ?? 1,
    samples:
      over.samples ??
      [0, 1].map((time) => ({
        time,
        camera: identity(),
        obstacles: [{ node: "wall", bounds: box({ x: 5, y: 0, z: 0 }) }],
      })),
  });

const throws = (closure: () => unknown, text: string): boolean => {
  try {
    closure();
    return false;
  } catch (error) {
    return error instanceof Error && error.message.includes(text);
  }
};

const runtimeModels = () => [
  { ...createModel(), id: "stickman" },
  { ...createModel(), id: "knightB" },
];

/**
 * Camera body and parent-rig clearance are continuous, current-revision gates.
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
 * 8. Stage validation rejects malformed nested envelopes and deep-lowers a
 *    valid envelope without retaining author-object aliases.
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
 */
export const test_film_camera_clearance = (): void => {
  assertFilmCameraClearanceEvaluation({
    identity,
    box,
    envelope,
    evaluate,
    throws,
  });

  assertFilmCameraClearanceStage({ envelope, stageWithClearance });

  const clearStage = stageScene(
    makeScriptWrite(),
    stageWithClearance(
      envelope({ center: { x: 0, y: 0, z: 0 }, radius: 0.01 }),
    ),
  );
  if (clearStage.success !== true)
    throw new Error("clearance performance fixture must stage");
  const performanceProps = {
    script: makeScriptWrite(),
    staged: clearStage,
    performance: makePerformanceWrite(),
    synthesize: validSynthesizer,
    skeleton: () => createSkeleton(),
    models: runtimeModels(),
  };
  const performed = performShot({
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

  const heroCamera = clearStage.scene.cameras.find(
    (camera) => camera.id === performed.shot.camera,
  )!;
  const baseAdapterProps = {
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
  const inspectAdapter = (
    over: IFilmCameraClearanceAdapterOverrides = {},
  ): IFilmCameraClearanceAdapterResult => {
    const out = new ViolationCollector();
    const reports = compileCameraClearanceReports({
      ...baseAdapterProps,
      ...over,
      out,
    });
    return { reports, out };
  };

  const plainCamera = { ...heroCamera, clearance: undefined };
  const plain = inspectAdapter({
    scene: { ...clearStage.scene, cameras: [plainCamera] },
    hero: { camera: plainCamera, motion: performed.shot.cameraMotion },
    runtime: undefined,
  });
  const noRuntime = inspectAdapter({ runtime: undefined });
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

  const missingGeometry = inspectAdapter({ models: [] });
  const emptyGeometry = inspectAdapter({
    models: runtimeModels().map((model) => ({ ...model, parts: [] })),
  });
  TestValidator.predicate(
    "absent and empty obstacle geometry are addressed rather than skipped",
    [missingGeometry, emptyGeometry].every(
      ({ reports, out }) =>
        reports === undefined &&
        out.items.length === clearStage.scene.nodes.length &&
        out.items.every((item) => item.path.endsWith(".model")),
    ),
  );

  const propModel = { ...createModel(null), id: "prop" };
  const sourceNode = clearStage.scene.nodes[0]!;
  const staticNode = {
    ...sourceNode,
    id: "static-prop",
    model: "prop",
    transform: identity(20, 20, 20),
  };
  const movingNode = {
    ...sourceNode,
    id: "moving-prop",
    model: "prop",
    transform: identity(30, 30, 30),
  };
  const alternateCamera = { ...heroCamera, id: "cam-alt" };
  const animated = inspectAdapter({
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
      animated.reports.every((report) => report.status === "clear"),
  );

  const contact = staticNode.transform.translation;
  const offClockCameraMotion = {
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
  const offClockContact = inspectAdapter({
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
        (item) =>
          item.path.endsWith(".clearance.body") &&
          item.expected.includes('obstacle "static-prop"'),
      ),
  );
  const hostileCoercionMotion = assertFilmCameraClearanceDeformation({
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

  const rigCamera = {
    ...heroCamera,
    clearance: envelope(
      { center: { x: 0, y: 100, z: 0 }, radius: 0.01 },
      { center: { x: 0, y: 0, z: 0 }, radius: 3 },
    ),
  };
  const rigBlocked = inspectAdapter({
    scene: { ...clearStage.scene, cameras: [rigCamera] },
    hero: { camera: rigCamera, motion: performed.shot.cameraMotion },
  });
  TestValidator.predicate(
    "performance addresses a parent-rig contact at its own member",
    rigBlocked.reports === undefined &&
      rigBlocked.out.items.some(
        (item) =>
          item.path.endsWith(".clearance.parentRig") &&
          item.expected.includes("parent-rig"),
      ),
  );

  const staleBeforeGeometry = inspectAdapter({
    models: [],
    hero: { camera: heroCamera, motion: hostileCoercionMotion },
    runtime: {
      revision: "old",
      currentRevision: "current",
      sampleRate: 24,
    },
  });
  TestValidator.predicate(
    "stale revision is addressed before geometry or motion is read",
    staleBeforeGeometry.reports === undefined &&
      staleBeforeGeometry.out.items.length === 1 &&
      staleBeforeGeometry.out.items[0]?.path ===
        "$input.cameraClearance.currentRevision",
  );

  const stalePerformance = performShot({
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
        (item) => item.path === "$input.cameraClearance.currentRevision",
      ),
  );

  const blockedProgram = (): IAutoMovieShotProgram => {
    const blocking = makeBlockingWrite();
    const performance = makePerformanceWrite();
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
  const blocked = compileDefinedShot({
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
      skeleton: () => createSkeleton(),
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
        (item) =>
          item.phase === "performance" &&
          item.path.includes(".clearance.body") &&
          item.fact.includes("contacts obstacle"),
      ),
  );
};
