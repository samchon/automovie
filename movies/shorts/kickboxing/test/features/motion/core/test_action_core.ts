import assert from "node:assert/strict";
import { ActionClock } from "../../../../src/motion/core/ActionClock";
import { ActionVariation } from "../../../../src/motion/core/ActionVariation";
import { MotionRecovery } from "../../../../src/motion/core/MotionRecovery";
import { MotionAction } from "../../../../src/motion/core/MotionAction";

/**
 * Pin local timing, conservative interception, deterministic bounds and retained return poses.
 *
 * Scenarios:
 * 1. Every phase boundary, zero-duration optional phase and intercepted delivery uses seconds.
 * 2. Equal seeds replay independently of call order; variation obeys declared bounds.
 * 3. Recovery starts at the constrained sample, preserves actual anchors and ends at guard.
 * 4. Unit rigid frames interpolate through public Engine slerp without changing their centre.
 * 5. Return endpoints retain explicit constraint priority and authored clinical channels.
 * 6. Unloaded hard moving frames remain distinct from actual retained ground support.
 *
 * @evidence contracts/testing.md#observable-behavior Public phase, variation and retained-recovery outputs expose wrong boundaries, future-contact path changes, seek-order randomness and return-to-planned-peak defects. This is portable arithmetic verification, not a browser or physical-support test.
 * @evidence contracts/testing.md#independent-cases Hand-calculated schedules, caller bounds and authored contact/guard coordinates supply expectations. Same-pivot 60/30/0-degree yaw and analytic same-axis/noncommuting unit-quaternion midpoints check rigid interpolation. An above-floor hard free path remains unloaded; soft retained supports, malformed priorities and changing effective return priority refuse. Left/right rotations, changed/duplicate/unregistered authored channels, incompatible effectors and replaced anchors cover additional boundaries. The real lab owns current-FK surface measurement and independent postsolve support/technique checks.
 */
export function test_action_core(): void {
  const errors: unknown[] = [];
  for (const test of [testClock, testVariation, testRecovery, testSupportFrames, testSupportPriority]) {
    try { test(); } catch (error: unknown) { errors.push(new Error(test.name, { cause: error })); }
  }
  if (errors.length) throw new AggregateError(errors, "Action core unit contracts failed");
}

/** Hand-calculated phase boundaries and causal interruption own the clock contract. */
function testClock(): void {
  const timing: MotionAction.Timing = { preparation: 1, delivery: 2, contact: .5, retraction: 3, recovery: 1.5 };
  const cases: [number, MotionAction.Phase][] = [[-1, "idle"], [0, "preparation"], [1, "delivery"], [3, "contact"], [3.5, "retraction"], [6.5, "recovery"], [8, "complete"], [9, "complete"]];
  for (const [time, phase] of cases) assert.equal(ActionClock.sample(timing, time).phase, phase);
  assert.equal(ActionClock.duration(timing), 8);
  assert.equal(ActionClock.sample(timing, 2).weight, .5);
  assert.equal(ActionClock.sample(timing, 5).weight, .5);
  const interrupted: [number, MotionAction.Phase][] = [[2, "contact"], [2.5, "retraction"], [5.5, "recovery"], [7, "complete"]];
  for (const [time, phase] of interrupted) assert.equal(ActionClock.sample(timing, time, 2).phase, phase);
  assert.equal(ActionClock.sample(timing, 3, 2).duration, 7);
  assert.deepEqual(ActionClock.sample(timing, 1.5, 2), { ...ActionClock.sample(timing, 1.5), duration: 7 });
  assert.equal(ActionClock.sample(timing, 2.5, 2).weight, 1);
  assert.equal(ActionClock.sample({ preparation: 0, delivery: 1, contact: 0, retraction: 1, recovery: 0 }, 0).phase, "delivery");
  assert.equal(ActionClock.sample({ preparation: 0, delivery: 1, contact: 0, retraction: 1, recovery: 0 }, 1).phase, "retraction");
  assert.equal(ActionClock.ease(-1), 0);
  assert.equal(ActionClock.ease(2), 1);
  assert.throws((): ActionClock.State => ActionClock.sample(timing, NaN));
  assert.throws((): ActionClock.State => ActionClock.sample(timing, 2, .99));
  assert.throws((): ActionClock.State => ActionClock.sample(timing, 2, 3.01));
  assert.throws((): number => ActionClock.duration({ ...timing, delivery: 0 }));
  assert.throws((): number => ActionClock.duration({ ...timing, retraction: -1 }));
  assert.throws((): number => ActionClock.duration({ ...timing, contact: Infinity }));
}

