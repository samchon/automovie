import assert from "node:assert/strict";
import { AutoMovieHumanRigControls } from "@automovie/human";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { LabActor } from "../../../../src/motion-lab/LabActor";
import { LabCase } from "../../../../src/motion-lab/LabCase";
import { LabFitPlan } from "../../../../src/motion-lab/LabFitPlan";
import type { LabSettings } from "../../../../src/motion-lab/LabSettings";

/**
 * Both original framed feet and both real hands fit within the public control budget.
 * @evidence contracts/testing.md#observable-behavior Uses one original Human's actual toe-carried frames and Hand-bound pad witnesses. Actual ancestry selects at most32 canonical arm/leg controls; no digit articulation becomes a compensating variable merely because the frame is on a toe.
 * @evidence contracts/testing.md#independent-cases Both own-side frames, both arms, an isolated UpperArm target and an explicit toe articulation distinguish relevant ancestry, omitted neutral defaults and authored preservation. Every original foot remains available to the independent floor oracle.
 */
export function test_fitting_ancestry_and_budget(): void {
  const actor: LabActor = new LabActor("plan", "a", 0, 0);
  try {
    const sample: MotionAction.Sample = stance(actor);
    sample.effectors = (["left", "right"] as const).map((side: MotionAction.Side): MotionAction.Effector => {
      const context: MotionAction.Context = actor.context(side, [0, 0, 0]);
      return { bone: side === "left" ? "leftHand" : "rightHand", localPoint: context.geometry.handLocalPoint, target: context.geometry.hand!, role: "guard", radius: 0 };
    });
    const patches: MotionAction.SupportPatch[] = (["left", "right"] as const).flatMap((side: MotionAction.Side): MotionAction.SupportPatch[] => {
      const measured: MotionAction.SupportMeasurement = actor.context(side, [0, 0, 0]).supportFrame!(sample.pose, sample.rootOffset, actor.patches[side].pivot);
      return [measured.frame, measured.contact];
    });
    const plan: LabFitPlan.Selection = LabFitPlan.select(sample, actor.person.neutral, [...patches.map((patch: MotionAction.SupportPatch): string => patch.bone), "leftHand", "rightHand"]);
    assert.equal(plan.budget.count, 32);
    assert.equal(new Set(plan.channels).size, plan.budget.count);
    assert.ok(plan.channels.every((channel: string): boolean => !/\.(hallux|second|third|fourth|fifth)\./u.test(channel)));
    assert.ok(plan.ancestors.includes("leftMidfoot") && plan.ancestors.includes("rightMidfoot"));
    const upper: LabFitPlan.Selection = LabFitPlan.select(sample, actor.person.neutral, ["leftUpperArm"]);
    assert.ok(upper.channels.every((channel: string): boolean => channel.startsWith("arms.left.") && !channel.includes("elbow") && !channel.includes("forearm")));
    sample.pose.legs!.left.foot = { ...sample.pose.legs!.left.foot, hallux: { mtpFlexion: -20 } };
    const authored: LabFitPlan.Selection = LabFitPlan.select(sample, actor.person.neutral, [actor.patches.left.pivot.bone]);
    assert.equal(authored.toes.find((row: { channel: string }): boolean => row.channel === "legs.left.foot.hallux.mtpFlexion")?.value, -20);
    assert.ok(!authored.channels.includes(AutoMovieHumanRigControls.channel("legs.left.foot.hallux.mtpFlexion")));
  } finally { actor.dispose(); }
}

/**
 * Exact repeated hard equations retain raw attribution without changing numerical weight.
 * @evidence contracts/testing.md#observable-behavior An unloaded frame centre and its identical grounded point map to one equation. A goal displaced by1e-12m stays distinct, and mutating the original descriptor cannot mutate the solver-owned goal.
 * @evidence contracts/testing.md#independent-cases Explicit zero and omitted local origin are the same geometric point; a different bone, local witness or world goal remains separate. No epsilon merge or target averaging can satisfy this oracle.
 */
export function test_fitting_exact_hard_mapping(): void {
  const raw = [{ bone: "leftHand" as const, position: [1, 2, 3] as MotionAction.Vec3 }, { bone: "leftHand" as const, localPoint: [0, 0, 0] as MotionAction.Vec3, position: [1, 2, 3] as MotionAction.Vec3 }, { bone: "leftHand" as const, position: [1 + 1e-12, 2, 3] as MotionAction.Vec3 }, { bone: "rightHand" as const, position: [1, 2, 3] as MotionAction.Vec3 }];
  const normalized: ReturnType<typeof LabFitPlan.hardTargets> = LabFitPlan.hardTargets(raw);
  assert.deepEqual(normalized.rawToEffective, [0, 0, 1, 2]);
  assert.equal(normalized.targets.length, 3);
  raw[0]!.position[0] = 999;
  assert.equal(normalized.targets[0]!.position[0], 1);
}

/**
 * A rejected real fitting request restores the last displayed actor and exposes its own budget.
 * @evidence contracts/testing.md#observable-behavior Applies a genuine original supported stance, then explicitly locks every available leg control so an empty fitting request refuses before the public solver. Actual bone graph, root, committed sample and world goals remain unchanged, while failedAttempt retains selected count and public cap.
 * @evidence contracts/testing.md#independent-cases A separate valid request still works after rejection. This tests the actual adapter rather than a fake throwing fitter and cannot hide the failed request behind an idle pose or a successful historical receipt.
 */
