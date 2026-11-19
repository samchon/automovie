import {
  performShot,
  stageScene,
  validateShotArtifact,
} from "@automovie/engine";
import type {
  IAutoMovieCameraAction,
  IAutoMovieCameraIntent,
  IAutoMovieConstraintViolation,
  IAutoMovieMotion,
  IAutoMoviePerformedShot,
  IAutoMoviePose,
  IAutoMovieShot,
  IAutoMovieStagedSet,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { joint, keyframe, makeMotion, makePose } from "../internal/fixtures";
import { nclose, vclose } from "../internal/predicates";

/** A one-metre model-X root move with a gesture-owned joint channel. */
function march(x: number): IAutoMoviePose {
  return makePose([joint("leftLowerArm", { flexion: 10 + 10 * x })], {
    translation: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
}

/**
 * Compile the focus pull through the staged shot API and re-admit its artifact.
 *
 * Scenarios:
 * 1. Hold a static camera and pull from an authored front-plane point to an
 *    actor's position halfway through a one-metre root move.
 * 2. Check a frame without the pull for its original metadata and camera clip.
 * 3. Refuse missing sources, unknown targets and marks outside finite or
 *    automatic frame spans.
 * 4. Snap a decimal sum to the next frame start, re-admit the serialized
 *    marks, and refuse a reversed mark or one that crosses into that frame.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads shot-local marks, world points and the compiled transform tracks through performShot, then checks fresh artifact admission. Malformed production inputs are checked by exact violation path.
 * @evidence contracts/development/testing.md#independent-expectations The actor starts at the origin facing model +X into world +X. Halfway through a one-second linear metre of travel, the destination is (0.5,0,0). The source and lead-in times are literal, and byte equality to the legacy camera clip checks that neither transform channel depends on the pull.
 * @evidence contracts/development/testing.md#distinguishing-cases A moving destination distinguishes cue-time placement from the shot opening. Explicit and auto deadlines exercise different span owners. The legacy result checks absence because a null field would change the serialized shape.
 * @evidence contracts/development/testing.md#execution-ownership Uses the installed staging, shot and artifact entry points. A deterministic motion callback supplies authored keys in memory, with no rendering, resource access or frame loop.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the fixed camera, held and moving focus marks, authored and serialized refusal cases and legacy shape.
 */
export function test_film_camera_focus_pull(): void {
  const script: ReturnType<typeof makeScriptWrite> = makeScriptWrite();
  const staging: IAutoMovieStagedSet = stageScene(
    script,
    makeStagingWrite({
      actors: [
        { node: "knightA", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
        { node: "knightB", position: { x: 0, y: 0, z: 0.7 }, facingDeg: 180 },
      ],
    }),
  );
  if (staging.success !== true) throw new Error("staging must succeed");
  const staged: IAutoMovieStagedSet.ISuccess = staging;

  const frame: IAutoMovieCameraAction = {
    verb: "frame",
    actor: "cam-main",
    start: 0.125,
    duration: "auto",
    framing: "medium",
    move: "static",
    on: { kind: "node", node: "knightB" },
    focus: { kind: "point", point: { x: 0, y: 0, z: 2 } },
  };
  const pull: NonNullable<IAutoMovieCameraAction["focusPull"]> = {
    start: 0.125,
    duration: 0.25,
    to: { kind: "node", node: "knightA" },
  };
  /** Compile one real shot with the supplied frame schedule. */
  function perform(
    frames: readonly IAutoMovieCameraAction[],
  ): IAutoMoviePerformedShot {
    return performShot({
      script,
      staged,
      performance: makePerformanceWrite({
        draft: [
          {
            verb: "gesture",
            actor: "knightA",
            start: 0,
            duration: 1,
            kind: "wave",
          },
          ...frames,
        ],
      }),
      synthesize: (): IAutoMovieMotion =>
        makeMotion([keyframe(0, march(0)), keyframe(1, march(1))], 1),
      skeleton: (): null => null,
    });
  }

  const result: IAutoMoviePerformedShot = perform([
    { ...frame, focusPull: pull },
  ]);
  const legacy: IAutoMoviePerformedShot = perform([frame]);
  if (result.success !== true || legacy.success !== true)
    throw new Error("both frame schedules must compile");
  const intent: IAutoMovieCameraIntent = result.shot.cameraIntent![0]!;
  const marks: NonNullable<IAutoMovieCameraIntent["focusPull"]> =
    intent.focusPull!;
  TestValidator.predicate(
    "marks appear before and at the half-second endpoint",
    nclose(marks.start, 0.25) && nclose(marks.end, 0.5),
  );
  TestValidator.predicate(
    "the opening mark and destination record separate subject positions",
    vclose(intent.focus!, { x: 0, y: 0, z: 2 }) &&
      vclose(marks.to, { x: 0.5, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "the pull leaves the compiled camera path unchanged",
    result.shot.cameraMotion !== null &&
      JSON.stringify(result.shot.cameraMotion) ===
        JSON.stringify(legacy.shot.cameraMotion),
  );
  TestValidator.predicate(
    "ordinary focus stays a single point without the pull field",
    !Object.hasOwn(legacy.shot.cameraIntent![0]!, "focusPull") &&
      vclose(legacy.shot.cameraIntent![0]!.focus!, { x: 0, y: 0, z: 2 }),
  );

  const cases: ReadonlyArray<{
    frames: IAutoMovieCameraAction[];
    path: string;
    kind: IAutoMovieConstraintViolation["kind"];
  }> = [
    {
      frames: [{ ...frame, focus: undefined, focusPull: pull }],
      path: "focus",
      kind: "type",
    },
    {
      frames: [
        {
          ...frame,
          focusPull: { ...pull, to: { kind: "node", node: "unstaged" } },
        },
      ],
      path: "focusPull.to",
      kind: "type",
    },
    {
      frames: [{ ...frame, duration: 0.25, focusPull: pull }],
      path: "focusPull.duration",
      kind: "range",
    },
    {
      frames: [
        { ...frame, focusPull: pull },
        { ...frame, start: 0.375 },
      ],
      path: "focusPull.duration",
      kind: "range",
    },
  ];
  for (const entry of cases) {
    const invalid: IAutoMoviePerformedShot = perform(entry.frames);
    TestValidator.predicate(
      `refuses ${entry.path} for the authored span`,
      invalid.success === false &&
        invalid.violations.some(
          (finding: IAutoMovieConstraintViolation): boolean =>
            finding.kind === entry.kind &&
            finding.path === `$input.draft[1].${entry.path}`,
        ),
    );
  }

  const nextStart: number = frame.start + 0.3;
  const adjacent: IAutoMoviePerformedShot = perform([
    {
      ...frame,
      duration: 0.3,
      focusPull: { ...pull, start: 0.1, duration: 0.2 },
    },
    { ...frame, start: nextStart },
  ]);
  if (adjacent.success !== true) throw new Error("the decimal seam must admit");
  const restored: IAutoMovieShot = JSON.parse(JSON.stringify(adjacent.shot));
  const first: IAutoMovieCameraIntent = restored.cameraIntent![0]!;
  const second: IAutoMovieCameraIntent = restored.cameraIntent![1]!;
  const adjacentPull: NonNullable<IAutoMovieCameraIntent["focusPull"]> =
    first.focusPull!;
  TestValidator.predicate(
    "the decimal endpoint serializes as the exact following frame start",
    adjacentPull.end === second.start &&
      validateShotArtifact(restored, staged.scene, null).success === true,
  );
  for (const invalidEnd of [adjacentPull.start, second.start + 0.01]) {
    const invalid: IAutoMovieValidation = validateShotArtifact(
      {
        ...restored,
        cameraIntent: [
          { ...first, focusPull: { ...adjacentPull, end: invalidEnd } },
          second,
        ],
      },
      staged.scene,
      null,
    );
    TestValidator.predicate(
      "a serialized end follows the start and stays within its frame",
      invalid.success === false &&
        invalid.violations.some(
          (finding: IAutoMovieConstraintViolation): boolean =>
            finding.path === "$input.cameraIntent[0].focusPull.end",
        ),
    );
  }
}