/** Caller-declared Euclidean, duration and articulation bounds own variation expectations. */
function testVariation(): void {
  const timing: MotionAction.Timing = { preparation: 1, delivery: 2, contact: .5, retraction: 3, recovery: 1.5 };
  const request: MotionAction.Request = { id: "one", actorId: "red", targetId: "blue", side: "left", leadSide: "left", direction: [1, 0, 0], timing, variation: { seed: 0, timingFraction: .2, aimMetres: .03, amplitudeFraction: .1 } };
  const first: ActionVariation.Result = ActionVariation.create(request);
  ActionVariation.create({ ...request, variation: { ...request.variation!, seed: 99 } });
  assert.deepEqual(ActionVariation.create(request), first);
  assert.deepEqual(ActionVariation.sample(request.variation).aimOffset, first.aimOffset);
  assert.deepEqual(ActionVariation.create({ ...request, id: "two", actorId: "blue", targetId: "red", side: "right" }), first);
  assert.notDeepEqual(ActionVariation.create({ ...request, variation: { ...request.variation!, seed: 1 } }), first);
  for (const seed of [0, 1, 12, 0xffffffff]) {
    const result: ActionVariation.Result = ActionVariation.create({ ...request, variation: { ...request.variation!, seed } });
    const ratio: number = result.timing.delivery / timing.delivery;
    assert.ok(ratio >= .8 && ratio <= 1.2);
    assert.ok(Math.abs(result.timing.retraction / timing.retraction - ratio) < 1e-12);
    assert.ok(Math.hypot(...result.aimOffset) <= .03 + 1e-12);
    assert.ok(result.amplitude >= .9 && result.amplitude <= 1.1);
  }
  assert.deepEqual(ActionVariation.create({ ...request, variation: undefined }), { timing, aimOffset: [0, 0, 0], amplitude: 1 });
  assert.throws((): ActionVariation.Result => ActionVariation.create({ ...request, direction: [0, 0, 0] }));
  assert.throws((): ActionVariation.Result => ActionVariation.create({ ...request, direction: [Number.MAX_VALUE, Number.MAX_VALUE, 0] }));
  assert.throws((): ActionVariation.Result => ActionVariation.create({ ...request, targetId: request.actorId }));
  assert.throws((): ActionVariation.Result => ActionVariation.create({ ...request, variation: { ...request.variation!, timingFraction: 1 } }));
  assert.throws((): ActionVariation.Result => ActionVariation.create({ ...request, variation: { ...request.variation!, seed: -1 } }));
}

