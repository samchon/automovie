import {
  Quaternion,
  compilePerformance,
  makeActorSynthesizer,
  resolveActorWorldFrame,
  sampleMotion,
} from "@automovie/engine";
import type {
  IAutoMovieActionCall,
  IAutoMovieActorContext,
  IAutoMovieMotion,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  IDENTITY_TRANSFORM,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../internal/fixtures";
import { nclose } from "../internal/nclose";
import { throwsError, vclose } from "../internal/predicates";

/**
 * A change of gait period keeps the previous normalized phase.
 *
 * Scenarios:
 *
 * 1. The 0.6175 s mark in a 0.95 s walk resumes at 0.312 s in a 0.48 s sprint,
 *    still through the second half of the stride.
 * 2. A legacy context without a source period keeps its seconds.
 */
export function test_perform_motion_actor_context_gait_period(): void {
  const context: IAutoMovieActorContext = {
    skeleton: "rig",
    gaits: [
      {
        name: "sprint",
        period: 0.48,
        limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.25, amplitude: 25 }],
      },
    ],
    position: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    speed: 4,
    eyeHeight: 1.6,
    restPose: makePose([]),
    gaitPhase: 0.6175,
  };
  const call: IAutoMovieActionCall = {
    verb: "locomote",
    actor: "runner",
    gait: "sprint",
    start: 0,
    duration: "auto",
    to: { kind: "node", node: "unplaced" },
  };
  const resume = (given: IAutoMovieActorContext): IAutoMovieMotion =>
    makeActorSynthesizer(new Map([["runner", given]]), new Map())(
      call,
      "runner",
    )!;
  TestValidator.predicate(
    "walk phase maps to the same normalized sprint phase",
    nclose(
      resume({ ...context, gaitPeriod: 0.95 }).gaitCycle!.phaseAt,
      0.312,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "older synthesis contexts retain their meaning",
    nclose(resume(context).gaitCycle!.phaseAt, 0.1375, 1e-12),
  );
}

/**
 * Actor-local synthesis resolves its gait, target and live frame before
 * compiling owned channels.
 *
 * Scenarios:
 *
 * 1. Two distinct rigs share a gaze and face instruction, with travel assigned to
 *    only one.
 * 2. Delayed gaze reads the moving observer. A rigidly moved preliminary root
 *    carries its staged heading.
 * 3. A missing actor or gait omits the clip; duplicate gait names refuse lookup.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Examines generated channels, world frame and gaze.
 * @evidence contracts/development/testing.md#independent-expectations Five metres at unit speed gives five seconds, and a quarter turn transforms local Z to world X.
 * @evidence contracts/development/testing.md#distinguishing-cases Actor-only travel, two gaze frames and missing or duplicate gaits separate ownership.
 * @evidence contracts/development/testing.md#execution-ownership Compiles two small actor records.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the timing and coordinate observations.
 */
export function test_perform_motion_actor_context(): void {
  const rig: IAutoMovieActorContext = {
    skeleton: "first",
    gaits: [
      {
        name: "walk",
        period: 1,
        limbs: [{ bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 25 }],
      },
    ],
    position: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    speed: 1,
    eyeHeight: 1.6,
    restPose: makePose([joint("spine", { flexion: 0 })]),
  };
  const other = {
    ...rig,
    skeleton: "second",
    position: { x: 0, y: 0, z: 5 },
    facingDeg: 180,
  };
  const actors = new Map([
      ["walker", rig],
      ["reader", other],
    ]),
    nodes = new Map([
      ["reader", other.position],
      ["walker", rig.position],
    ]);
  const make = makeActorSynthesizer(actors, nodes);
  const to = { kind: "node", node: "reader" } as const;
  const walk: IAutoMovieActionCall = {
    verb: "locomote",
    gait: "walk",
    to,
    actor: "walker",
    start: 0,
    duration: "auto",
  };
  const look: IAutoMovieActionCall = {
    verb: "lookAt",
    to,
    actor: "walker",
    start: 0,
    duration: 5,
  };
  const face: IAutoMovieActionCall = {
    verb: "emote",
    preset: "happy",
    intensity: 0.9,
    actor: ["walker", "reader"],
    start: 0,
    duration: 5,
  };
  const records = compilePerformance(
    [
      walk,
      look,
      { ...look, actor: "reader", to: { kind: "node", node: "walker" } },
      face,
    ],
    make,
  ).performances;
  for (const [name, travels] of [
    ["walker", true],
    ["reader", false],
  ] as const) {
    const clip = records[name]!;
    const bones = clip.keyframes.flatMap((k) =>
      k.pose.joints.map((j) => j.bone),
    );
    TestValidator.equals(
      "owns travel",
      bones.includes("leftUpperLeg"),
      travels,
    );
    TestValidator.predicate(
      "owns gaze and face",
      bones.includes("head") &&
        clip.keyframes.some((k) => k.expression?.preset === "happy"),
    );
    TestValidator.equals("authored duration", clip.duration, 5);
  }
  TestValidator.equals(
    "absent actor and missing gait",
    [make(walk, "absent"), make({ ...walk, gait: "run" }, "walker")],
    [null, null],
  );
  TestValidator.predicate(
    "ambiguous gait name",
    throwsError(() =>
      makeActorSynthesizer(
        new Map([["walker", { ...rig, gaits: [...rig.gaits, ...rig.gaits] }]]),
        nodes,
      )(walk, "walker"),
    ),
  );
  const root = {
    ...IDENTITY_TRANSFORM,
    translation: { x: 0, y: 0, z: 1 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 45),
  };
  const motion = makeMotion(
    [keyframe(0, makePose([], root)), keyframe(1, makePose([], root))],
    1,
  );
  const frame = resolveActorWorldFrame(
    { ...rig, position: { x: 1, y: 0, z: 2 }, facingDeg: 90 },
    motion,
    1,
  )!;
  TestValidator.predicate(
    "world position and facing compose",
    vclose(frame.position, { x: 2, y: 0, z: 2 }, 1e-9) &&
      Math.abs(frame.facingDeg - 135) <= 1e-9,
  );
  TestValidator.equals(
    "no preliminary frame",
    resolveActorWorldFrame(rig, undefined, 0),
    null,
  );
  const moving = makeActorSynthesizer(
    actors,
    nodes,
    undefined,
    (_actor, time) => ({
      position: { x: time, y: 0, z: 0 },
      rotation: Quaternion.identity(),
      facingDeg: 0,
    }),
  );
  const off = (time: number) =>
    sampleMotion(moving(look, "walker")!, time).pose.joints.find(
      (j) => j.bone === "head",
    )!.twist ?? 0;
  TestValidator.predicate(
    "changing observer changes gaze",
    Math.abs(off(4) - off(0)) > 1,
  );
}
