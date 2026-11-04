import assert from "node:assert/strict";
import { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { PunchAction } from "../../../../src/motion/punch/PunchAction";
import { LabBodyStage } from "../../../../src/motion-lab/LabBodyStage";
import { LabPunchRecovery } from "../../../../src/motion-lab/LabPunchRecovery";
import { LabReceiving } from "../../../../src/motion-lab/LabReceiving";
import type { LabRecovery } from "../../../../src/motion-lab/LabRecovery";
import type { LabArmWriter } from "../../../../src/motion-lab/LabArmWriter";
import { LabActor } from "../../../../src/motion-lab/LabActor";
import { LabActualMotion } from "../../../../src/motion-lab/LabActualMotion";
import * as THREE from "three";

/**
 * Released-arm metadata and sampling retain the original affine action clock.
 *
 * Scenarios:
 * 1. Local source phases plus a nonzero prefix produce exact original release/end values.
 * 2. Sampling at release refuses; the explicit consuming frame and later original clock pass unchanged.
 * 3. Caller mutation cannot edit source context, timing or immutable metadata.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real recovery adapter around an immutable punch and a deterministic clinical arm provider. Literal phase sums, captured callback arguments and independent input snapshots check clock/frame ownership without a native solve.
 * @evidence contracts/testing.md#independent-cases This isolates the port seam rather than fabricating an actual contact. Actual counter actor fitting, tangents and original ground goals are covered by the real Counter consumer tests; this test claims no visual approval.
 */
export function test_recovery_original_clock(): void {
  const request: MotionAction.Request = placed("left", "old-jab");
  const action: PunchAction.Instance = PunchAction.create("jab", request);
  const context: MotionAction.Context = originalContext();
  const placement: MotionAction.BodyPlacement = { pose: { arms: { left: {}, right: {} } }, rootOffset: [.1, 0, -.02], support: { left: .6, right: .4 } };
  let received: { seconds: number; origin: MotionAction.Vec3; target: MotionAction.Vec3 } | undefined;
  const port: LabRecovery = LabPunchRecovery.create([{ action, context, startSeconds: 2 }], (seconds: number, contexts: readonly MotionAction.Context[], body: MotionAction.BodyPlacement): LabArmWriter[] => {
    received = { seconds, origin: [...contexts[0]!.frame!.origin], target: [...contexts[0]!.target] };
    const writer: LabArmWriter = clinical("left", body); writer.sample.elapsed = seconds - 2; return [writer];
  });
  assert.equal(port.actorId, "a");
  assert.equal(port.actions[0]!.actionId, "old-jab");
  assert.ok(Math.abs(port.actions[0]!.deliveryStartSeconds - 2.1) < 1e-12);
  assert.ok(Math.abs(port.releasedSeconds - 2.34) < 1e-12);
  assert.ok(Math.abs(port.endSeconds - 2.74) < 1e-12);
  assert.equal(port.actions[0]!.retractionSeconds, .3);
  assert.ok(Object.isFrozen(port.actions) && Object.isFrozen(port.actions[0]));
  assert.throws((): unknown => port.sampleArms(port.releasedSeconds, placement, { origin: [4, 0, 2], yawRadians: 1 }), /post-release/u);
  const before: string = JSON.stringify(placement);
  context.target[0] = 91; context.frame!.origin[0] = 92; request.timing.delivery = 93;
  port.sampleArms(2.5, placement, { origin: [4, 0, 2], yawRadians: 1 });
  assert.deepEqual(received, { seconds: 2.5, origin: [4, 0, 2], target: [.6, 1.4, 0] });
  assert.equal(JSON.stringify(placement), before);
  assert.throws((): unknown => port.sampleArms(2.5, placement, { origin: [NaN, 0, 0], yawRadians: 0 }), /finite consuming frame/u);
  const striking: LabRecovery = LabPunchRecovery.create([{ action, context: originalContext(), startSeconds: 0 }], (_seconds: number, _contexts: readonly MotionAction.Context[], body: MotionAction.BodyPlacement): LabArmWriter[] => {
    const writer: LabArmWriter = clinical("left", body); writer.sample.phase = "delivery"; return [writer];
  });
  assert.throws((): unknown => striking.sampleArms(.5, placement, { origin: [0, 0, 0], yawRadians: 0 }), /WORLD dwell/u);
  const wrongClock: LabRecovery = LabPunchRecovery.create([{ action, context: originalContext(), startSeconds: 0 }], (_seconds: number, _contexts: readonly MotionAction.Context[], body: MotionAction.BodyPlacement): LabArmWriter[] => [clinical("left", body)]);
  assert.throws((): unknown => wrongClock.sampleArms(.5, placement, { origin: [0, 0, 0], yawRadians: 0 }), /changed clock/u);
}

/**
 * One still-returning arm cannot simultaneously own an independent incoming interception.
 *
 * Scenarios:
 * 1. A free opposite arm and an expired same arm can accept a new task.
 * 2. Active same-side contact tasks, foreign actors and malformed lifetimes refuse.
 * 3. Source event identity is admitted independently of metadata shape.
 *
 * @evidence contracts/testing.md#observable-behavior Executes actual receiving admission before any actor mutation with literal original clock metadata. It distinguishes disjoint arm ownership from expired terminal guard, and rejects foreign event/action ownership.
 * @evidence contracts/testing.md#independent-cases The declared .34 release/.74 completion and explicit left/right task identities provide independent expectations. No actor or solver is mocked into reporting support; final actual composition remains the Counter consumer's responsibility.
 */
export function test_recovery_receiving_ownership(): void {
  const action: PunchAction.Instance = PunchAction.create("jab", placed("left", "old-jab"));
  const port: LabRecovery = LabPunchRecovery.create([{ action, context: originalContext(), startSeconds: 0 }]);
  const carry: LabReceiving.Carry = { port, offsetSeconds: .4 };
  const left: MotionAction.Effector = { bone: AutoMovieHumanRigControls.joint("leftHand"), target: [.3, 1.4, 0], role: "guard", radius: .08 };
  const right: MotionAction.Effector = { ...left, bone: AutoMovieHumanRigControls.joint("rightHand") };
  assert.doesNotThrow((): void => LabReceiving.validate(carry, "a", 0, [right]));
  assert.doesNotThrow((): void => LabReceiving.validate(carry, "a", 0, [{ ...left, bone: AutoMovieHumanRigControls.joint("leftFoot") }]));
  assert.doesNotThrow((): void => LabReceiving.validate(carry, "a", 0, [{ ...left, bone: AutoMovieHumanRigControls.joint("leftLowerLeg") }]));
  assert.throws((): void => LabReceiving.validate(carry, "a", 0, [left]), /conflicts/u);
  assert.doesNotThrow((): void => LabReceiving.validate(carry, "a", 1, [left]));
  assert.throws((): void => LabReceiving.validate(carry, "b"), /actor/u);
  assert.throws((): void => LabReceiving.validate({ port, offsetSeconds: port.releasedSeconds }, "a"), /clock/u);
  const malformed: LabRecovery = { ...port, endSeconds: .1 };
  assert.throws((): void => LabReceiving.validate({ port: malformed, offsetSeconds: .4 }, "a"), /clock/u);
  for (const deliveryStartSeconds of [-.1, 10]) {
    const invalid: LabRecovery = { ...port, actions: [{ ...port.actions[0]!, deliveryStartSeconds }] };
    assert.throws((): void => LabReceiving.validate({ port: invalid, offsetSeconds: .4 }, "a"), /lifetime/u);
  }
  const foreign: MotionAction.ContactState = { event: { actionId: "other-action", actorId: "a", targetId: "b", time: .2, point: [0, 1, 0], normal: [1, 0, 0], relation: "guard" }, sample: LabBodyStage.sample({ pose: {}, rootOffset: [0, 0, 0], support: { left: .5, right: .5 } }) };
  assert.throws((): unknown => LabPunchRecovery.create([{ action, context: originalContext(), startSeconds: 0, contact: foreign }]), /original action/u);
  assert.throws((): unknown => LabPunchRecovery.create([{ action, context: originalContext(), startSeconds: -1 }]), /original arm clocks/u);
}

/**
 * A same-side leg task and outgoing arm share one body without sharing task ownership.
 * @evidence contracts/testing.md#observable-behavior Drives the actual original actor through LabReceiving with a real released-punch port and an independent Foot task. The original task remains present after body preparation and arm application, with unchanged WORLD target, admitted support and strict final residual. No native result is fabricated.
 * @evidence contracts/testing.md#independent-cases The actual initial Foot joint is the independently authored guide before composition; .25mm remains the hard tolerance. Its anatomical left prefix must not make it a left-arm conflict. Separate admission tests retain active same-hand refusal.
 */
export function test_recovery_receiving_leg_task(): void {
  const actor: LabActor = new LabActor("a", "a", 0, 0);
  try {
    const context: MotionAction.Context = actor.context("left", [.4, 1.4, 0]);
    const action: PunchAction.Instance = PunchAction.create("jab", placed("left", "released-leg-composition"));
    const port: LabRecovery = LabPunchRecovery.create([{ action, context, startSeconds: 0 }]);
    const goal: MotionAction.Vec3 = actor.local(actor.person.point("leftFoot"));
    const incoming: MotionAction.Sample = { ...LabBodyStage.sample({ pose: actor.basePose, rootOffset: [0, 0, 0], support: { left: .5, right: .5, patches: [actor.patches.left.low, actor.patches.right.low] } }), effectors: [{ bone: "leftFoot", localPoint: [0, 0, 0], target: [...goal], radius: 0, role: "guide", constraint: "hard" }] };
    const before: string = JSON.stringify(incoming);
    LabReceiving.apply(actor, incoming, .1, { port, offsetSeconds: .4 });
    assert.equal(actor.support?.status, "admitted");
    const retained: MotionAction.Effector | undefined = actor.sample?.effectors.find((task: MotionAction.Effector): boolean => task.bone === "leftFoot" && task.role === "guide");
    assert.ok(retained);
    const world: MotionAction.Vec3 = retained.target.map((value: number, index: number): number => value + actor.sample!.rootOffset[index]! + actor.origin.toArray()[index]!) as MotionAction.Vec3;
    for (let axis: number = 0; axis < 3; axis++) assert.ok(Math.abs(world[axis]! - goal[axis]! - actor.origin.toArray()[axis]!) <= 1e-10);
    assert.ok(actor.errors.some((error: LabActor["errors"][number]): boolean => error.bone === "leftFoot" && error.role === "guide" && error.error <= .00025));
    assert.equal(JSON.stringify(incoming), before);
  } finally { actor.dispose(); }
}

/**
 * A continuing strike validates its original WORLD task while its released arm follows another body frame.
 *
 * Scenarios:
 * 1. A real stationary original actor supplies complete measured entry channels and the unchanged strike terminal.
 * 2. Translation and yaw in the receiving actor do not restart the original release/deadline or move its support goals.
 * 3. An invalid original terminal still refuses through the same port after release and at completion.
 *
 * @evidence contracts/testing.md#observable-behavior Uses actual original Human actors, public fixed-time capture, an immutable continuing PunchAction and the default LabPunchRecovery port. Both translated and yawed consumers apply the released arm through native body/arm admission; exact original phase sums, clinical guard, strict floor/support and unchanged goals are checked. The wrong terminal distinguishes source validation from consuming-frame rebinding.
 * @evidence contracts/testing.md#independent-cases The declared .34 release and .74 completion own the clock oracle. The intended in-range WORLD target is authored before continuation construction; stationary real geometry supplies known entry rates without fabricated native success. Original support tuples and the original guard are independent unchanged values. This portable actor check does not establish watched motion.
 */
export function test_recovery_original_task_frame(): void {
  const source: LabActor = new LabActor("a", "a", 0, 0);
  try {
    source.prepareBody({ pose: source.basePose, rootOffset: [0, 0, 0], support: { left: .5, right: .5, patches: [source.patches.left.low, source.patches.right.low] } });
    const context: MotionAction.Context = source.context("left", [.3, 1.4, 0]);
    const measured: LabActualMotion.Measurement = LabActualMotion.measure((seconds: number): LabActualMotion.Snapshot => LabActualMotion.capture(source, "left", seconds, "free"), .1, 1 / 2400, "before");
    const request: MotionAction.Request = placed("left", "continuing-frame-jab");
    const entry: PunchAction.Continuation = LabActualMotion.punchEntry(measured, "left", request.timing.preparation + request.timing.delivery, [...context.target]);
    const action: PunchAction.Instance = PunchAction.create("jab", request, entry);
    const port: LabRecovery = LabPunchRecovery.create([{ action, context, startSeconds: 0 }]);
    const wrong: PunchAction.Continuation = structuredClone(entry);
    wrong.terminal.pointWorld[0] += .1;
    const invalid: LabRecovery = LabPunchRecovery.create([{ action: PunchAction.create("jab", request, wrong), context, startSeconds: 0 }]);
    assert.ok(Math.abs(port.releasedSeconds - .34) < 1e-12);
    assert.ok(Math.abs(port.endSeconds - .74) < 1e-12);
    for (const yaw of [0, .7]) {
      const consumer: LabActor = new LabActor("a", "a", 2, yaw);
      try {
        const support: MotionAction.Support = { left: .5, right: .5, patches: [structuredClone(consumer.patches.left.low), structuredClone(consumer.patches.right.low)] };
        const frame: NonNullable<MotionAction.Context["frame"]> = { origin: consumer.origin.toArray(), yawRadians: consumer.yaw };
        for (const seconds of [.5, port.endSeconds, .5]) {
          const placement: MotionAction.BodyPlacement = consumer.prepareBody({ pose: consumer.basePose, rootOffset: [0, 0, 0], support: structuredClone(support) });
          const writers: LabArmWriter[] = port.sampleArms(seconds, placement, frame);
          assert.equal(writers[0]!.sample.elapsed, seconds);
          assert.equal(writers[0]!.sample.phase, seconds === port.endSeconds ? "complete" : "retraction");
          assert.deepEqual(writers[0]!.sample.support, support);
          consumer.applyArms(writers, placement);
          assert.equal(consumer.support?.status, "admitted");
          assert.ok(consumer.support!.supportError <= .00025);
          assert.ok(consumer.support!.floorMinimum >= -.000001);
          assert.deepEqual(consumer.sample!.support, support);
          if (seconds === port.endSeconds) for (const rate of measured.rates.filter((row: LabActualMotion.Measurement["rates"][number]): boolean => row.channel.startsWith("arms.left."))) assert.ok(Math.abs(AutoMovieHumanRigControls.readApplied(writers[0]!.sample.pose, rate.channel, []) - AutoMovieHumanRigControls.readApplied(context.basePose, rate.channel, [])) <= 1e-10);
          assert.throws((): unknown => invalid.sampleArms(seconds, placement, frame), /unchanged original WORLD task/u);
        }
        const pad: THREE.Vector3 = consumer.glove("left").getWorldPosition(new THREE.Vector3());
        assert.ok(Number.isFinite(pad.x) && Math.abs(pad.x - source.glove("left").getWorldPosition(new THREE.Vector3()).x) > 1);
      } finally { consumer.dispose(); }
    }
  } finally { source.dispose(); }
}

/** An independent explicit phase profile, with no seeded variation. */
function placed(side: MotionAction.Side, id: string): MotionAction.Request { return { id, actorId: "a", targetId: "b", side, leadSide: side, direction: [1, 0, 0], timing: { preparation: .1, delivery: .2, contact: .04, retraction: .3, recovery: .1 } }; }
/** No source geometry is evaluated by these pure adapter seam cases. */
function originalContext(): MotionAction.Context { return { basePose: { arms: { left: {}, right: {} } }, geometry: {}, target: [.6, 1.4, 0], frame: { origin: [0, 0, 0], yawRadians: 0 } }; }
/** An explicit clinical-only callback tests adapter ownership without inventing native admission. */
function clinical(side: MotionAction.Side, placement: MotionAction.BodyPlacement): LabArmWriter { const sample: MotionAction.Sample = LabBodyStage.sample(placement); sample.phase = "retraction"; return { side, sample, channels: [AutoMovieHumanRigControls.channel(`arms.${side}.elbow.flexion`)] }; }
