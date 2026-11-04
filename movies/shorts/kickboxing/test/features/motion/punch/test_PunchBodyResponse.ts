import assert from "node:assert/strict";
import { AutoMovieHumanSkeleton, AutoMovieHumanRigControls, type IAutoMovieHumanPose } from "@automovie/human";
import { Quaternion } from "@automovie/engine";
import { createPersonParameters } from "../../../../src/createPersonParameters";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { PunchAction } from "../../../../src/motion/punch/PunchAction";

/**
 * Compose observed normal response before fitting without moving the stopped WORLD task.
 *
 * Scenarios:
 * 1. Both sides consume identical actor-local displacement in body planning and arm return.
 * 2. Dwell retains its original actor-frame pad; released clinical return follows the realized body.
 * 3. A mismatched response, changed trunk, replaced anchor or foreign event refuses.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real punch owner with public Human FK and an explicitly authored coherent contact fixture. It verifies source/consumer response agreement, original dwell targets and released same-pose FK, preserving input ownership. The fixture does not claim native collision or support admission.
 * @evidence contracts/testing.md#independent-cases Literal displacement and event clocks supply independent root and dwell expectations. Independent public FK supplies the clinical return oracle. A permitted leg/rootY fixture isolates support authority from fixed trunk/rootXZ; actual native feasibility remains the real actor consumer's responsibility.
 */
export function test_punch_body_response_composition(): void {
  for (const side of ["left", "right"] as const) {
    const { action, context }: ReturnType<typeof fixture> = fixture(side);
    const before: string = JSON.stringify(context);
    const response: MotionAction.Vec3 = [-.007, 0, .002];
    const time: number = .21;
    const nominal: MotionAction.BodyPlacement = action.planBody(time, context);
    const planned: MotionAction.BodyPlacement = action.planBody(time, context, response);
    point(planned.rootOffset, nominal.rootOffset.map((value: number, index: number): number => value + response[index]!) as MotionAction.Vec3);
    const dwell: PunchAction.Sample = action.sample(time, context, planned, undefined, response);
    point(actorPoint(dwell), actorPoint(context.contact!.sample));
    assert.deepEqual(dwell.support, context.contact!.sample.support);
    const releasedTime: number = .4;
    const releasedPlan: MotionAction.BodyPlacement = action.planBody(releasedTime, context, response);
    const fitted: MotionAction.BodyPlacement = { ...structuredClone(releasedPlan), rootOffset: [releasedPlan.rootOffset[0], releasedPlan.rootOffset[1] + .001, releasedPlan.rootOffset[2]], pose: { ...structuredClone(releasedPlan.pose), legs: { left: { knee: { flexion: 18 } }, right: { knee: { flexion: 19 } } } } };
    const released: PunchAction.Sample = action.sample(releasedTime, context, fitted, undefined, response);
    point(released.effectors[0]!.target, fk(context, released.pose, released.effectors[0]!));
    point(released.rootOffset, fitted.rootOffset);
    assert.deepEqual(released.pose.legs, fitted.pose.legs);
    assert.throws((): unknown => action.sample(time, context, nominal, undefined, response), /authored root heading/u);
    assert.throws((): unknown => action.sample(time, context, { ...planned, pose: { ...structuredClone(planned.pose), pelvis: { rotation: 33 } } }, undefined, response), /authored root heading/u);
    const foreignAnchor: MotionAction.Support = structuredClone(planned.support) as MotionAction.Support;
    foreignAnchor.patches![0]!.world[0] += .01;
    assert.throws((): unknown => action.sample(time, context, { ...planned, support: foreignAnchor }, undefined, response), /original support/u);
    assert.throws((): unknown => action.planBody(time, { ...context, contact: undefined }, response), /observed contact branch/u);
    assert.throws((): unknown => action.planBody(time, context, [NaN, 0, 0]), /finite actor-local/u);
    const foreign: MotionAction.ContactState = structuredClone(context.contact!);
    foreign.event.actorId = "unrelated";
    assert.throws((): unknown => action.planBody(time, { ...context, contact: foreign }, response), /participants/u);
    const supports:MotionAction.Support[]=[{kind:"airborne",left:0,right:0},{kind:"contacts",left:0,right:0,contacts:[]}];
    for (const support of supports) {
      const unsupported:MotionAction.ContactState=structuredClone(context.contact!);
      unsupported.sample.support=structuredClone(support);
      assert.throws(():unknown=>action.planBody(time,{...context,contact:unsupported}),/requires foot support/u);
    }
    response[0] = 9;
    assert.equal(JSON.stringify(context), before);
    assert.equal(planned.rootOffset[0], nominal.rootOffset[0] - .007);
  }
}

