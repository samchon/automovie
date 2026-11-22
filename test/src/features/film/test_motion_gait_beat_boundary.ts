import {
  compilePerformance,
  makeActorSynthesizer,
  resolveBeatEnd,
  sampleMotion,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  type IAutoMovieActorContext,
  IAutoMovieGait,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
  IAutoMovieVector3,
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

const WALK: IAutoMovieGait = {
  name: "walk",
  period: 1,
  limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
};

const ctx: IAutoMovieActorContext = {
  skeleton: "skeleton-1",
  gaits: [WALK],
  position: { x: 0, y: 0, z: 0 },
  speed: 1,
  facingDeg: 0,
  eyeHeight: 1.6,
  restPose: makePose([joint("spine", { flexion: 0 })]),
};

const contexts: Map<string, IAutoMovieActorContext> = new Map<
  string,
  IAutoMovieActorContext
>([["hero", ctx]]);
const nodes: Map<string, IAutoMovieVector3> = new Map<
  string,
  IAutoMovieVector3
>([["door", { x: 0, y: 0, z: 5 }]]);

const locomote: IAutoMovieActionCall = {
  verb: "locomote",
  gait: "walk",
  to: { kind: "node", node: "door" },
  actor: "hero",
  start: 0,
  duration: "auto",
};

const lookAt: IAutoMovieActionCall = {
  verb: "lookAt",
  to: { kind: "node", node: "door" },
  actor: "hero",
  start: 0,
  duration: 1,
};

const gesture: IAutoMovieActionCall = {
  verb: "gesture",
  kind: "bow",
  actor: "hero",
  start: 0,
  duration: "auto",
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

const shotOf: (motionId: string, duration: number) => IAutoMovieShot = (
  motionId: string,
  duration: number,
): IAutoMovieShot => ({
  id: "shot:beat-1",
  name: null,
  scene: "scene",
  camera: "cam",
  cameraMotion: null,
  performances: [{ node: "hero", motion: motionId, startOffset: 0 }],
  objectMotions: [],
  duration,
});

/**
 * Resolves a beat-end pose and its incoming travel through a loop seam.
 * Scenarios:
 * - The exact wrap, opening and quarter cycle of a linear stride retain its incoming velocity.
 * - Locomotion and independently layered gaze carry one clock; gesture alone carries none.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public resolved beat and its resumed sample.
 * @evidence contracts/development/testing.md#independent-expectations Linear root and knee tracks have slopes of two metres and forty degrees per second.
 * @evidence contracts/development/testing.md#distinguishing-cases A wrap is discontinuous in location while incoming velocity is continuous.
 * @evidence contracts/development/testing.md#execution-ownership Uses synthetic keyframes and a single actor context.
 * @evidence contracts/development/common.md#meaningful-documentation Names the published observables and their units.
 */
export function test_motion_gait_beat_boundary(): void {
  const end = (motion: IAutoMovieMotion, seconds: number) =>
    resolveBeatEnd({
      beat: "beat-1",
      scene,
      shot: shotOf(motion.id, seconds),
      motions: [motion],
    }).actors[0]!;
  const linear = makeMotion(
    [0, 1].map((t) =>
      keyframe(
        t,
        makePose([joint("leftLowerLeg", { flexion: 40 * t })], {
          ...IDENTITY_TRANSFORM,
          translation: { x: 2 * t, y: 0, z: 0 },
        }),
      ),
    ),
    1,
    true,
  );
  for (const phase of [0, 0.02, 0.25]) {
    const state = end(linear, 2 + phase);
    TestValidator.predicate("wrapped phase", nclose(state.gaitPhase!, phase));
    TestValidator.predicate(
      "incoming root velocity",
      vclose(
        state.rootVelocity!,
        { x: 2, y: 0, z: 0 },
        phase === 0.02 ? 1e-6 : 1e-9,
      ),
    );
    TestValidator.predicate(
      "folded root",
      vclose(state.transform.translation, { x: 2 * phase, y: 0, z: 0 }),
    );
    TestValidator.equals("root applied exactly once", state.pose!.root, null);
    if (phase !== 0) {
      for (const t of [2 + phase, state.gaitPhase!]) {
        const pose = sampleMotion(linear, t).pose;
        TestValidator.predicate(
          "linear resumed root",
          vclose(pose.root!.translation, { x: 2 * phase, y: 0, z: 0 }, 1e-12),
        );
        const row = pose.joints[0]!;
        TestValidator.equals(
          "one authored knee axis",
          [pose.joints.length, row.bone, row.abduction, row.twist],
          [1, "leftLowerLeg", null, null],
        );
        TestValidator.predicate(
          "linear resumed knee",
          nclose(row.flexion!, 40 * phase, 1e-12),
        );
      }
    }
  }
  const synth = makeActorSynthesizer(contexts, nodes);
  for (const actions of [[locomote], [locomote, lookAt], [gesture]]) {
    const clip = compilePerformance(actions, synth).performances.hero!;
    const phase = end(clip, actions[0] === gesture ? 0.5 : 3.5).gaitPhase;
    if (actions[0] === gesture) {
      TestValidator.equals("gesture has no stride phase", phase, null);
      continue;
    }
    TestValidator.equals(
      "single carried clock",
      [clip.gaitCycle?.period, clip.gaitCycle?.phaseAt, phase],
      [1, 0, 0.5],
    );
    const knee = (motion: IAutoMovieMotion, t: number) =>
      sampleMotion(motion, t).pose.joints.find(
        (j) => j.bone === "leftUpperLeg",
      )!.flexion!;
    TestValidator.predicate(
      "same resumed leg",
      nclose(knee(clip, 3.5), knee(synth(locomote, "hero")!, phase!)),
    );
  }
}
