import assert from "node:assert/strict";
import type { AutoMovieHumanSkeleton, IAutoMovieHumanPose } from "@automovie/human";
import { RoundhouseContinuation } from "../../../../src/motion/kick/RoundhouseContinuation";
import type { RoundhouseAction } from "../../../../src/motion/kick/RoundhouseAction";

/**
 * Actual clinical/root/load tangents join the original kick without moving its WORLD task.
 * Scenarios: 1. Exact entry and finite tangent. 2. Unchanged arm ownership and WORLD task. 3. Original terminal, seek order and input isolation.
 * @evidence contracts/testing.md#observable-behavior Calls the real pure continuation on an independently linear nominal path. It observes clinical/root/load entry values and finite derivatives, fixed WORLD task sums, untouched arm values and exact original terminal output. No native solver or foreign method is replaced.
 * @evidence contracts/testing.md#independent-cases Explicit linear nominal rates and independently authored actual rates define the oracle. The pure fixture has no geometry witnesses, so FK is intentionally unavailable and cannot confer physical admission. Actual original-Human support/contact/shape and moving Viewer inspection remain integration responsibilities.
 */
export function test_roundhouse_continuation_boundary(): void {
  const entry: RoundhouseContinuation.Entry = fixture();
  const continuation: RoundhouseContinuation = new RoundhouseContinuation(nominal(0), nominal(.002), entry);
  entry.sample.pose.pelvis!.rotation = 99;
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = noGeometry;
  const zero: RoundhouseAction.Sample = continuation.apply(nominal(0), 0, evaluate);
  assert.equal(zero.pose.pelvis!.rotation, 10);
  assert.equal(zero.rootOffset[0], 1);
  assert.equal(zero.support.left, .6);
  const epsilon: number = 1e-6;
  const next: RoundhouseAction.Sample = continuation.apply(nominal(epsilon), epsilon, evaluate);
  assert.ok(Math.abs((next.pose.pelvis!.rotation! - 10) / epsilon - 5) < .1);
  assert.ok(Math.abs((next.rootOffset[0] - 1) / epsilon - .3) < .01);
  assert.ok(Math.abs((next.support.left - .6) / epsilon - .2) < .001);
  for (const seconds of [0, .005, .01, .019, .02]) {
    const sample: RoundhouseAction.Sample = continuation.apply(nominal(seconds), seconds, evaluate);
    assert.ok(Math.abs(sample.effectors[0]!.target[0] + sample.rootOffset[0] - 4) < 1e-12);
    assert.deepEqual(sample.pose.arms, nominal(seconds).pose.arms);
  }
  assert.deepEqual(continuation.apply(nominal(.02), .02, evaluate), nominal(.02));
  const first: string = JSON.stringify(continuation.apply(nominal(.01), .01, evaluate));
  continuation.apply(nominal(.02), .02, evaluate); continuation.apply(nominal(0), 0, evaluate);
  assert.equal(JSON.stringify(continuation.apply(nominal(.01), .01, evaluate)), first);
}

/**
 * Unknown rates, angular motion and incompatible retained feet cannot enter a kick.
 * Scenarios: 1. Missing, sparse, duplicate, foreign and nonfinite rates. 2. Unsupported root rotation rate. 3. Replaced anchor and mismatched clock. 4. A complete reordered channel set remains valid.
 * @evidence contracts/testing.md#observable-behavior Constructs the actual continuation with independently invalid boundaries and requires refusal before a corrected sample can be published. Original task data and native ranges are not changed to make these cases pass.
 * @evidence contracts/testing.md#independent-cases Complete occupied public ownership, finite rates, zero admitted standing angular rate and unchanged retained WORLD anchors are the declared source contract. First, middle and last holes must refuse at construction while a reordered complete set remains accepted. These structural failures are independent of the positive linear-path interpolation oracle.
 */