/**
 * A continuing strike must retain its once-varied original external endpoint.
 *
 * Scenarios:
 * 1. A nonzero fixed aim belongs to the original source request.
 * 2. Wrong terminals refuse before or after the join, independently of seek order.
 * 3. The exact original varied goal is detached; early and moving-terminal joins refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Exercises the real source-only body/terminal admission with a fixed public Human context and explicit two-channel entry. It catches either dropping the source aim or adding it twice without using achieved arm FK as a replacement goal.
 * @evidence contracts/testing.md#independent-cases The declared target plus the original instance's fixed aim is the composition oracle; variation generation is owned by ActionVariation tests. Wrong and exact terminals distinguish external-goal identity from current pose, with no physical admission claim.
 */
export function test_punch_original_varied_terminal(): void {
  const context: MotionAction.Context = { ...fixture("left").context, contact: undefined, frame: { origin: [0, 0, 0], yawRadians: 0 } };
  const request: MotionAction.Request = { id: "varied-terminal", actorId: "a", targetId: "b", side: "left", leadSide: "left", direction: [1, 0, 0], timing: { preparation: .1, delivery: .2, contact: .04, retraction: .3, recovery: .1 }, variation: { seed: 17, aimMetres: .01, amplitudeFraction: 0, timingFraction: 0 } };
  const original: PunchAction.Instance = PunchAction.create("jab", request);
  assert.ok(Math.hypot(...original.aimOffset) > 0);
  const end: number = original.timing.preparation + original.timing.delivery;
  const entry: PunchAction.Continuation = { arm: structuredClone(context.basePose.arms!.left), rates: [{ channel: AutoMovieHumanRigControls.channel("arms.left.shoulder.flexion"), degreesPerSecond: 0 }, { channel: AutoMovieHumanRigControls.channel("arms.left.elbow.flexion"), degreesPerSecond: 0 }], from: { pointWorld: [...context.geometry.hand!], velocityWorld: [0, 0, 0] }, terminal: { pointWorld: [...context.target], velocityWorld: [0, 0, 0] }, endSeconds: end, provenance: { time: 0, h: .001, h2: .0005, oneSided: "before", branch: "free", velocityError: 0 } };
  const wrong: PunchAction.Instance = PunchAction.create("jab", request, entry);
  for (const time of [end + .00001, end - .00001, 0, end]) assert.throws((): unknown => wrong.planBody(time, context), /unchanged original WORLD task/u);
  entry.terminal.pointWorld = context.target.map((value: number, index: number): number => value + original.aimOffset[index]!) as MotionAction.Vec3;
  const correct: PunchAction.Instance = PunchAction.create("jab", request, entry);
  for (const time of [end + .00001, 0, end - .00001, end]) assert.doesNotThrow((): unknown => correct.planBody(time, context));
  assert.throws((): unknown => PunchAction.create("jab", request, { ...entry, endSeconds: end / 2 }), /delivery boundary/u);
  assert.throws((): unknown => PunchAction.create("jab", request, { ...entry, terminal: { ...entry.terminal, velocityWorld: [.1, 0, 0] } }), /zero terminal WORLD velocity/u);
  const at: MotionAction.Vec3 = actorPoint(correct.sample(end, context, correct.planBody(end, context)));
  point(at, entry.terminal.pointWorld);
  for (const h of [.000001, .0000005]) {
    const before: MotionAction.Vec3 = actorPoint(correct.sample(end - h, context, correct.planBody(end - h, context)));
    const after: MotionAction.Vec3 = actorPoint(correct.sample(end + h, context, correct.planBody(end + h, context)));
    assert.ok(Math.hypot(...at.map((value: number, index: number): number => (value - before[index]!) / h)) < .001);
    assert.ok(Math.hypot(...after.map((value: number, index: number): number => (value - at[index]!) / h)) < .001);
  }
  entry.terminal.pointWorld[0] += .1;
  assert.doesNotThrow((): unknown => correct.planBody(end, context));
}

/** Reuse the fixed public body evaluator without sharing mutable pose or contact fixtures. */
let evaluate: AutoMovieHumanSkeleton.PoseEvaluator | undefined;

