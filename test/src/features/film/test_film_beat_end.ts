import { Quaternion, resolveBeatEnd } from "@automovie/engine";
import {
  type IAutoMovieBeatEndActorState,
  type IAutoMovieBeatEndState,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose, throwsError, vclose } from "../internal/predicates";

const transform: (
  translation: IAutoMovieTransform["translation"],
  rotation?: IAutoMovieTransform["rotation"],
) => IAutoMovieTransform = (
  translation: IAutoMovieTransform["translation"],
  rotation: IAutoMovieTransform["rotation"] = IDENTITY_TRANSFORM.rotation,
): IAutoMovieTransform => ({
  translation,
  rotation,
  scale: { x: 1, y: 1, z: 1 },
});

const rootAt: (
  translation: IAutoMovieTransform["translation"],
  yaw?: number,
) => IAutoMovieTransform = (
  translation: IAutoMovieTransform["translation"],
  yaw: number = 0,
): IAutoMovieTransform =>
  transform(translation, Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw));

const walkingMotion: IAutoMovieMotion = {
  ...makeMotion(
    [
      keyframe(0, makePose([], rootAt({ x: 0, y: 0, z: 0 }, 0))),
      keyframe(
        1,
        makePose(
          [joint("leftLowerLeg", { flexion: 30 })],
          rootAt({ x: 2, y: 0, z: 0 }, 90),
        ),
      ),
    ],
    1,
  ),
  id: "walk",
};

const idleMotion: IAutoMovieMotion = {
  ...makeMotion(
    [
      keyframe(0, makePose([joint("head", { twist: 0 })])),
      keyframe(1, makePose([joint("head", { twist: 20 })])),
    ],
    1,
  ),
  id: "idle",
};

const scene: IAutoMovieScene = {
  id: "scene",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "hero",
      transform: transform({ x: 10, y: 0, z: 0 }),
      motion: null,
      pose: null,
    },
    {
      id: "guard",
      model: "guard",
      transform: transform(
        { x: 0, y: 0, z: 2 },
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      ),
      motion: null,
      pose: makePose([joint("leftLowerArm", { flexion: 45 })]),
    },
    {
      id: "crowd",
      model: "crowd",
      transform: transform({ x: -3, y: 0, z: 1 }),
      motion: "idle",
      pose: null,
    },
    {
      id: "extra",
      model: "extra",
      transform: transform({ x: 4, y: 0, z: -1 }),
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
};

const shot: IAutoMovieShot = {
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [
    { node: "hero", motion: "walk", startOffset: 1 },
    { node: "guard", motion: null, startOffset: 0 },
  ],
  objectMotions: [],
  duration: 2,
};

/**
 * Beat-end snapshots sample performed actors at shot end, fold pose root motion into world-space transforms, preserve held actors, and refuse a referenced clip that was not supplied.
 *
 * Scenarios:
 *
 * 1. A performed hero samples one second after its offset, folds two metres of root travel and ninety degrees of yaw into staged state, and clears the pose root while retaining its bone.
 * 2. A held guard retains its staged position and one-joint pose.
 * 3. An unperformed crowd node samples its scene motion at shot time and clamps to its last joint pose.
 * 4. A resting unperformed extra retains null motion and pose; all actors remain in scene order under the supplied beat and shot ids.
 * 5. A referenced walk missing from the supplied motions throws its named missing-motion Error.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveBeatEnd and checks actor order, ids, local clocks, folded translation/facing, held and clamped pose fields and missing-motion refusal, catching offset loss, double-applied pose root or omission of unperformed nodes.
 * @evidence contracts/testing.md#independent-expectations The hero's staged x=10 plus authored root x=2 gives x=12, and a ninety-degree Y turn maps forward Z to positive X. Literal held positions and final head twist 20 supply the other expectations without product sampling; finite coordinates, clocks and twist use the shared tolerances.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts performed motion, explicitly held performance, scene-level motion and a resting node in one ordered snapshot, plus a missing motion; loop phases, velocities, plants, mounts and baked object authority are covered by adjacent beat-end tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_beat_end entry owns its literal scene, shot and missing-motion case and calls the engine in-process, with existing numerical fixtures and no installation, native artifact, process or render host.
 */
export function test_film_beat_end(): void {
  const end: IAutoMovieBeatEndState = resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot,
    motions: [walkingMotion, idleMotion],
  });
  TestValidator.equals("beat id", end.beat, "beat-1");
  TestValidator.equals("shot id", end.shot, "shot:beat-1");
  TestValidator.equals(
    "actors stay in scene order",
    end.actors.map((a: IAutoMovieBeatEndActorState): string => a.node),
    ["hero", "guard", "crowd", "extra"],
  );

  const hero: IAutoMovieBeatEndActorState = end.actors[0]!;
  TestValidator.equals("hero motion id", hero.motion, "walk");
  TestValidator.predicate("hero local time", nclose(hero.localTime, 1));
  TestValidator.predicate(
    "hero root folded into world position",
    vclose(hero.transform.translation, { x: 12, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "hero facing follows sampled root yaw",
    vclose(hero.facing, { x: 1, y: 0, z: 0 }, 1e-6),
  );
  TestValidator.equals("hero pose root is cleared", hero.pose?.root, null);
  TestValidator.equals(
    "hero articulation remains",
    hero.pose?.joints[0]?.bone,
    "leftLowerLeg",
  );

  const guard: IAutoMovieBeatEndActorState = end.actors[1]!;
  TestValidator.equals("guard is held", guard.motion, null);
  TestValidator.predicate(
    "guard stays at staged position",
    vclose(guard.transform.translation, { x: 0, y: 0, z: 2 }),
  );
  TestValidator.equals("guard held pose remains", guard.pose?.joints.length, 1);

  const crowd: IAutoMovieBeatEndActorState = end.actors[2]!;
  TestValidator.equals("scene-level motion is sampled", crowd.motion, "idle");
  TestValidator.predicate("crowd local time", nclose(crowd.localTime, 2));
  TestValidator.equals(
    "crowd clip clamps to last pose",
    {
      bone: crowd.pose?.joints[0]?.bone,
      flexion: crowd.pose?.joints[0]?.flexion,
      abduction: crowd.pose?.joints[0]?.abduction,
    },
    {
      bone: "head",
      flexion: null,
      abduction: null,
    },
  );
  TestValidator.predicate(
    "crowd clip clamps to last twist",
    nclose(crowd.pose?.joints[0]?.twist ?? Number.NaN, 20),
  );

  const extra: IAutoMovieBeatEndActorState = end.actors[3]!;
  TestValidator.equals(
    "unperformed rest actor keeps no motion",
    extra.motion,
    null,
  );
  TestValidator.equals(
    "unperformed rest actor keeps no pose",
    extra.pose,
    null,
  );

  TestValidator.predicate(
    "missing motion throws",
    throwsError(
      (): IAutoMovieBeatEndState =>
        resolveBeatEnd({ beat: "beat-1", scene, shot, motions: [idleMotion] }),
      'motion "walk" was not provided',
    ),
  );
}
