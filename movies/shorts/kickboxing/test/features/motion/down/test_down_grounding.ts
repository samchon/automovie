import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type AutoMovieHumanSupportFrame,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { MotionAction } from "../../../../src/motion/core/MotionAction";
import { DownGrounding } from "../../../../src/motion/down/DownGrounding";
import { GestureMotion } from "../../../../src/motion/down/GestureMotion";
import { KnockdownMotion } from "../../../../src/motion/down/KnockdownMotion";

/**
 * Check rolling placement against an independently transformed rigid rectangle.
 *
 * Scenarios:
 * 1. A 90-degree roll retains the same material corner without horizontal slide.
 * 2. Every supplied corner remains above the unchanged floor at midpoint samples.
 * 3. Random seek order and mutated outputs cannot change a later result.
 * 4. Invalid source geometry, rate, entry height and sample times refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Executes DownGrounding with a pure rigid-point FK fixture, never replacing globals or foreign methods. Independent Three.js world rotation checks its actual raw vertex requests. It cannot prove Human articulation, actor collisions, impact dynamics or browser appearance.
 * @evidence contracts/testing.md#independent-cases A rectangle whose minimum corner stays [0,0,.2] through a positive 90-degree X rotation has analytic root Y=.2sin(theta), Z=.2(1-cos(theta)). Linear interpolation error is bounded by r*(pi/120)^2/8 below .00002m at 60Hz. All original corners, both endpoints, midpoint/seek, aliasing and invalid boundaries are checked.
 */
export function test_down_grounding_rolling(): void {
  const points: AutoMovieHumanSupportFrame.IPoint[] = [];
  for (const y of [0, 1])
    for (const z of [-0.2, 0.2])
      points.push({ bone: "hips", localPoint: [0, y, z] });
  const shape: (seconds: number) => DownGrounding.Shape = (
    seconds: number,
  ): DownGrounding.Shape => ({
    pose: {},
    rootRotation: [
      Math.sin((seconds * Math.PI) / 4),
      0,
      0,
      Math.cos((seconds * Math.PI) / 4),
    ],
  });
  const config: DownGrounding.Config = {
    points,
    evaluate: rigidFixture,
    shape,
    duration: 1,
    floorY: 0,
    entryRoot: [0, 0, 0],
    samplesPerSecond: 60,
  };
  const track: DownGrounding = new DownGrounding(config);
  for (const time of [0, 0.008333333333333, 0.1, 0.234, 0.5, 0.777, 0.999, 1]) {
    const sample: DownGrounding.Placement = track.sample(time);
    const angle: number = (time * Math.PI) / 2;
    assert.ok(Math.abs(sample.rootOffset[1] - 0.2 * Math.sin(angle)) < 1e-12);
    assert.ok(
      Math.abs(sample.rootOffset[2] - 0.2 * (1 - Math.cos(angle))) < 0.00002,
    );
    assert.equal(sample.point.bone, "hips");
    assert.ok(Math.abs(sample.position[1]) < 1e-12);
    const quaternion: THREE.Quaternion =
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        angle,
      );
    for (const point of points)
      assert.ok(
        new THREE.Vector3(...point.localPoint)
          .applyQuaternion(quaternion)
          .add(new THREE.Vector3(...sample.rootOffset)).y >= -1e-12,
      );
  }
  const saved: DownGrounding.Placement = track.sample(0.234);
  track.sample(0.9);
  track.sample(0.02);
  assert.deepEqual(track.sample(0.234), saved);
  saved.rootOffset[0] = 99;
  saved.point.localPoint[0] = 99;
  assert.equal(track.sample(0.234).rootOffset[0], 0);
  assert.equal(track.sample(0.234).point.localPoint[0], 0);
  points[0]!.localPoint[1] = -100;
  config.entryRoot[0] = 99;
  assert.equal(track.sample(0).rootOffset[0], 0);
  assert.throws((): DownGrounding.Placement => track.sample(NaN));
  assert.throws(
    (): DownGrounding =>
      new DownGrounding({ ...config, points: [], entryRoot: [0, 0, 0] }),
  );
  assert.throws(
    (): DownGrounding =>
      new DownGrounding({
        ...config,
        points: [{ bone: "hips", localPoint: [0, 0, 0] }],
        entryRoot: [0, 1, 0],
      }),
  );
  assert.throws(
    (): DownGrounding =>
      new DownGrounding({ ...config, samplesPerSecond: 1000 }),
  );
}

