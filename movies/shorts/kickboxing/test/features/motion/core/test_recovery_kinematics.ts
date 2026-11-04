import type {
  AutoMovieHumanSkeleton,
  IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { prepareLabHuman } from "../../../../src/motion-lab/prepareLabHuman";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { MotionRecovery } from "../../../../src/motion/core/MotionRecovery";

/**
 * Preserve a real rigid lever during a ninety-degree clinical elbow return.
 *
 * Scenarios:
 * 1. Two actual LowerArm points retain their bone-local separation throughout return.
 * 2. Independent Cartesian interpolation demonstrably shortens that rotating lever.
 * 3. An unselected external task keeps its literal world path while the root moves.
 * 4. The exact stopped and next-phase endpoints retain owned geometry and anchors.
 *
 * @evidence contracts/testing.md#observable-behavior Uses the public prepared Human FK, two independent Three.js matrix point reads and original bone-local distances. It catches pointwise interpolation that disagrees with one clinical pose, including a moving root. No drawing, support solver, balance or browser acceptance is claimed.
 * @evidence contracts/testing.md#independent-cases The actual elbow changes from0 to90degrees; the bone-local100mm lever supplies its length independently of the recovery implementation. An external metre task and fixed world support anchor are never selected for FK. Reordered endpoints test identity rather than array-index selection; caller inputs remain detached.
 */
export function test_recovery_rigid_kinematics(): void {
  const input: ReturnType<typeof fixture> = fixture();
  const before: string = JSON.stringify([input.start, input.goal]);
  const a: MotionAction.Vec3 = input.start.effectors[0]!.target;
  const b: MotionAction.Vec3 = input.start.effectors[1]!.target;
  const goalA: MotionAction.Vec3 = input.goal.effectors.find(
    (point: MotionAction.Effector): boolean =>
      point.bone === "leftLowerArm" && point.localPoint === undefined,
  )!.target;
  const goalB: MotionAction.Vec3 = input.goal.effectors.find(
    (point: MotionAction.Effector): boolean =>
      point.bone === "leftLowerArm" && point.localPoint !== undefined,
  )!.target;
  const naive: number = new THREE.Vector3()
    .fromArray(b)
    .add(new THREE.Vector3(...goalB))
    .sub(new THREE.Vector3(...a))
    .sub(new THREE.Vector3(...goalA))
    .multiplyScalar(0.5)
    .length();
  assert.ok(
    naive < 0.099,
    "Pointwise endpoint chords must expose the rotating-lever defect",
  );

  for (const time of [7, 7.000001, 7.25, 7.5, 7.75, 7.999999, 8]) {
    const sample: MotionAction.Sample = MotionRecovery.local(
      input.start,
      input.goal,
      time,
      1,
      7,
      input.kinematics,
    );
    const internal: MotionAction.Effector[] = sample.effectors.filter(
      (point: MotionAction.Effector): boolean => point.bone === "leftLowerArm",
    );
    assert.ok(
      Math.abs(
        new THREE.Vector3(...internal[0]!.target).distanceTo(
          new THREE.Vector3(...internal[1]!.target),
        ) - 0.1,
      ) < 1e-10,
    );
    for (const effector of internal)
      assert.ok(
        new THREE.Vector3(...effector.target).distanceTo(
          new THREE.Vector3(
            ...point(
              input.evaluate(sample.pose),
              effector.bone,
              effector.localPoint,
            ),
          ),
        ) < 1e-10,
      );
    const external: MotionAction.Effector = sample.effectors.find(
      (effector: MotionAction.Effector): boolean =>
        effector.bone === "rightHand",
    )!;
    if (time === 7.5) {
      assert.ok(
        new THREE.Vector3(...external.target).distanceTo(
          new THREE.Vector3(9, 10, 11),
        ) < 1e-12,
      );
      assert.ok(
        new THREE.Vector3(...external.target)
          .add(new THREE.Vector3(...sample.rootOffset))
          .distanceTo(new THREE.Vector3(9.4, 10.1, 11)) < 1e-12,
      );
    }
    assert.deepEqual(sample.support.patches![0]!.world, [1, 0, 2]);
  }
  const stop: MotionAction.Sample = MotionRecovery.local(
    input.start,
    input.goal,
    7,
    1,
    7,
    input.kinematics,
  );
  const end: MotionAction.Sample = MotionRecovery.local(
    input.start,
    input.goal,
    8,
    1,
    7,
    input.kinematics,
  );
  assert.deepEqual(stop.effectors, input.start.effectors);
  assert.deepEqual(end.effectors, input.goal.effectors);
  assert.deepEqual(end.pose, input.goal.pose);
  stop.effectors[0]!.target[0] += 10;
  end.support.patches![0]!.world[0] += 10;
  assert.equal(JSON.stringify([input.start, input.goal]), before);
}

/**
 * Reject mistaken authority selection without changing a raw external objective.
 *
 * Scenarios:
 * 1. Missing and duplicate semantic identities refuse before sampling.
 * 2. Declaring a raw external task as clinical FK refuses endpoint disagreement.
 * 3. A duplicate endpoint cannot silently replace another point in the lookup.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the same public recovery boundary with real same-body FK and deliberate identity/authority mistakes. Explicit rejection protects external tasks from an array reorder or after-failure reassignment.
 * @evidence contracts/testing.md#independent-cases Independent malformed selectors vary radius, duplicate identity and wrong external authority while endpoints remain otherwise fixed. They do not replace a foreign evaluator or mock the solver.
 */
export function test_recovery_kinematic_identity(): void {
  const input: ReturnType<typeof fixture> = fixture();
  const selected: MotionRecovery.Kinematics["effectors"][number] =
    input.kinematics.effectors[0]!;
  assert.throws(
    (): MotionAction.Sample =>
      MotionRecovery.local(input.start, input.goal, 7.5, 1, 7, {
        ...input.kinematics,
        effectors: [{ ...selected, radius: 0.5 }],
      }),
    /identities/u,
  );
  assert.throws(
    (): MotionAction.Sample =>
      MotionRecovery.local(input.start, input.goal, 7.5, 1, 7, {
        ...input.kinematics,
        effectors: [selected, selected],
      }),
    /identities/u,
  );
  const external: MotionAction.Effector = input.start.effectors[2]!;
  assert.throws(
    (): MotionAction.Sample =>
      MotionRecovery.local(input.start, input.goal, 7.5, 1, 7, {
        ...input.kinematics,
        effectors: [external],
      }),
    /authored FK/u,
  );
  const duplicate: MotionAction.Sample = structuredClone(input.goal);
  duplicate.effectors[0] = structuredClone(duplicate.effectors[1]!);
  assert.throws(
    (): MotionAction.Sample =>
      MotionRecovery.local(input.start, duplicate, 7.5, 1, 7, input.kinematics),
    /identities/u,
  );
}

/**
 * Keep a receiver's local recovery independent from the original incoming clock.
 *
 * Scenarios:
 * 1. A foreign incoming timestamp remains unchanged while local release holds exact contact.
 * 2. Local and contact-wrapper returns agree when their clocks legitimately coincide.
 *
 * @evidence contracts/testing.md#observable-behavior Checks exact stopped samples at dwell release and identical endpoint consumers using real clinical FK. The explicit local seam avoids inventing a new incoming event timestamp.
 * @evidence contracts/testing.md#independent-cases A receiver contact at7seconds and a foreign event at100seconds are intentionally different clocks. The wrapper must reject that mismatch; the local method needs no copied or modified event to recover correctly.
 */
export function test_recovery_receiver_local_clock(): void {
  const input: ReturnType<typeof fixture> = fixture();
  const event: MotionAction.ContactEvent = {
    actionId: "incoming",
    actorId: "opponent",
    targetId: "receiver",
    time: 100,
    relation: "guard",
    point: [0, 1, 0],
    normal: [1, 0, 0],
  };
  const state: MotionAction.ContactState = { event, sample: input.start };
  assert.throws(
    (): MotionAction.Sample =>
      MotionRecovery.sample(state, input.goal, 7.5, 1, 7.1, input.kinematics),
    /timestamp/u,
  );
  const held: MotionAction.Sample = MotionRecovery.local(
    input.start,
    input.goal,
    7.05,
    1,
    7.1,
    input.kinematics,
  );
  assert.equal(held.phase, "contact");
  assert.deepEqual(held.effectors, input.start.effectors);
  assert.deepEqual(held.pose, input.start.pose);
  const matching: MotionAction.ContactState = {
    event: { ...event, time: 7 },
    sample: input.start,
  };
  assert.deepEqual(
    MotionRecovery.sample(matching, input.goal, 7.5, 1, 7.1, input.kinematics),
    MotionRecovery.local(
      input.start,
      input.goal,
      7.5,
      1,
      7.1,
      input.kinematics,
    ),
  );
  assert.equal(event.time, 100);
}

/**
 * Preserve a fixed rigid-root frame and refuse unsupported whole-body transitions.
 *
 * Scenarios:
 * 1. A nonidentity fixed orientation survives intermediate limb return without aliasing.
 * 2. Quaternion sign equivalence and omitted identity retain the same physical frame.
 * 3. Changing root orientation, malformed quaternions and contact/airborne supports refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Calls portable recovery with no FK or host. Original requested orientation and explicit foot kind remain observable, catching silent root or support-kind loss. This does not establish whole-body fall or physical support acceptance.
 * @evidence contracts/testing.md#independent-cases Literal ninety-degree quaternions, their negated representation and exact identity distinguish physical frame equivalence from a new orientation. Contacts and airborne branches must refuse at every endpoint or intermediate sample because this API owns limb return only.
 */
export function test_recovery_support_and_root_boundary(): void {
  const start: MotionAction.Sample = {
    pose: {},
    rootOffset: [0, 0, 0],
    rootRotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
    support: { kind: "feet", left: 0.5, right: 0.5 },
    effectors: [],
    phase: "contact",
    elapsed: 1,
    progress: 0,
  };
  const goal: MotionAction.Sample = {
    ...structuredClone(start),
    rootOffset: [0.1, 0, 0],
    elapsed: 2,
    phase: "complete",
    progress: 1,
  };
  const middle: MotionAction.Sample = MotionRecovery.local(
    start,
    goal,
    1.5,
    1,
    1,
  );
  assert.deepEqual(middle.rootRotation, start.rootRotation);
  assert.equal(middle.support.kind, "feet");
  middle.rootRotation![1] = 0;
  assert.equal(start.rootRotation![1], Math.SQRT1_2);
  const negative: MotionAction.Sample = {
    ...goal,
    rootRotation: [0, -Math.SQRT1_2, 0, -Math.SQRT1_2],
  };
  assert.deepEqual(
    MotionRecovery.local(start, negative, 1.5, 1, 1).rootRotation,
    start.rootRotation,
  );
  const identity: MotionAction.Sample = { ...start, rootRotation: undefined };
  assert.doesNotThrow(
    (): MotionAction.Sample =>
      MotionRecovery.local(
        identity,
        { ...goal, rootRotation: [0, 0, 0, 1] },
        1.5,
        1,
        1,
      ),
  );
  assert.throws(
    (): MotionAction.Sample =>
      MotionRecovery.local(
        start,
        { ...goal, rootRotation: [0, 0, 0, 1] },
        1.5,
        1,
        1,
      ),
    /same rigid root orientation/u,
  );
  assert.throws(
    (): MotionAction.Sample =>
      MotionRecovery.local(
        start,
        { ...goal, rootRotation: [0, 0, 0, 0] },
        1.5,
        1,
        1,
      ),
    /unit/u,
  );
  const supports: MotionAction.Support[] = [
    { kind: "airborne", left: 0, right: 0 },
    {
      kind: "contacts",
      left: 0,
      right: 0,
      contacts: [
        {
          id: "trunk",
          region: "trunk",
          bone: "chest",
          share: 1,
          localPoint: [0, 0, -0.1],
          world: [0, 0, 0],
          mode: "planted",
        },
      ],
    },
  ];
  for (const support of supports)
    for (const elapsed of [1, 1.5, 2]) {
      assert.throws(
        (): MotionAction.Sample =>
          MotionRecovery.local(
            { ...start, support },
            { ...goal, support },
            elapsed,
            1,
            1,
          ),
        /foot support/u,
      );
      assert.throws(
        (): MotionAction.Sample =>
          MotionRecovery.local(start, { ...goal, support }, elapsed, 1, 1),
        /foot support/u,
      );
    }
}

/** One cached actual anatomy supplies both endpoints; no actor or viewer state participates. */
function fixture(): {
  evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
  start: MotionAction.Sample;
  goal: MotionAction.Sample;
  kinematics: MotionRecovery.Kinematics;
} {
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator =
    prepareLabHuman().evaluate;
  const pose: IAutoMovieHumanPose = {
    arms: { left: { elbow: { flexion: 0 } }, right: {} },
  };
  const endPose: IAutoMovieHumanPose = {
    arms: { left: { elbow: { flexion: 90 } }, right: {} },
  };
  const output: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
  const endOutput: AutoMovieHumanSkeleton.IOutput = evaluate(endPose);
  const effectors: MotionAction.Effector[] = [
    undefined,
    [0, -0.1, 0] as MotionAction.Vec3,
  ].map(
    (localPoint: MotionAction.Vec3 | undefined): MotionAction.Effector => ({
      bone: "leftLowerArm",
      ...(localPoint ? { localPoint } : {}),
      target: point(output, "leftLowerArm", localPoint),
      role: "guide",
      constraint: "hard",
      radius: 0,
    }),
  );
  const start: MotionAction.Sample = {
    pose,
    rootOffset: [0.3, 0, 0.1],
    support: {
      left: 0.5,
      right: 0.5,
      patches: [
        {
          side: "left",
          bone: "leftFoot",
          localPoint: [0, 0, 0],
          world: [1, 0, 2],
          mode: "planted",
          constraint: "hard",
        },
      ],
    },
    effectors: [
      ...effectors,
      { bone: "rightHand", target: [8, 9, 10], role: "strike", radius: 0 },
    ],
    phase: "contact",
    elapsed: 7,
    progress: 0,
  };
  const endEffectors: MotionAction.Effector[] = [
    ...effectors.map(
      (effector: MotionAction.Effector): MotionAction.Effector => ({
        ...effector,
        target: point(endOutput, effector.bone, effector.localPoint),
      }),
    ),
    { bone: "rightHand", target: [10, 11, 12], role: "strike", radius: 0 },
  ];
  const goal: MotionAction.Sample = {
    ...structuredClone(start),
    pose: endPose,
    rootOffset: [0.5, 0.2, -0.1],
    effectors: endEffectors.reverse(),
    phase: "complete",
    elapsed: 8,
    progress: 1,
  };
  return {
    evaluate,
    start,
    goal,
    kinematics: {
      evaluatePose: evaluate,
      effectors: effectors.map(
        ({
          target: _target,
          ...identity
        }: MotionAction.Effector): MotionRecovery.Kinematics["effectors"][number] =>
          identity,
      ),
    },
  };
}

/** Independently transform actual placement/local coordinates with Three.js quaternion arithmetic. */
function point(
  output: AutoMovieHumanSkeleton.IOutput,
  bone: MotionAction.Effector["bone"],
  local: MotionAction.Vec3 = [0, 0, 0],
): MotionAction.Vec3 {
  const placement: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
    (item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === bone,
  )!;
  return new THREE.Vector3(...local)
    .applyQuaternion(new THREE.Quaternion(...placement.rotation))
    .add(new THREE.Vector3(...placement.position))
    .toArray();
}
