import {
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
  IAutoMovieBlocking,
  IAutoMovieBlockingCoverage,
  IAutoMovieCameraAction,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieShotCoverage,
  IAutoMovieShotPerformance,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, IAutoMovieStagedSet, performShot, stageScene, IAutoMovieActionSynthesizer } from "@automovie/engine";




import {
  FIXTURE_BONE,
  fixtureRegionDrivesBone,
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import {
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { namedFacts, vclose, violationCount } from "../internal/predicates";

type ICoverage = IAutoMovieBlockingCoverage;

/**
 * A pose marching the root along model +X, with an elbow key only when the existing region fixture enables it. The locomote fixture omits elbow keys; this scenario observes the carried root displacement.
 */
const march: (x: number, drivesBone: boolean) => IAutoMoviePose = (
  x: number,
  drivesBone: boolean,
): IAutoMoviePose =>
  makePose(drivesBone ? [joint(FIXTURE_BONE, { flexion: 10 + x * 10 })] : [], {
    translation: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });

/**
 * A `launch` produces no actor motion, the foe marches 1 m along model +X, and
 * everything else (including the react the engine injects for a struck target)
 * gets the shared elbow clip. The last part is the point: a host synthesizer
 * answers for whatever actor id the engine hands it.
 */
const synth: IAutoMovieActionSynthesizer = (
  action: IAutoMovieActionCall,
  actor: string,
): IAutoMovieMotion | null => {
  if (action.verb === "launch") return null;
  if (actor === "foe") {
    const driven: boolean = fixtureRegionDrivesBone(action);
    return makeMotion(
      [keyframe(0, march(0, driven)), keyframe(1, march(1, driven))],
      1,
    );
  }
  return validSynthesizer(action, actor);
};

const script: IAutoMovieScript = makeScriptWrite({
  cast: [
    { node: "archer", character: "the archer", modelRef: "stickman" },
    { node: "foe", character: "the foe", modelRef: null },
    { node: "arrow", character: "the arrow", modelRef: null },
  ],
  beats: [
    {
      id: "beat-1",
      name: "the loosing",
      summary: "the archer looses down the lens",
      durationHint: 2,
    },
  ],
});

const staged: IAutoMovieStagedSet.ISuccess =
  ((): IAutoMovieStagedSet.ISuccess => {
    const result: IAutoMovieStagedSet = stageScene(
      script,
      makeStagingWrite({
        actors: [
          { node: "archer", position: { x: 0, y: 0, z: 0 }, facingDeg: 0 },
          { node: "foe", position: { x: 6, y: 0, z: 0 }, facingDeg: 180 },
          { node: "arrow", position: { x: 0, y: 1.4, z: 0 }, facingDeg: 0 },
        ],
        cameras: [
          {
            node: "cam-main",
            position: { x: 3, y: 1.6, z: 4 },
            lookAt: { kind: "node", node: "foe" },
            fovDeg: 45,
            near: 0.1,
            far: 1000,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
          {
            node: "cam-alt",
            position: { x: 0, y: 1.6, z: -4 },
            lookAt: { kind: "node", node: "foe" },
            fovDeg: 45,
            near: 0.1,
            far: 1000,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
          {
            node: "cam-cover",
            position: { x: -4, y: 1.6, z: 0 },
            lookAt: { kind: "node", node: "foe" },
            fovDeg: 45,
            near: 0.1,
            far: 1000,
            depthPrecision: { minimumDepthBits: 24, maximumStepMeters: 100 },
          },
        ],
      }),
    );
    if (result.success !== true)
      throw new Error("staging fixture must succeed");
    return result;
  })();

/**
 * A loose down the lens. It carries NO `onHit`: a camera is a place to shoot
 * at, but nothing recoils it, and the engine refuses an `onHit` whose aim names
 * a camera because the react it would inject rides past the gate that keeps a
 * camera out of `shot.performances`.
 */
const looseAtCamera: IAutoMovieActionCall = {
  verb: "launch",
  actor: "archer",
  start: 0.2,
  duration: "auto",
  projectile: "arrow",
  at: { kind: "node", node: "cam-main" },
  speed: 22,
};

const frame: (
  actor: string,
  on: string,
) => IAutoMovieCameraAction & { verb: "frame" } = (
  actor: string,
  on: string,
): IAutoMovieActionCall & { verb: "frame" } => ({
  verb: "frame",
  actor,
  start: 0,
  duration: "auto",
  framing: "wide",
  move: "follow",
  on: { kind: "node", node: on },
});

/** A blocking whose hero intent matches the `frame` fixture above. */
const blockingWith: (
  coverage: IAutoMovieBlockingCoverage[],
) => IAutoMovieBlocking = (coverage: ICoverage[]): IAutoMovieBlocking => ({
  beat: "beat-1",
  analysis: "the loose must read as aimed at the lens.",
  rationale: "a wide follow keeps the flight and the impact in frame.",
  actors: [{ node: "archer", beats: "looses down the lens" }],
  camera: {
    framing: "wide",
    move: "follow",
    on: { kind: "node", node: "cam-main" },
  },
  coverage,
  duration: 2,
});

const perform: (
  draft: IAutoMovieActionCall[],
  coverage?: IAutoMovieBlockingCoverage[] | undefined,
  targetAt?:
    | ((
        target: IAutoMovieActionTarget,
        seconds: number,
      ) => IAutoMovieVector3 | null)
    | undefined,
) => IAutoMoviePerformedShot = (
  draft: IAutoMovieActionCall[],
  coverage?: ICoverage[],
  targetAt?: (
    target: IAutoMovieActionTarget,
    seconds: number,
  ) => IAutoMovieVector3 | null,
): IAutoMoviePerformedShot =>
  performShot({
    script,
    staged,
    performance: makePerformanceWrite({
      beat: "beat-1",
      draft,
      revise: { review: "the loose reads.", final: null },
      duration: 2,
    }),
    synthesize: synth,
    // The production contract: no rig for a prop, and none for a camera.
    skeleton: (node: string): IAutoMovieSkeleton | null =>
      node === "arrow" || node.startsWith("cam-") ? null : createSkeleton(),
    blocking: coverage === undefined ? undefined : blockingWith(coverage),
    targetAt,
  });

/** Every translation key of a compiled camera clip, as points. */
const keysOf: (
  values: readonly number[],
) => { x: number; y: number; z: number }[] = (
  values: readonly number[],
): { x: number; y: number; z: number }[] =>
  Array.from(
    { length: values.length / 3 },
    (_: unknown, k: number): { x: number; y: number; z: number } => ({
      x: values[k * 3]!,
      y: values[k * 3 + 1]!,
      z: values[k * 3 + 2]!,
    }),
  );

/**
 * Camera, bone, actor and projectile subjects reach their intended numerical framing paths.
 *
 * Scenarios:
 * 1. Frame a camera in hero/coverage takes while keeping cameras out of pose performances.
 * 2. Use a live moving bone for follow/focus and accept a missing later-sample fallback.
 * 3. Keep placed-actor and launched-projectile follow keys moving.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs performShot and checks take identities, key counts, performance membership, focus point and endpoint movement, catching missing facing rotation, frozen live focus or a camera injected as a performer.
 * @evidence contracts/testing.md#independent-expectations A camera is an admitted position with no rig/facing, so its follow stays still; the supplied bone callback independently gives focus (6,1.2,0), and the authored actor march/projectile flight must move. Key-count/movement witnesses do not independently prove the complete ballistic or framing trajectory.
 * @evidence contracts/testing.md#distinguishing-cases Preserves hero/coverage camera subjects, no-camera-performance invariants, live/missing-later bone lookup, placed actor and launched prop neighbours. Invalid camera-as-react target and malformed targets belong to action gate tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous discoverable unit owns all portable subject cases using the existing synthesizer and an explicit target callback; it opens no viewer or process, and tests no GPU display.
 */
export function test_film_perform_shot_camera_subject(): void {
  // 1. the hero take: an animated, facing-less subject holds still.
  const hero: IAutoMoviePerformedShot = perform([
    looseAtCamera,
    frame("cam-alt", "cam-main"),
  ]);
  TestValidator.equals("a camera subject performs", hero.success, true);
  if (hero.success !== true) return;
  TestValidator.equals(
    "a follow on a facing-less subject keys once",
    keysOf(hero.shot.cameraMotion!.tracks[0]!.values).length,
    1,
  );

  // 2. no camera performs, in the motion map or in the shot.
  TestValidator.equals(
    "a camera never reaches the compiled motions",
    Object.keys(hero.motions).filter((node: string): boolean =>
      node.startsWith("cam-"),
    ),
    [],
  );
  TestValidator.equals(
    "every performance names a staged scene node",
    hero.shot.performances
      .map((entry: IAutoMovieShotPerformance): string => entry.node)
      .filter(
        (node: string): boolean =>
          !staged.scene.nodes.some(
            (n: IAutoMovieSceneNode): boolean => n.id === node,
          ),
      ),
    [],
  );

  // 3. the same subject through a coverage take.
  const covered: IAutoMoviePerformedShot = perform(
    [looseAtCamera, frame("cam-alt", "cam-main")],
    [
      {
        camera: "cam-cover",
        framing: "wide",
        move: "follow",
        on: { kind: "node", node: "cam-main" },
      },
    ],
  );
  TestValidator.equals(
    "a camera-subject coverage performs",
    covered.success,
    true,
  );
  if (covered.success !== true) return;
  TestValidator.equals(
    "an alternate camera may frame another camera",
    covered.shot.coverage!.map(
      (take: IAutoMovieShotCoverage): string => take.camera,
    ),
    ["cam-cover"],
  );
  TestValidator.equals(
    "the alternate keys once for the same reason",
    keysOf(covered.shot.coverage![0]!.cameraMotion!.tracks[0]!.values).length,
    1,
  );

  // 4. Bone subjects share the live-target callback with action synthesis. The
  // explicit focus assertion proves the directorial intent field does not keep
  // the old static resolver after the camera path begins following the joint.
  const boneTarget: IAutoMovieActionTarget = {
    kind: "bone",
    node: "foe",
    bone: "leftHand",
  };
  const boneFrame: IAutoMoviePerformedShot = perform(
    [
      {
        verb: "frame",
        actor: "cam-alt",
        start: 0,
        duration: 1,
        framing: "medium",
        move: "follow",
        on: boneTarget,
        focus: boneTarget,
      },
    ],
    undefined,
    (
      _target: IAutoMovieActionTarget,
      seconds: number,
    ): { x: number; y: number; z: number } => ({
      x: 6 + seconds,
      y: 1.2,
      z: 0,
    }),
  );
  TestValidator.equals(
    "a moving bone drives both the follow subject and camera intent focus",
    namedFacts([
      ["boneFrameSuccess", (): boolean => boneFrame.success === true],
      [
        "keysOfBoneFrameShot",
        (): boolean =>
          boneFrame.success === true &&
          keysOf(boneFrame.shot.cameraMotion!.tracks[0]!.values).length > 1,
      ],
    ]),
    {
      boneFrameSuccess: true,
      keysOfBoneFrameShot: true,
    },
  );
  TestValidator.predicate(
    "the live bone supplies the authored initial focus",
    boneFrame.success === true &&
      vclose(boneFrame.shot.cameraIntent![0]!.focus!, {
        x: 6,
        y: 1.2,
        z: 0,
      }),
  );
  const fallbackBoneFrame: IAutoMoviePerformedShot = perform(
    [
      {
        verb: "frame",
        actor: "cam-alt",
        start: 0,
        duration: 1,
        framing: "medium",
        move: "follow",
        on: boneTarget,
      },
    ],
    undefined,
    (
      _target: IAutoMovieActionTarget,
      seconds: number,
    ): { x: number; y: number; z: number } | null =>
      seconds === 0 ? { x: 6, y: 1.2, z: 0 } : null,
  );
  TestValidator.equals(
    "a missing later live sample falls back to the validated bone point",
    fallbackBoneFrame.success,
    true,
  );

  // 5. negative twin: a subject WITH a staged facing still tracks.
  const tracking: IAutoMoviePerformedShot = perform([
    {
      verb: "locomote",
      actor: "foe",
      start: 0,
      duration: 1,
      gait: "walk",
      to: { kind: "point", point: { x: 5, y: 0, z: 0 } },
    },
    frame("cam-alt", "foe"),
  ]);
  TestValidator.equals("the tracking twin performs", tracking.success, true);
  if (tracking.success !== true) return;
  TestValidator.equals(
    "the tracking twin is clean",
    violationCount(tracking),
    0,
  );
  const keys: { x: number; y: number; z: number }[] = keysOf(
    tracking.shot.cameraMotion!.tracks[0]!.values,
  );
  TestValidator.equals(
    "a follow on a placed actor keys the whole span",
    keys.length > 1,
    true,
  );
  TestValidator.predicate(
    "and the framing actually travels with it",
    !vclose(keys[0]!, keys[keys.length - 1]!),
  );

  const projectile: IAutoMoviePerformedShot = perform([
    looseAtCamera,
    frame("cam-alt", "arrow"),
  ]);
  TestValidator.equals(
    "a follow on a launched prop performs",
    projectile.success,
    true,
  );
  if (projectile.success !== true) return;
  const projectileKeys: { x: number; y: number; z: number }[] = keysOf(
    projectile.shot.cameraMotion!.tracks[0]!.values,
  );
  TestValidator.predicate(
    "the launch trajectory moves the prop-follow camera",
    projectileKeys.length > 1 &&
      !vclose(projectileKeys[0]!, projectileKeys[projectileKeys.length - 1]!),
  );
}