/**
 * Keep impact, collapse, attempted rise and final ground rest on one local clock.
 *
 * Scenarios:
 * 1. The source attack clock remains unchanged while the receiver samples 0..30.
 * 2. Buckling precedes side rotation; the failed-rise envelope returns to rest.
 * 3. Every ground request names the actual fixture carrier and the floor.
 * 4. Foreign receipts and invalid timing reject; caller mutations stay isolated.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the complete KnockdownMotion with an explicit pure FK/surface fixture and actual-shaped input receipt. The test observes timeline, ownership and support bookkeeping, not contact detection or physical Human motion; public Human surface checks have a separate test.
 * @evidence contracts/testing.md#independent-cases Explicit .18/.92/.5 phase sums and 8..13 attempt window define independent expectations. A hips-owned rigid surface supplies a supported semantic carrier. Original incoming time 150, final side orientation, zero attack effectors, normalized contact shares, immutable source and malformed identity/timing are pinned.
 */
export function test_down_timeline(): void {
  const config: KnockdownMotion.Config = downFixture();
  const action: KnockdownMotion = new KnockdownMotion(config);
  assert.equal(action.impact.time, 150);
  assert.equal(action.sample(-0.1).downPhase, "impact");
  assert.equal(action.sample(0.1).downPhase, "buckling");
  assert.equal(action.sample(0.3).downPhase, "descent");
  assert.equal(action.sample(1.2).downPhase, "settling");
  assert.equal(action.sample(3).downPhase, "resting");
  assert.equal(action.sample(10.5).downPhase, "attempted-rise");
  assert.equal(action.sample(17).downPhase, "resting");
  const rest: KnockdownMotion.Sample = action.sample(17);
  const complete: KnockdownMotion.Sample = action.sample(30);
  assert.deepEqual(complete.pose, rest.pose);
  assert.deepEqual(complete.rootRotation, rest.rootRotation);
  assert.equal(complete.phase, "complete");
  for (const time of [0, 0.18, 0.5, 1.1, 1.6, 8, 10.5, 13, 17, 30]) {
    const sample: KnockdownMotion.Sample = action.sample(time);
    MotionAction.validateSupport(sample.support);
    MotionAction.validateRootRotation(sample.rootRotation);
    assert.equal(sample.support.kind, "contacts");
    assert.equal(sample.effectors.length, 0);
    assert.equal(sample.contacts[0]!.actorId, "receiver");
    assert.equal(sample.contacts[0]!.targetId, "floor");
    assert.ok(Math.abs(sample.contacts[0]!.pointWorld[1]) < 1e-12);
  }
  const stable: KnockdownMotion.Sample = action.sample(0.5);
  config.context.frame.origin[0] = 100;
  config.entry.pose.spine = { lumbar: { flexion: 40 } };
  assert.deepEqual(action.sample(0.5), stable);
  assert.throws(
    (): KnockdownMotion =>
      new KnockdownMotion({ ...downFixture(), actorId: "unrelated" }),
  );
  assert.throws(
    (): KnockdownMotion =>
      new KnockdownMotion({ ...downFixture(), duration: 1 }),
  );
  assert.throws((): KnockdownMotion.Sample => action.sample(Infinity));
  const moving: KnockdownMotion.Config = downFixture();
  moving.entry.pose.arms = { left: { elbow: { flexion: 60 } }, right: {} };
  moving.entryRates = [
    { channel: "arms.left.elbow.flexion", degreesPerSecond: 20 },
  ];
  const continued: KnockdownMotion = new KnockdownMotion(moving);
  const h: number = 0.000001;
  const rate: number =
    (continued.sample(h).pose.arms!.left.elbow!.flexion! -
      continued.sample(0).pose.arms!.left.elbow!.flexion!) /
    h;
  assert.ok(Math.abs(rate - 20) < 0.001);
  assert.equal(continued.impact.time, 150);
}

/**
 * Keep visible hand counts and celebration independent of actual lower-body ownership.
 *
 * Scenarios:
 * 1. All ten count numbers extend the correct total across the two real hands.
 * 2. Pointing, stoppage and celebration preserve root, support and leg requests.
 * 3. Negative time retains the entry and invalid count/duration refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Executes GestureMotion over an explicitly non-neutral lower-body fixture and reads public pose scalars. It catches accidental foot reset, root replacement, count labels without finger articulation and inherited strike tasks. No moving-image quality is claimed.
 * @evidence contracts/testing.md#independent-cases Counts 1..5 use index-to-little then thumb; 6..10 retain five on the primary hand plus the remainder on the other. Exact supplied leg/root/support values, source immutability and invalid 0/11 counts provide independent expectations.
 */