export function test_fitting_failed_apply_restores_actor(): void {
  const actor: LabActor = new LabActor("rollback", "a", 0, 0);
  try {
    const valid: MotionAction.Sample = stance(actor);
    actor.apply(valid);
    const before: string = JSON.stringify(actor.constrained());
    const beforeRoot: number[] = actor.person.object.position.toArray();
    const invalid: MotionAction.Sample = structuredClone(valid);
    invalid.preservedChannels = (["left", "right"] as const).flatMap((side: MotionAction.Side): AutoMovieHumanRigControls.DegreeChannel[] => AutoMovieHumanRigControls.chain({ region: "leg", side }));
    assert.throws((): void => actor.apply(invalid), /selected 0 controls/u);
    assert.equal(JSON.stringify(actor.constrained()), before);
    assert.deepEqual(actor.person.object.position.toArray(), beforeRoot);
    const failed: { failedAttempt: { plan: LabFitPlan.Selection } } = actor.inspect() as { failedAttempt: { plan: LabFitPlan.Selection } };
    assert.equal(failed.failedAttempt.plan.budget.count, 0);
    assert.equal(failed.failedAttempt.plan.budget.maximum, 32);
    actor.apply(valid);
    assert.equal(JSON.stringify(actor.constrained()), before);
    assert.equal((actor.inspect() as { failedAttempt?: object }).failedAttempt, undefined);
  } finally { actor.dispose(); }
}

/**
 * A failed pooled case replacement restores the same two actors and previous case identity.
 * @evidence contracts/testing.md#observable-behavior Loads a real two-actor step case, retains both original graph UUIDs and native samples, then attempts a malformed action with those same pooled actors. The same public checkpoints used by the Viewer restore both poses, roots, origins and prior case sampling after the failed replacement.
 * @evidence contracts/testing.md#independent-cases Uses both headings and a case reset that changes geometry placement before failing. A standalone refused close-contact case cannot run a one-second idle fallback clock; its explicit failure remains inspectable.
 */
export function test_fitting_pooled_selection_rollback(): void {
  const actors: Record<"a" | "b", LabActor> = { a: new LabActor("a", "a", -.75, 0), b: new LabActor("b", "b", .75, Math.PI) };
  const settings: LabSettings = { action: "step", actor: "a", side: "left", target: "guard", defense: "none", distance: 1.5, seed: 17, aim: 0, timingVariation: 0, timingScale: 1, direction: 0, entry: false };
  let active: LabCase | undefined;
  let refused: LabCase | undefined;
  try {
    active = new LabCase(settings, actors);
    assert.equal(active.admissionError, null);
    active.evaluate(0);
    const ids: string[] = Object.values(actors).map((actor: LabActor): string => actor.person.object.uuid);
    const before: string[] = Object.values(actors).map((actor: LabActor): string => JSON.stringify(actor.constrained()));
    const restore: (() => void)[] = Object.values(actors).map((actor: LabActor): (() => void) => actor.checkpoint());
    refused = new LabCase({ ...settings, action: "low-kick", target: "head", distance: 1.8 }, actors);
    assert.ok(refused.admissionError);
    assert.throws((): void => refused!.evaluate(.2), /No action is loaded/u);
    for (const rollback of restore) rollback();
    assert.deepEqual(Object.values(actors).map((actor: LabActor): string => actor.person.object.uuid), ids);
    assert.deepEqual(Object.values(actors).map((actor: LabActor): string => JSON.stringify(actor.constrained())), before);
    assert.equal(active.settings.action, "step");
    active.evaluate(0);
    assert.deepEqual(Object.values(actors).map((actor: LabActor): string => JSON.stringify(actor.constrained())), before);
  } finally { refused?.dispose(); active?.dispose(); for (const actor of Object.values(actors)) actor.dispose(); }
}

/**
 * The actual Viewer default must initialize before its build can replace the working server.
 * @evidence contracts/testing.md#observable-behavior Constructs exactly the visible default jab/cover pair at1.1m with supported entry enabled, then samples time zero through the same real LabCase. Both actors must have admitted whole-foot support and finite selected control counts within32 before any playback is considered loaded.
 * @evidence contracts/testing.md#independent-cases This is the canonical startup regression for the former blank-floor42-control rejection. It is distinct from pure channel counting and free single-actor punches; failed entry or physical fitting cannot be converted into an idle fallback success.
 */
export function test_fitting_viewer_default_startup(): void {
  const sample: LabCase = new LabCase({ action: "jab", actor: "a", side: "left", target: "guard", defense: "cover", distance: 1.1, seed: 17, aim: 0, timingVariation: 0, timingScale: 1, direction: 0, entry: true });
  try {
    assert.equal(sample.admissionError, null, "The actual default selection must load before server replacement");
    sample.evaluate(0);
    for (const actor of Object.values(sample.actors)) {
      assert.equal(actor.support?.status, "admitted");
      const plan: LabFitPlan.Selection = (actor.inspect() as { fittingPlan: LabFitPlan.Selection }).fittingPlan;
      assert.ok(plan.budget.count > 0 && plan.budget.count <= 32);
      assert.ok(actor.support!.floorMinimum >= -.000001);
    }
    assert.equal((sample.inspect() as { operational: boolean; seconds: number }).operational, true);
    assert.equal((sample.inspect() as { seconds: number }).seconds, 0);
  } finally { sample.dispose(); }
}

/** A measured original stance used for input-admission and rollback checks. */
function stance(actor: LabActor): MotionAction.Sample {
  return { pose: structuredClone(actor.basePose), rootOffset: [0, 0, 0], support: { left: .5, right: .5, patches: [structuredClone(actor.patches.left.low), structuredClone(actor.patches.right.low)] }, effectors: [], phase: "idle", elapsed: 0, progress: 0 };
}
