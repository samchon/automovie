import assert from "node:assert/strict";

import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { DefenseMotion } from "../../../../src/motion/defense/DefenseMotion";

/**
 * Pin real receiving points, independent actor placement and contact-triggered return.
 *
 * Scenarios:
 * 1. Catch/parry use the named actual glove point while preserving the other guard.
 * 2. Slip and weave require actual original plantar geometry and refuse a target-only context.
 * 3. Incoming contact holds its stopped state through dwell, then returns independently of attacker clock.
 * 4. Seeded placements remain deterministic and malformed geometry/events refuse.
 *
 * @evidence contracts/testing.md#observable-behavior Executes real defense samples and incoming-contact recovery. Observes named effector identity, target displacement, support shares, clinical articulation, exact stopped state before/at the dwell boundary and connected return afterward. Detects detached guard identities, ignored contact dwell, attacker-clock misuse and instantaneous guard reset. This portable layer cannot establish rendered interception or actual support.
 * @evidence contracts/testing.md#independent-cases IBA catch/parry/rotational-defense supplies distinct hand and supported-body relations, not numeric pose angles. Metre endpoints and phase durations are explicit test requests; contact starts from a deliberately different constrained pose and attacker timestamp, so resetting to a planned peak would fail. The actual-Human anatomy unit owns check path/support-phase requests; Viewer and Engine consumer checks own geometric admission.
 */