/** Independently authored actual contact and guard endpoints own the return expectation. */
function testRecovery(): void {
  const start: MotionAction.Sample = { pose: { arms: { left: { elbow: { flexion: 90 } }, right: {} } }, rootOffset: [-1, 0, 1], support: { left: .8, right: .2, patches: [{ side: "right", bone: "rightFoot", localPoint: [0, -.05, 0], world: [0, 0, 0], mode: "planted" }] }, effectors: [{ bone: "leftHand", localPoint: [.1, 0, 0], target: [1, 1, 0], role: "strike", radius: .1 }], phase: "delivery", elapsed: 2, progress: .5 };
  const goal: MotionAction.Sample = { pose: { arms: { left: { elbow: { flexion: 30 } }, right: {} } }, rootOffset: [1, 2, 3], support: { left: .2, right: .8, patches: structuredClone(start.support.patches) }, effectors: [{ bone: "leftHand", localPoint: [.1, 0, 0], target: [0, 1, 1], role: "strike", radius: .1 }], phase: "complete", elapsed: 3, progress: 1 };
  const state: MotionAction.ContactState = { event: { actionId: "one", actorId: "red", targetId: "blue", time: 2, relation: "guard", point: [1, 1, 0], normal: [-1, 0, 0] }, sample: start };
  const begin: MotionAction.Sample = MotionRecovery.sample(state, goal, 2, 1);
  assert.deepEqual(begin.pose, start.pose);
  assert.deepEqual(begin.effectors, start.effectors);
  assert.deepEqual(begin.support, start.support);
  const middle: MotionAction.Sample = MotionRecovery.sample(state, goal, 2.5, 1);
  assert.ok(Math.abs(middle.pose.arms!.left.elbow!.flexion! - 60) < 1e-10);
  assert.deepEqual(middle.rootOffset, [0, 1, 2]);
  assert.deepEqual(middle.effectors[0]!.target, [.5, 1, .5]);
  assert.deepEqual(middle.support.patches, start.support.patches);
  assert.ok(Math.abs(middle.support.left - .5) < 1e-12);
  const end: MotionAction.Sample = MotionRecovery.sample(state, goal, 3, 1);
  assert.deepEqual(end.pose, goal.pose);
  assert.deepEqual(end.effectors, goal.effectors);
  assert.deepEqual(end.support, goal.support);
  begin.effectors[0]!.target[0] = 999;
  assert.equal(start.effectors[0]!.target[0], 1);
  assert.equal(MotionRecovery.sample(state, goal, 2.1, 1, 2.2).phase, "contact");
  const pivotStart: MotionAction.ContactState = structuredClone(state);
  pivotStart.sample.support.patches![0]!.mode = "pivot";
  pivotStart.sample.support.patches![0]!.yawDegrees = 60;
  const pivotGoal: MotionAction.Sample = { ...structuredClone(goal), support: structuredClone(pivotStart.sample.support) };
  pivotGoal.support.patches![0]!.yawDegrees = 0;
  assert.equal(MotionRecovery.sample(pivotStart, pivotGoal, 2, 1).support.patches![0]!.yawDegrees, 60);
  assert.ok(Math.abs(MotionRecovery.sample(pivotStart, pivotGoal, 2.5, 1).support.patches![0]!.yawDegrees! - 30) < 1e-12);
  assert.equal(MotionRecovery.sample(pivotStart, pivotGoal, 3, 1).support.patches![0]!.yawDegrees, 0);
  assert.deepEqual(MotionRecovery.sample(pivotStart, pivotGoal, 2.5, 1).support.patches![0]!.world, pivotStart.sample.support.patches![0]!.world);
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, goal, 2, 0));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, goal, 1.99, 1));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, { ...goal, effectors: [] }, 2, 1));
  const changedAnchor: MotionAction.Sample = structuredClone(goal);
  changedAnchor.support.patches![0]!.world[0] += .01;
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, changedAnchor, 3, 1));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, { ...goal, support: { left: .2, right: .8 } }, 3, 1));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample({ ...state, sample: { ...start, elapsed: 1.99 } }, goal, 2, 1));
  const shaped: MotionAction.ContactState = structuredClone(state);
  shaped.sample.preservedChannels = ["arms.left.elbow.flexion", "arms.left.wrist.flexion"];
  shaped.sample.effectors[0]!.constraint = "soft";
  const shapedGoal: MotionAction.Sample = structuredClone(goal);
  shapedGoal.preservedChannels = ["arms.left.wrist.flexion", "arms.left.elbow.flexion"];
  shapedGoal.effectors[0]!.constraint = "soft";
  const shapedMiddle: MotionAction.Sample = MotionRecovery.sample(shaped, shapedGoal, 2.5, 1);
  assert.deepEqual(shapedMiddle.preservedChannels, shaped.sample.preservedChannels);
  assert.equal(shapedMiddle.effectors[0]!.constraint, "soft");
  (shapedMiddle.preservedChannels as string[])[0] = "legs.left.knee.flexion";
  assert.equal(shaped.sample.preservedChannels[0], "arms.left.elbow.flexion");
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(shaped, { ...shapedGoal, preservedChannels: [] }, 2.5, 1));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(shaped, { ...shapedGoal, preservedChannels: ["arms.left.elbow.flexion", "arms.left.elbow.flexion"] }, 2.5, 1));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(shaped, { ...shapedGoal, effectors: [{ ...shapedGoal.effectors[0]!, constraint: "hard" }] }, 2.5, 1));
  const unregistered: MotionAction.ContactState = structuredClone(shaped);
  unregistered.sample.preservedChannels = ["head.jaw.opening" as never];
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(unregistered, { ...shapedGoal, preservedChannels: unregistered.sample.preservedChannels }, 2.5, 1));
}

