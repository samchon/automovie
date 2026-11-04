import {
  AutoMovieHumanRigControls,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";

import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { PunchAction } from "../../../../src/motion/punch/PunchAction";
import { PunchCombination } from "../../../../src/motion/punch/PunchCombination";
import { PunchContinuation } from "../../../../src/motion/punch/PunchContinuation";

/**
 * Preserve declared full-arm entry values and tangents outside solver selection.
 * @evidence contracts/testing.md#observable-behavior Uses explicit source-only scalar/WORLD fixtures to test endpoint/rate conditions and immutable ownership. Forearm, wrist, girdle and finger rates are checked independently of shoulder3+elbow selection; unknown, missing and foreign rates refuse. No supported-body, actual velocity measurement or visual approval is claimed by these fixtures.
 * @evidence contracts/testing.md#independent-cases Supplied entry values/rates and original terminal values are independent oracles. Fixed h/h2 forward differences must approach the declared endpoint tangent while exact endpoints remain unchanged. Both anatomical sides, nonzero wrist/finger rates and a clinical guard return distinguish this from a four-channel or neutral-reset implementation.
 */
export function test_punch_full_arm_continuation(): void {
  for (const side of ["left", "right"] as const) {
    const source: PunchContinuation.Input = fixture(side, 0.3);
    const fixed: MotionAction.Immutable<PunchContinuation.Input> =
      PunchContinuation.create(source, side);
    const other: MotionAction.Side = side === "left" ? "right" : "left";
    const guard: IAutoMovieHumanPose = {
      arms: {
        left: structuredClone(source.arm),
        right: structuredClone(source.arm),
      },
    };
    guard.arms![side].forearm!.pronation = 65;
    guard.arms![side].hand!.index!.mcpFlexion = 75;
    const before: string = JSON.stringify(guard.arms![other]);
    const entry: IAutoMovieHumanPose = PunchContinuation.arm(
      fixed,
      0,
      side,
      guard,
      guard,
    );
    for (const row of source.rates) {
      const expected: IAutoMovieHumanPose = {
        arms: { left: {}, right: {}, [side]: source.arm },
      };
      close(
        AutoMovieHumanRigControls.readApplied(entry, row.channel, []),
        AutoMovieHumanRigControls.readApplied(expected, row.channel, []),
      );
    }
    for (const suffix of [
      "forearm.pronation",
      "wrist.flexion",
      "shoulderGirdle.elevation",
      "hand.index.mcpFlexion",
    ]) {
      const path: AutoMovieHumanRigControls.DegreeChannel =
        AutoMovieHumanRigControls.channel(`arms.${side}.${suffix}`);
      const expected: number = source.rates.find(
        (row: PunchContinuation.Input["rates"][number]): boolean =>
          row.channel === path,
      )!.degreesPerSecond!;
      const initial: number = AutoMovieHumanRigControls.readApplied(
        entry,
        path,
        [],
      );
      const h: number = 0.000001;
      const coarse: number =
        (AutoMovieHumanRigControls.readApplied(
          PunchContinuation.arm(fixed, h, side, guard, guard),
          path,
          [],
        ) -
          initial) /
        h;
      const fine: number =
        (AutoMovieHumanRigControls.readApplied(
          PunchContinuation.arm(fixed, h / 2, side, guard, guard),
          path,
          [],
        ) -
          initial) /
        (h / 2);
      assert.ok(
        Math.abs(fine - expected) <= Math.abs(coarse - expected) + 1e-7,
      );
      assert.ok(
        Math.abs(fine - expected) < 0.01,
        `${path} declared source tangent`,
      );
    }
    const completed: IAutoMovieHumanPose = PunchContinuation.returnArm(
      fixed,
      fixed.endSeconds,
      side,
      guard,
      guard,
    );
    assert.deepEqual(completed.arms![side], guard.arms![side]);
    assert.equal(JSON.stringify(entry.arms![other]), before);
    const frame: NonNullable<MotionAction.Context["frame"]> = {
      origin: [0, 0, 0],
      yawRadians: 0,
    };
    assert.deepEqual(
      PunchContinuation.point(fixed, 0, frame),
      source.from.pointWorld,
    );
    assert.deepEqual(
      PunchContinuation.point(fixed, fixed.endSeconds, frame),
      source.terminal.pointWorld,
    );
    const h: number = 0.000001;
    const next: MotionAction.Vec3 = PunchContinuation.point(fixed, h, frame)!;
    for (let index: number = 0; index < 3; index++)
      assert.ok(
        Math.abs(
          (next[index]! - source.from.pointWorld[index]!) / h -
            source.from.velocityWorld[index]!,
        ) < 0.001,
      );
    source.arm.hand!.index!.mcpFlexion = 1;
    assert.equal(fixed.arm.hand!.index!.mcpFlexion, 35);
    const unknown: PunchContinuation.Input = fixture(side, 0.3);
    unknown.rates.find(
      (row: PunchContinuation.Input["rates"][number]): boolean =>
        row.channel.endsWith("hand.index.mcpFlexion"),
    )!.degreesPerSecond = undefined;
    assert.throws(
      (): MotionAction.Immutable<PunchContinuation.Input> =>
        PunchContinuation.create(unknown, side),
      /unknown/,
    );
    const missing: PunchContinuation.Input = fixture(side, 0.3);
    missing.rates.pop();
    assert.throws(
      (): MotionAction.Immutable<PunchContinuation.Input> =>
        PunchContinuation.create(missing, side),
      /missing/,
    );
    assert.throws(
      (): MotionAction.Immutable<PunchContinuation.Input> =>
        PunchContinuation.create(fixture(other, 0.3), side),
      /foreign/,
    );
  }
}

/**
 * Keep original jab identity/deadline while admitting an independent continuing cross.
 * @evidence contracts/testing.md#observable-behavior Exercises the actual combination factory with explicit source-only entries. Existing instances, independent IDs, opposite writers and the original jab deadline are checked; no actor state, native fitting or fabricated contact is used as an oracle.
 * @evidence contracts/testing.md#independent-cases Independent duration arithmetic catches restarted recovery. A late return endpoint, shared action ID and missing cross entry are negative cases. The actual host owns duplicate-writer atomicity, current-state entry and final body/arm/support/rate inspection.
 */
export function test_punch_combination_ownership(): void {
  const timing: MotionAction.Timing = {
    preparation: 0.1,
    delivery: 0.2,
    contact: 0.04,
    retraction: 0.3,
    recovery: 0.1,
  };
  const request: MotionAction.Request = {
    id: "original-jab",
    actorId: "actor",
    targetId: "receiver",
    side: "left",
    leadSide: "left",
    direction: [1, 0, 0],
    timing,
  };
  const jab: PunchAction.Instance = PunchAction.create("jab", request);
  const rear: MotionAction.Request = {
    ...request,
    id: "independent-cross",
    side: "right",
  };
  const peak: number = timing.preparation + timing.delivery;
  const cross: PunchAction.Instance = PunchAction.create(
    "cross",
    rear,
    fixture("right", peak),
  );
  const entry: PunchContinuation.Entry = fixture("left", jab.duration - 0.36);
  const combination: PunchCombination.Instance = PunchCombination.create({
    jab,
    cross,
    jabStart: 0,
    crossStart: 0.36,
    jabReturn: entry,
  });
  close(combination.duration, 0.36 + cross.duration);
  assert.equal(jab.request.id, "original-jab");
  assert.deepEqual(cross.armChannels, [
    "arms.right.shoulder.flexion",
    "arms.right.shoulder.abduction",
    "arms.right.shoulder.rotation",
    "arms.right.elbow.flexion",
  ]);
  assert.throws(
    (): PunchCombination.Instance =>
      PunchCombination.create({
        jab,
        cross,
        jabStart: 0,
        crossStart: 0.36,
        jabReturn: { ...entry, endSeconds: entry.endSeconds + 0.1 },
      }),
    /deadline/,
  );
  assert.throws(
    (): PunchCombination.Instance =>
      PunchCombination.create({
        jab,
        cross: PunchAction.create(
          "cross",
          { ...rear, id: request.id },
          fixture("right", peak),
        ),
        jabStart: 0,
        crossStart: 0.36,
        jabReturn: entry,
      }),
    /writers/,
  );
  assert.throws(
    (): PunchCombination.Instance =>
      PunchCombination.create({
        jab,
        cross: PunchAction.create("cross", rear),
        jabStart: 0,
        crossStart: 0.36,
        jabReturn: entry,
      }),
    /actual-entry/,
  );
}

/** Declared source-only fixture; actual applied rate provenance is tested by the lab consumer. */
function fixture(
  side: MotionAction.Side,
  endSeconds: number,
): PunchContinuation.Input {
  const arm: PunchContinuation.Input["arm"] = {
    shoulderGirdle: { elevation: 2, upwardRotation: 8, protraction: 5 },
    shoulder: { flexion: 30, abduction: 3, rotation: 5 },
    elbow: { flexion: 100 },
    forearm: { pronation: 30 },
    wrist: { flexion: 0, radialDeviation: 0 },
    hand: { index: { mcpFlexion: 35, pipFlexion: 65, dipFlexion: 20 } },
  };
  const values: [string, number][] = [
    ["shoulderGirdle.elevation", 3],
    ["shoulderGirdle.upwardRotation", 0],
    ["shoulderGirdle.protraction", 0],
    ["shoulder.flexion", 25],
    ["shoulder.abduction", 0],
    ["shoulder.rotation", 0],
    ["elbow.flexion", -12],
    ["forearm.pronation", -25],
    ["wrist.flexion", 20],
    ["wrist.radialDeviation", 0],
    ["hand.index.mcpFlexion", 15],
    ["hand.index.pipFlexion", 0],
    ["hand.index.dipFlexion", 0],
  ];
  return {
    arm,
    rates: values.map(
      ([path, degreesPerSecond]: [
        string,
        number,
      ]): PunchContinuation.Input["rates"][number] => ({
        channel: AutoMovieHumanRigControls.channel(`arms.${side}.${path}`),
        degreesPerSecond,
      }),
    ),
    from: { pointWorld: [0.2, 1.4, 0.1], velocityWorld: [0.4, -0.2, 0.1] },
    terminal: { pointWorld: [0.6, 1.5, 0.1], velocityWorld: [0, 0, 0] },
    endSeconds,
    provenance: {
      time: 1,
      h: 0.001,
      h2: 0.0005,
      oneSided: "before",
      branch: "free",
      velocityError: 0.01,
    },
  };
}
/** Double-arithmetic endpoint agreement, not a physical fitting tolerance. */
function close(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-10);
}