export function test_down_gestures(): void {
  const entry: MotionAction.Sample = downFixture().entry;
  entry.pose.legs = {
    left: { knee: { flexion: 23 } },
    right: { knee: { flexion: 18 } },
  };
  entry.rootOffset = [0.3, -0.02, -0.1];
  const saved: MotionAction.Sample = structuredClone(entry);
  for (let count: number = 1; count <= 10; count++) {
    const sample: MotionAction.Sample = GestureMotion.sample(
      "count",
      entry,
      0.3,
      { side: "right", count },
    );
    let extended: number = 0;
    for (const side of ["left", "right"] as const) {
      for (const [index, digit] of (
        ["index", "middle", "ring", "little"] as const
      ).entries()) {
        const open: boolean = count >= index + (side === "right" ? 1 : 6);
        const mcp: number = AutoMovieHumanRigControls.readApplied(
          sample.pose,
          `arms.${side}.hand.${digit}.mcpFlexion`,
          [],
        );
        const pip: number = AutoMovieHumanRigControls.readApplied(
          sample.pose,
          `arms.${side}.hand.${digit}.pipFlexion`,
          [],
        );
        const dip: number = AutoMovieHumanRigControls.readApplied(
          sample.pose,
          `arms.${side}.hand.${digit}.dipFlexion`,
          [],
        );
        assert.equal(mcp, open ? 0 : 65);
        assert.equal(pip, open ? 0 : 80);
        assert.equal(dip, open ? 0 : 55);
        if (mcp === 0 && pip === 0 && dip === 0) extended++;
      }
      const thumbOpen: boolean = count >= (side === "right" ? 5 : 10);
      const thumbMcp: number = AutoMovieHumanRigControls.readApplied(
        sample.pose,
        `arms.${side}.hand.thumb.mcpFlexion`,
        [],
      );
      const thumbIp: number = AutoMovieHumanRigControls.readApplied(
        sample.pose,
        `arms.${side}.hand.thumb.ipFlexion`,
        [],
      );
      assert.equal(thumbMcp, thumbOpen ? 0 : 35);
      assert.equal(thumbIp, thumbOpen ? 0 : 45);
      if (thumbMcp === 0 && thumbIp === 0) extended++;
    }
    assert.equal(extended, count);
  }
  for (const kind of ["celebrate", "direct-corner", "stop"] as const) {
    const sample: MotionAction.Sample = GestureMotion.sample(kind, entry, 1, {
      side: "left",
    });
    assert.deepEqual(sample.pose.legs, entry.pose.legs);
    assert.deepEqual(sample.rootOffset, entry.rootOffset);
    assert.deepEqual(sample.support, entry.support);
    assert.equal(sample.effectors.length, 0);
  }
  assert.deepEqual(entry, saved);
  const idle: MotionAction.Sample = GestureMotion.sample(
    "celebrate",
    entry,
    -0.01,
    { side: "left" },
  );
  assert.equal(idle.phase, "idle");
  assert.deepEqual(idle.pose, entry.pose);
  assert.deepEqual(idle.rootOffset, entry.rootOffset);
  assert.deepEqual(idle.support, entry.support);
  assert.throws(
    (): MotionAction.Sample =>
      GestureMotion.sample("count", entry, 0, { side: "left", count: 0 }),
  );
  assert.throws(
    (): MotionAction.Sample =>
      GestureMotion.sample("count", entry, 0, { side: "left", count: 11 }),
  );
  assert.throws(
    (): MotionAction.Sample =>
      GestureMotion.sample("stop", entry, 0, { side: "left", duration: 0 }),
  );
}

/** A pure rigid carrier fixture; clinical Human behavior is intentionally outside it. */
function rigidFixture(
  _pose?: IAutoMovieHumanPose,
): AutoMovieHumanSkeleton.IOutput {
  return {
    bones: [],
    posed: [{ bone: "hips", position: [0, 0, 0], rotation: [0, 0, 0, 1] }],
    clamped: [],
  };
}

/** One supported synthetic shape for clock and immutable ownership checks. */
function downFixture(): KnockdownMotion.Config {
  return {
    actorId: "receiver",
    entry: {
      pose: {},
      rootOffset: [0, 0, 0],
      support: { left: 0.5, right: 0.5 },
      effectors: [],
      phase: "contact",
      elapsed: 150,
      progress: 1,
    },
    impact: {
      actionId: "high-kick",
      actorId: "attacker",
      targetId: "receiver",
      time: 150,
      relation: "body",
      point: [0, 1.7, 0],
      normal: [0, 0, 1],
    },
    side: "right",
    duration: 30,
    timing: { attemptStart: 8, attemptDuration: 5 },
    context: {
      evaluatePose: rigidFixture,
      points: [
        { bone: "hips", localPoint: [0, 0, 0] },
        { bone: "hips", localPoint: [0, 1, 0.2] },
        { bone: "hips", localPoint: [0, 1, -0.2] },
      ],
      frame: { origin: [0, 0, 0], yawRadians: 0 },
      floorY: 0,
    },
  };
}