/** Analytic quaternion midpoint identities distinguish rigid slerp from separate Euler blends. */
function testSupportFrames(): void {
  const half: number = Math.SQRT1_2;
  const start: MotionAction.Sample = { pose: {}, rootOffset: [0, 0, 0], support: { left: .5, right: .5 }, effectors: [], phase: "contact", elapsed: 0, progress: 0 };
  const event: MotionAction.ContactEvent = { actionId: "frame", actorId: "red", targetId: "blue", time: 0, relation: "guard", point: [0, 1, 0], normal: [-1, 0, 0] };
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const patch: MotionAction.SupportPatch = { side, bone: side === "left" ? "leftFoot" : "rightFoot", localPoint: [.1, -.05, 0], world: [1, 0, 2], initialWorld: [1, .025, 2], mode: "pivot", frameRotation: [0, 0, sign * half, half] };
    MotionAction.validateSupportFrame(patch);
    const source: MotionAction.Sample = { ...structuredClone(start), support: { ...start.support, patches: [patch] } };
    const goal: MotionAction.Sample = structuredClone(source);
    goal.support.patches![0]!.frameRotation = [0, 0, 0, 1];
    const state: MotionAction.ContactState = { event, sample: source };
    const middle: MotionAction.SupportPatch = MotionRecovery.sample(state, goal, .5, 1).support.patches![0]!;
    assert.ok(Math.abs(middle.frameRotation![2] - sign * Math.sin(Math.PI / 8)) < 1e-12);
    assert.ok(Math.abs(middle.frameRotation![3] - Math.cos(Math.PI / 8)) < 1e-12);
    assert.ok(Math.abs(Math.hypot(...middle.frameRotation!) - 1) < 1e-12);
    assert.deepEqual(middle.world, patch.world);
    assert.deepEqual(middle.initialWorld, patch.initialWorld);
    assert.deepEqual(middle.localPoint, patch.localPoint);
    assert.deepEqual(MotionRecovery.sample(state, goal, 0, 1).support.patches![0]!.frameRotation, patch.frameRotation);
    assert.deepEqual(MotionRecovery.sample(state, goal, 1, 1).support.patches![0]!.frameRotation, [0, 0, 0, 1]);
  }
  const source: MotionAction.Sample = { ...structuredClone(start), support: { left: .5, right: .5, patches: [{ side: "left", bone: "leftFoot", localPoint: [0, 0, 0], world: [0, 0, 0], mode: "pivot", frameRotation: [half, 0, 0, half] }] } };
  const goal: MotionAction.Sample = structuredClone(source);
  goal.support.patches![0]!.frameRotation = [0, half, 0, half];
  const state: MotionAction.ContactState = { event, sample: source };
  const result: [number, number, number, number] = MotionRecovery.sample(state, goal, .5, 1).support.patches![0]!.frameRotation!;
  assert.ok(Math.abs(result[0] - 1 / Math.sqrt(6)) < 1e-12);
  assert.ok(Math.abs(result[1] - 1 / Math.sqrt(6)) < 1e-12);
  assert.ok(Math.abs(result[2]) < 1e-12);
  assert.ok(Math.abs(result[3] - Math.sqrt(2 / 3)) < 1e-12);
  const patch: MotionAction.SupportPatch = source.support.patches![0]!;
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, frameRotation: [0, 0, 0, 0] }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, frameRotation: [1, 1, 0, 0] }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, frameRotation: [NaN, 0, 0, 1] }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, yawDegrees: 0 }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, world: [0, Infinity, 0] }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, initialWorld: [0, NaN, 0] }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, world: new Array<number>(3) as MotionAction.Vec3 }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...patch, frameRotation: new Array<number>(4) as [number, number, number, number] }));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, { ...goal, support: { left: .5, right: .5, patches: [{ ...patch, frameRotation: undefined }] } }, 1, 1));
}

/** Priority is independent of ground-support role; return cannot silently change it. */
function testSupportPriority(): void {
  const unloaded: MotionAction.SupportPatch = { side: "left", bone: "leftMidfoot", localPoint: [.1, -.04, 0], world: [1, .03, 2], mode: "free", frameRotation: [0, 0, 0, 1] };
  assert.equal(MotionAction.supportConstraint(unloaded), "soft");
  const moving: MotionAction.SupportPatch = { ...unloaded, constraint: "hard" };
  MotionAction.validateSupportFrame(moving);
  assert.equal(MotionAction.supportConstraint(moving), "hard");
  assert.equal(moving.mode, "free");
  assert.equal(moving.world[1], .03);
  assert.equal(MotionAction.supportConstraint({ ...moving, mode: "pivot", world: [1, 0, 2] }), "hard");
  assert.equal(MotionAction.supportConstraint({ ...unloaded, mode: "planted" }), "hard");
  assert.throws((): void => MotionAction.validateSupportFrame({ ...moving, mode: "planted", constraint: "soft" }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...moving, mode: "pivot", constraint: "soft" }));
  assert.throws((): void => MotionAction.validateSupportFrame({ ...moving, constraint: "weighted" as never }));
  const start: MotionAction.Sample = { pose: {}, rootOffset: [0, 0, 0], support: { left: 0, right: 1, patches: [moving] }, effectors: [], phase: "contact", elapsed: 1, progress: 0 };
  const state: MotionAction.ContactState = { event: { actionId: "priority", actorId: "red", targetId: "blue", time: 1, relation: "guard", point: [0, 1, 0], normal: [-1, 0, 0] }, sample: start };
  const goal: MotionAction.Sample = structuredClone(start);
  goal.support.patches![0]!.frameRotation = [0, Math.sin(Math.PI / 8), 0, Math.cos(Math.PI / 8)];
  const middle: MotionAction.Sample = MotionRecovery.sample(state, goal, 1.5, 1);
  assert.equal(middle.support.patches![0]!.mode, "free");
  assert.equal(MotionAction.supportConstraint(middle.support.patches![0]!), "hard");
  assert.deepEqual(middle.support.patches![0]!.world, moving.world);
  assert.equal(middle.support.left, 0);
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, { ...goal, support: { ...goal.support, patches: [{ ...moving, constraint: "soft" }] } }, 1.5, 1));
  assert.throws((): MotionAction.Sample => MotionRecovery.sample(state, { ...goal, support: { ...goal.support, patches: [{ ...moving, constraint: undefined }] } }, 1.5, 1));
}