/** An explicitly synthetic same-body stop isolates body-response composition from collision finding. */
function fixture(side: MotionAction.Side): { action: PunchAction.Instance; context: MotionAction.Context } {
  evaluate ??= AutoMovieHumanSkeleton.prepare(createPersonParameters(1800, true));
  const basePose: IAutoMovieHumanPose = { arms: { left: { shoulder: { flexion: 20 }, elbow: { flexion: 115 } }, right: { shoulder: { flexion: 20 }, elbow: { flexion: 115 } } } };
  const neutral: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const posed: AutoMovieHumanSkeleton.IOutput = evaluate(basePose);
  const joint: (source: AutoMovieHumanSkeleton.IOutput, bone: string) => AutoMovieHumanSkeleton.IPlacement = (source: AutoMovieHumanSkeleton.IOutput, bone: string): AutoMovieHumanSkeleton.IPlacement => source.posed.find((row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone)!;
  const upper: MotionAction.Vec3 = joint(neutral, `${side}UpperArm`).position;
  const elbow: MotionAction.Vec3 = joint(neutral, `${side}LowerArm`).position;
  const wrist: MotionAction.Vec3 = joint(neutral, `${side}Hand`).position;
  const length: (a: MotionAction.Vec3, b: MotionAction.Vec3) => number = (a: MotionAction.Vec3, b: MotionAction.Vec3): number => Math.hypot(...a.map((value: number, index: number): number => value - b[index]!));
  const shoulder: MotionAction.Vec3 = joint(posed, `${side}UpperArm`).position;
  const rotation: [number, number, number, number] = joint(neutral, `${side}Hand`).rotation;
  const inverse: { x: number; y: number; z: number; w: number } = Quaternion.inverse({ x: rotation[0], y: rotation[1], z: rotation[2], w: rotation[3] });
  const direction: { x: number; y: number; z: number } = Quaternion.rotateVector(inverse, { x: (wrist[0] - elbow[0]) * .08 / length(elbow, wrist), y: (wrist[1] - elbow[1]) * .08 / length(elbow, wrist), z: (wrist[2] - elbow[2]) * .08 / length(elbow, wrist) });
  const handLocalPoint: MotionAction.Vec3 = [direction.x, direction.y, direction.z];
  const context: MotionAction.Context = { basePose, target: [shoulder[0] + .3, shoulder[1], shoulder[2]], geometry: { shoulder, hand: wrist, handLocalPoint, upperArmMetres: length(upper, elbow), forearmMetres: length(elbow, wrist), gloveOffsetMetres: .08, gloveRadiusMetres: .08 }, evaluatePose: evaluate, neutral, supportPatches: [{ side: "left", bone: "leftFoot", localPoint: [0, 0, 0], world: [0, 0, .15], mode: "planted" }, { side: "right", bone: "rightFoot", localPoint: [0, 0, 0], world: [0, 0, -.15], mode: "planted" }] };
  context.geometry.hand = fk(context, basePose, { bone: side === "left" ? "leftHand" : "rightHand", localPoint: handLocalPoint, target: [0, 0, 0], role: "guard", radius: .08 });
  const request: MotionAction.Request = { id: `response-${side}`, actorId: "a", targetId: "b", side, leadSide: side, direction: [1, 0, 0], timing: { preparation: .1, delivery: .2, contact: .04, retraction: .3, recovery: .1 } };
  const action: PunchAction.Instance = PunchAction.create("jab", request);
  const stop: PunchAction.Sample = action.sample(.2, context, action.planBody(.2, context));
  stop.effectors = stop.effectors.map((effector: MotionAction.Effector): MotionAction.Effector => ({ ...effector, target: fk(context, stop.pose, effector) }));
  context.contact = { event: { actionId: request.id, actorId: request.actorId, targetId: request.targetId, time: .2, relation: "guard", point: [0, 1.4, 0], normal: [-1, 0, 0] }, sample: stop };
  return { action, context };
}

/** Independent public FK point, in the current evaluator-root frame. */
function fk(context: MotionAction.Context, pose: IAutoMovieHumanPose, effector: MotionAction.Effector): MotionAction.Vec3 {
  const row: AutoMovieHumanSkeleton.IPlacement = context.evaluatePose!(pose).posed.find((item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === effector.bone)!;
  const local: MotionAction.Vec3 = effector.localPoint ?? [0, 0, 0];
  const offset: { x: number; y: number; z: number } = Quaternion.rotateVector({ x: row.rotation[0], y: row.rotation[1], z: row.rotation[2], w: row.rotation[3] }, { x: local[0], y: local[1], z: local[2] });
  return [row.position[0] + offset.x, row.position[1] + offset.y, row.position[2] + offset.z];
}

/** Combine evaluator-local task with its independently declared actor-local root. */
function actorPoint(sample: MotionAction.Sample): MotionAction.Vec3 { return sample.effectors[0]!.target.map((value: number, index: number): number => value + sample.rootOffset[index]!) as MotionAction.Vec3; }

/** Arithmetic comparisons retain the established double-precision contract. */
function point(actual: Readonly<MotionAction.Vec3>, expected: Readonly<MotionAction.Vec3>): void { assert.ok(Math.hypot(...actual.map((value: number, index: number): number => value - expected[index]!)) < 1e-10); }
