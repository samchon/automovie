import { resolveBeatEnd, sampleMotion } from "@automovie/engine";
import {
  type IAutoMovieBeatEndActorState,
  type IAutoMovieJointPose,
  IAutoMovieMotion,
  type IAutoMoviePose,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose, vclose } from "../internal/predicates";

/**
 * A looping travel clip whose root advances x = 2t over a 1-second cycle: the
 * exact hand-oracle for phase and velocity at every beat boundary.
 */
const walk: IAutoMovieMotion = {
  ...makeMotion(
    [
      keyframe(
        0,
        makePose([joint("leftLowerLeg", { flexion: 0 })], {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
      keyframe(
        1,
        makePose([joint("leftLowerLeg", { flexion: 40 })], {
          translation: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        }),
      ),
    ],
    1,
    true,
  ),
  id: "walk",
};

const scene: IAutoMovieScene = {
  id: "scene",
  name: null,
  nodes: [
    {
      id: "hero",
      model: "hero",
      transform: IDENTITY_TRANSFORM,
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
};

const shotOf: (duration: number) => IAutoMovieShot = (
  duration: number,
): IAutoMovieShot => ({
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [{ node: "hero", motion: "walk", startOffset: 0 }],
  objectMotions: [],
  duration,
});

const endOf: (duration: number) => IAutoMovieBeatEndActorState = (
  duration: number,
): IAutoMovieBeatEndActorState =>
  resolveBeatEnd({
    beat: "beat-1",
    scene,
    shot: shotOf(duration),
    motions: [walk],
  }).actors[0]!;

/**
 * Beat-end continuity carries the stride phase, folded root position and incoming velocity a later beat needs. The checks constrain the phase and both sampled poses with hand-derived values and distinguish loop-wrap discontinuity from physical travel; a cleared pose root marks the folded transform as the sole root placement.
 *
 * Scenarios:
 *
 * 1. Mid-cycle end (2.25 s into a 1 s loop): gaitPhase = 0.25, world position
 *    folds to x = 0.5, and rootVelocity = the clip's constant 2 m/s.
 * 2. Resume equality: sampling at the carried phase and elapsed time gives the same one-joint articulation and root translation, checked against ten degrees of flexion and x=0.5.
 * 3. Restage seam: the end pose's root is cleared so a consumer can use its carried transform without applying the same root twice; this test does not stage a second beat.
 * 4. Exactly on the loop seam (2.0 s): phase wraps to 0 and velocity is measured
 *    on the cycle's closing stretch (clamped, not wrapped): still 2 m/s, not a
 *    backwards teleport.
 * 5. In the cycle's opening instants (phase < the finite-difference window) the
 *    window shrinks to [0, phase] and still reads 2 m/s.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveBeatEnd at mid-cycle, seam and opening instants and checks carried phase, folded position, root clearing and velocity, then samples both resume clocks and checks their articulation and translation. This catches a seam-crossing backward velocity spike or a carried phase that resumes a different pose.
 * @evidence contracts/testing.md#independent-expectations The literal one-second root law x=2t gives phase 0.25, position 0.5 and velocity 2, while linear flexion from zero to forty gives ten degrees. Those hand values constrain both product sampler observations, so agreement between two wrong samples alone cannot pass; full next-beat restaging is outside these assertions.
 * @evidence contracts/testing.md#distinguishing-cases Preserves mid-cycle elapsed time 2.25, exact seam 2, and early-cycle 2.02 with its shortened derivative window, plus resumed articulation and cleared-root ownership; nonlooping tails and zero-duration loops belong to test_film_beat_end_sim_state.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_beat_end_continuity entry owns all numeric boundary calls and existing motion fixtures in-process, without installing a production or starting native compilation, a process or a renderer.
 */
export function test_film_beat_end_continuity(): void {
  const mid: IAutoMovieBeatEndActorState = endOf(2.25);
  TestValidator.predicate("mid-cycle phase", nclose(mid.gaitPhase!, 0.25));
  TestValidator.predicate(
    "mid-cycle world position",
    vclose(mid.transform.translation, { x: 0.5, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "mid-cycle velocity",
    vclose(mid.rootVelocity!, { x: 2, y: 0, z: 0 }, 1e-9),
  );

  const resumed: IAutoMoviePose = sampleMotion(walk, mid.gaitPhase!).pose;
  const ended: IAutoMoviePose = sampleMotion(walk, 2.25).pose;
  TestValidator.equals(
    "resume reproduces joints",
    resumed.joints.map(
      (joint: IAutoMovieJointPose): readonly [string, boolean, boolean] => [
        joint.bone,
        joint.abduction === null,
        joint.twist === null,
      ],
    ),
    ended.joints.map(
      (joint: IAutoMovieJointPose): readonly [string, boolean, boolean] => [
        joint.bone,
        joint.abduction === null,
        joint.twist === null,
      ],
    ),
  );
  for (const pose of [resumed, ended]) {
    TestValidator.equals(
      "resumed joint identity and nullable axes",
      pose.joints.map(
        (joint: IAutoMovieJointPose): readonly [string, boolean, boolean] => [
          joint.bone,
          joint.abduction === null,
          joint.twist === null,
        ],
      ),
      [["leftLowerLeg", true, true]],
    );
    TestValidator.predicate(
      "resumed flexion follows the authored linear quarter cycle",
      nclose(pose.joints[0]?.flexion ?? Number.NaN, 10, 1e-12),
    );
    TestValidator.predicate(
      "resumed root follows the authored linear quarter cycle",
      pose.root !== null &&
        vclose(pose.root.translation, { x: 0.5, y: 0, z: 0 }, 1e-12),
    );
  }
  TestValidator.predicate(
    "resume reproduces root",
    vclose(resumed.root!.translation, ended.root!.translation, 1e-12),
  );

  TestValidator.equals("end pose root cleared", mid.pose!.root, null);

  const seam: IAutoMovieBeatEndActorState = endOf(2);
  TestValidator.predicate("seam phase wraps to 0", nclose(seam.gaitPhase!, 0));
  TestValidator.predicate(
    "seam velocity from the closing stretch",
    vclose(seam.rootVelocity!, { x: 2, y: 0, z: 0 }, 1e-9),
  );

  const opening: IAutoMovieBeatEndActorState = endOf(2.02);
  TestValidator.predicate(
    "opening-instants phase",
    nclose(opening.gaitPhase!, 0.02, 1e-9),
  );
  TestValidator.predicate(
    "opening-instants velocity",
    vclose(opening.rootVelocity!, { x: 2, y: 0, z: 0 }, 1e-6),
  );
}