export function test_roundhouse_continuation_refusals(): void {
  const missing: RoundhouseContinuation.Entry = fixture(); missing.channelRates.pop();
  assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), missing), /each applied/u);
  for (const hole of [0, Math.floor(fixture().channelRates.length / 2), fixture().channelRates.length - 1]) {
    const sparse: RoundhouseContinuation.Entry = fixture();
    const dense: RoundhouseContinuation.Rate[] = sparse.channelRates;
    sparse.channelRates = new Array<RoundhouseContinuation.Rate>(dense.length);
    for (let index: number = 0; index < dense.length; index++) if (index !== hole) sparse.channelRates[index] = dense[index]!;
    assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), sparse), /each applied/u);
  }
  const duplicate: RoundhouseContinuation.Entry = fixture(); duplicate.channelRates[0] = { ...duplicate.channelRates[1]! };
  assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), duplicate), /each applied/u);
  for (const rate of [NaN, Infinity, -Infinity]) {
    const nonfinite: RoundhouseContinuation.Entry = fixture(); nonfinite.channelRates[0]!.degreesPerSecond = rate;
    assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), nonfinite), /each applied/u);
  }
  const absent: RoundhouseContinuation.Entry = fixture(); absent.channelRates[0] = undefined as unknown as RoundhouseContinuation.Rate;
  assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), absent), /each applied/u);
  const foreign: RoundhouseContinuation.Entry = fixture(); foreign.channelRates[0] = { channel: "arms.left.elbow.flexion", degreesPerSecond: 0 };
  assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), foreign), /without arms/u);
  const angular: RoundhouseContinuation.Entry = fixture(); angular.rootAngularVelocity = [0, .1, 0];
  assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), angular), /fixed orientation/u);
  const anchor: RoundhouseContinuation.Entry = fixture(); anchor.sample.support.patches![0]!.world = [.25, 0, 0];
  assert.throws((): unknown => new RoundhouseContinuation(nominal(0), nominal(.002), anchor), /retained ground anchor/u);
  const continuation: RoundhouseContinuation = new RoundhouseContinuation(nominal(0), nominal(.002), fixture());
  assert.throws((): unknown => continuation.apply(nominal(0), .001, noGeometry), /matching/u);
  const reordered: RoundhouseContinuation.Entry = fixture(); reordered.channelRates.reverse();
  const reorderedSample: RoundhouseAction.Sample = new RoundhouseContinuation(nominal(0), nominal(.002), reordered).apply(nominal(0), 0, noGeometry);
  const canonicalSample: RoundhouseAction.Sample = continuation.apply(nominal(0), 0, noGeometry);
  assert.deepEqual(reorderedSample.pose, canonicalSample.pose);
  assert.deepEqual(reorderedSample.rootOffset, canonicalSample.rootOffset);
  assert.deepEqual(reorderedSample.support, canonicalSample.support);
  assert.deepEqual(reorderedSample.effectors, canonicalSample.effectors);
}

/** Independently authored linear body/root path; the zero-radius guide is a point task, with no surface or collision proxy in this pure fixture. */
function nominal(seconds: number): RoundhouseAction.Sample {
  return { pose: { pelvis: { rotation: 2 * seconds }, arms: { left: {}, right: { elbow: { flexion: 42 } } } }, rootOffset: [2 * seconds, 0, 0], support: { left: .5, right: .5, patches: [{ side: "left", bone: "leftFoot", localPoint: [0, 0, 0], world: [-1, 0, 0], mode: "planted", constraint: "hard" }, { side: "right", bone: "rightFoot", localPoint: [0, 0, 0], world: [1, 0, 0], mode: "planted", constraint: "hard" }] }, effectors: [{ bone: "leftFoot", target: [4 - 2 * seconds, 1, 0], role: "guide", constraint: "hard", radius: 0 }], elapsed: seconds, progress: seconds / .1, phase: "preparation", diagnostics: { clinical: [], planting: [] } };
}

/** Actual source boundary with explicit known stationary controls outside the moving pelvis. */
function fixture(): RoundhouseContinuation.Entry {
  const sample: RoundhouseAction.Sample = nominal(0);
  sample.pose.pelvis!.rotation = 10; sample.rootOffset = [1, 0, 0]; sample.support.left = .6; sample.support.right = .4;
  return { sample, channelRates: RoundhouseContinuation.channels().map((channel: RoundhouseContinuation.Rate["channel"]): RoundhouseContinuation.Rate => ({ channel, degreesPerSecond: channel === "pelvis.rotation" ? 5 : 0 })), rootVelocity: [.3, 0, 0], rootAngularVelocity: [0, 0, 0], loadRates: { left: .2, right: -.2 }, provenance: { h: .004, h2: .002, oneSided: "before", contactBranch: "post-contact" }, windowSeconds: .02 };
}

/** A pure path with no clinical witnesses must not require or counterfeit geometry. */
function noGeometry(_pose?: IAutoMovieHumanPose): AutoMovieHumanSkeleton.IOutput { throw new Error("The pure continuation fixture owns no geometry witnesses"); }