export function test_defense(): void {
  const request: MotionAction.Request = {
    id: "receiving-one",
    actorId: "receiver",
    targetId: "attacker",
    side: "left",
    leadSide: "left",
    direction: [1, 0, 0],
    timing: {
      preparation: 0.1,
      delivery: 0.12,
      contact: 0.04,
      retraction: 0.2,
      recovery: 0.1,
    },
  };
  const context: MotionAction.Context = {
    basePose: {
      legs: {
        left: { knee: { flexion: 10 } },
        right: { knee: { flexion: 10 } },
      },
    },
    target: [0.3, 1.5, 0.1],
    geometry: {},
  };
  const config: DefenseMotion.Config = {
    guard: {
      left: {
        bone: "leftHand",
        localPoint: [0.04, 0, 0],
        target: [0.2, 1.5, 0.14],
        radius: 0.09,
      },
      right: {
        bone: "rightHand",
        localPoint: [0.04, 0, 0],
        target: [0.12, 1.5, -0.14],
        radius: 0.09,
      },
    },
    receiving: {
      bone: "leftHand",
      localPoint: [0.04, 0, 0],
      restTarget: [0.2, 1.5, 0.14],
      target: [0.3, 1.5, 0.1],
      radius: 0.09,
    },
    parryDisplacement: [0, 0, 0.07],
  };
  const caught: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    request,
    context,
    0.22,
    config,
  );
  assert.equal(caught.effectors.length, 2);
  assert.equal(caught.effectors[0]!.bone, "leftHand");
  vector(caught.effectors[0]!.target, [0.3, 1.5, 0.1]);
  vector(caught.effectors[1]!.target, config.guard.right.target);
  vector(caught.effectors[0]!.localPoint!, [0.04, 0, 0]);
  const parried: MotionAction.Sample = DefenseMotion.sample(
    "parry",
    request,
    context,
    0.22,
    config,
  );
  vector(parried.effectors[0]!.target, [0.3, 1.5, 0.17]);
  const right: MotionAction.Request = {
    ...request,
    id: "other-side",
    actorId: "another-receiver",
    targetId: "another-attacker",
    side: "right",
    leadSide: "right",
  };
  const evasion: DefenseMotion.Config = {
    ...config,
    rootDropMetres: 0.08,
    lateralMetres: 0.05,
  };
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("slip", request, context, 0.22, evasion),
    /actual evaluator, original WORLD plantar frames/,
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("weave", request, context, 0.19, evasion),
    /actual evaluator, original WORLD plantar frames/,
  );

  // The receiver's stopped sample is deliberately unrelated to the planned peak.
  const stopped: MotionAction.Sample = structuredClone(caught);
  stopped.elapsed = 0.173;
  stopped.rootOffset = [-0.021, -0.013, 0.017];
  stopped.pose.pelvis = { rotation: 7 };
  stopped.effectors[0]!.target = [0.27, 1.49, 0.12];
  const event: MotionAction.ContactEvent = {
    actionId: "incoming-strike",
    actorId: "attacker",
    targetId: "receiver",
    time: 8.4,
    relation: "guard",
    point: [2, 1.5, 0],
    normal: [-1, 0, 0],
  };
  const contact: MotionAction.Context = {
    ...context,
    contact: { event, sample: stopped },
  };
  const release: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    request,
    contact,
    0.18,
    { ...config, contactElapsed: 0 },
  );
  vector(release.rootOffset, stopped.rootOffset);
  vector(release.effectors[0]!.target, stopped.effectors[0]!.target);
  near(release.pose.pelvis?.rotation ?? 0, 7);
  for (const age of [0.02, 0.04]) {
    const held: MotionAction.Sample = DefenseMotion.sample(
      "catch",
      request,
      contact,
      0.18 + age,
      { ...config, contactElapsed: age },
    );
    assert.equal(held.phase, "contact");
    vector(held.rootOffset, stopped.rootOffset);
    vector(held.effectors[0]!.target, stopped.effectors[0]!.target);
    near(held.pose.pelvis?.rotation ?? 0, 7);
  }
  const afterDwell: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    request,
    contact,
    0.220001,
    { ...config, contactElapsed: 0.040001 },
  );
  assert.equal(afterDwell.phase, "retraction");
  assert.ok(afterDwell.progress > 0 && afterDwell.progress < 1);
  const midway: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    request,
    contact,
    0.32,
    { ...config, contactElapsed: 0.14 },
  );
  assert.ok(
    midway.effectors[0]!.target[0] < 0.27 &&
      midway.effectors[0]!.target[0] > 0.2,
  );
  const recovered: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    request,
    contact,
    0.42,
    {
      ...config,
      contactElapsed: request.timing.contact + request.timing.retraction,
    },
  );
  vector(recovered.effectors[0]!.target, config.guard.left.target);
  vector(recovered.rootOffset, [0, 0, 0]);
  const anticipated: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    request,
    contact,
    0.22,
    config,
  );
  vector(anticipated.effectors[0]!.target, caught.effectors[0]!.target);
  const varied: MotionAction.Request = {
    ...request,
    variation: {
      seed: 73,
      timingFraction: 0.05,
      aimMetres: 0.01,
      amplitudeFraction: 0.03,
    },
  };
  const earlier: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    varied,
    context,
    0.18,
    config,
  );
  DefenseMotion.sample("guard", right, context, 3, config);
  vector(
    DefenseMotion.sample("catch", varied, context, 0.18, config).effectors[0]!
      .target,
    earlier.effectors[0]!.target,
  );
  const variedPeak: MotionAction.Sample = DefenseMotion.sample(
    "catch",
    varied,
    context,
    0.235,
    config,
  );
  assert.ok(
    Math.hypot(
      ...variedPeak.effectors[0]!.target.map(
        (value: number, axis: number): number =>
          value - config.receiving!.target[axis],
      ),
    ) <= 0.01000001,
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("catch", request, context, 0.2, {
        ...config,
        contactElapsed: 0,
      }),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample(
        "catch",
        request,
        {
          ...contact,
          contact: {
            event: { ...event, targetId: "unrelated" },
            sample: stopped,
          },
        },
        0.2,
        { ...config, contactElapsed: 0 },
      ),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("check", request, context, 0.2, config),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("catch", request, context, 0.2, {
        ...config,
        receiving: undefined,
      }),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("slip", request, context, 0.2, config),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("guard", request, context, 0.2, {
        ...config,
        guardBinding: "clinical",
      }),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("catch", request, context, 0.2, {
        ...config,
        receivingReturn: "clinical",
      }),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("catch", request, context, 0.2, {
        ...config,
        guard: {
          ...config.guard,
          left: { ...config.guard.left, bone: "leftLowerLeg" },
        },
      }),
  );
  assert.throws(
    (): MotionAction.Sample =>
      DefenseMotion.sample("catch", request, context, 0.2, {
        ...config,
        receiving: { ...config.receiving!, radius: -1 },
      }),
  );
  const hole: number[] = new Array(3);
  hole[0] = 0;
  hole[2] = 0;
  for (const tuple of [hole, [0, 0], [0, 0, 0, 0], [0, Number.NaN, 0]]) {
    const invalid: MotionAction.Vec3 = tuple as MotionAction.Vec3;
    assert.throws(
      (): MotionAction.Sample =>
        DefenseMotion.sample("guard", request, context, 0.2, {
          ...config,
          guard: {
            ...config.guard,
            left: { ...config.guard.left, target: invalid },
          },
        }),
    );
    assert.throws(
      (): MotionAction.Sample =>
        DefenseMotion.sample("guard", request, context, 0.2, {
          ...config,
          guard: {
            ...config.guard,
            right: { ...config.guard.right, localPoint: invalid },
          },
        }),
    );
    assert.throws(
      (): MotionAction.Sample =>
        DefenseMotion.sample("catch", request, context, 0.2, {
          ...config,
          receiving: { ...config.receiving!, restTarget: invalid },
        }),
    );
    assert.throws(
      (): MotionAction.Sample =>
        DefenseMotion.sample("parry", request, context, 0.2, {
          ...config,
          parryDisplacement: invalid,
        }),
    );
    assert.throws(
      (): MotionAction.Sample =>
        DefenseMotion.sample("check", request, context, 0.2, {
          ...config,
          receiving: { ...config.receiving!, bone: "leftLowerLeg" },
          supportShift: invalid,
        }),
    );
  }
}

/** Compare authored scalar endpoints independently of the sampler. */
function near(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-10,
    `${actual} differs from ${expected}`,
  );
}

/** Compare independently specified metre coordinates component by component. */
function vector(actual: MotionAction.Vec3, expected: MotionAction.Vec3): void {
  for (const axis of [0, 1, 2] as const) near(actual[axis], expected[axis]);
}
