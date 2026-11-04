import { Quaternion } from "@automovie/engine";
import {
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";

import { createPersonParameters } from "../../../../src/createPersonParameters";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { PunchAction } from "../../../../src/motion/punch/PunchAction";
import { PunchArm } from "../../../../src/motion/punch/PunchArm";
import { PunchTiming } from "../../../../src/motion/punch/PunchTiming";

/**
 * Verify sourced timings, phase boundaries and independent placement ownership.
 *
 * Scenarios:
 * 1. Primary bag-study means and the published rear-hook inconsistency retain their units.
 * 2. Each authored boundary selects the following phase and endpoints retain guard/target.
 * 3. Independent identities and nested input/output mutations cannot alter the instance.
 *
 * @evidence contracts/testing.md#observable-behavior Executes the real timing owner, body plan and actual-placement arm authoring in a portable process. A declared source-only body fixture isolates phase/ownership logic; it provides no physical admission. Assertions catch phase units, identity coupling, mutation and a second body-policy application. Actual support and visual review remain separate.
 * @evidence contracts/testing.md#independent-cases Table6 is the independent timing oracle and synthetic fixed metre landmarks define guard/target endpoints. Explicit mutation attempts and invalid jab/cross roles cover ownership and refusal boundaries. Separate exported cases own paths, contact and perturbations so one failure does not prevent their execution.
 */
export function test_punch_timing_and_ownership(): void {
  const jab: ReturnType<typeof PunchTiming.bagStudy2021> =
    PunchTiming.bagStudy2021("jab");
  close(jab.delivery, 0.117);
  close(jab.contact, 0.144);
  close(jab.retraction, 0.262);
  close(PunchTiming.measurement("cross").delivery, 0.111);
  close(PunchTiming.measurement("cross").retraction, 0.169);
  close(PunchTiming.measurement("uppercut").delivery, 0.071);
  close(PunchTiming.measurement("uppercut").retraction, 0.171);
  const hook: PunchTiming.Measurement = PunchTiming.measurement("hook");
  close(hook.delivery + hook.contact + hook.retraction, 0.4);
  close(hook.reportedTotal, 0.441);
  assert.deepEqual(hook.unmeasuredPhases, [
    "preparation",
    "post-guard-recovery",
  ]);
  const action: PunchAction.Instance = PunchAction.create(
    "jab",
    request("left"),
  );
  const data: MotionAction.Context = context("left");
  assert.equal(sample(action, -0.1, data).phase, "idle");
  assert.equal(sample(action, 0.1, data).phase, "delivery");
  const deliveryEnd: number = 0.1 + 0.2;
  const contactEnd: number = deliveryEnd + 0.04;
  const retractionEnd: number = contactEnd + 0.3;
  assert.equal(sample(action, deliveryEnd, data).phase, "contact");
  assert.equal(sample(action, contactEnd, data).phase, "retraction");
  assert.equal(sample(action, retractionEnd, data).phase, "recovery");
  assert.equal(sample(action, retractionEnd + 0.1, data).phase, "complete");
  point(actorPoint(sample(action, 0.3, data)), data.target);
  point(sample(action, 0.74, data).effectors[0]!.target, data.geometry.hand!);
  const another: PunchAction.Instance = PunchAction.create("jab", {
    ...request("left"),
    id: "another-local-placement",
    actorId: "different-actor",
    targetId: "different-target",
  });
  point(
    sample(action, 0.2, data).effectors[0]!.target,
    sample(another, 0.2, data).effectors[0]!.target,
  );
  const guardBefore: string = JSON.stringify(data.basePose);
  sample(action, 0.2, data).pose.arms!.right.elbow!.flexion = 0;
  assert.equal(JSON.stringify(data.basePose), guardBefore);
  assert.throws(
    (): PunchAction.Instance =>
      PunchAction.create("jab", { ...request("left"), side: "right" }),
  );
  assert.throws(
    (): PunchAction.Instance => PunchAction.create("cross", request("left")),
  );
  const source: MotionAction.Request = {
    ...request("left"),
    variation: {
      seed: 42,
      timingFraction: 0.1,
      aimMetres: 0.01,
      amplitudeFraction: 0.1,
    },
  };
  const isolated: PunchAction.Instance = PunchAction.create("jab", source);
  const before: MotionAction.Sample = sample(isolated, 0.2, data);
  const duration: number = isolated.duration;
  const resolvedDelivery: number = isolated.timing.delivery;
  const fixedAim: MotionAction.Vec3 = [...isolated.aimOffset];
  assert.equal(Reflect.set(isolated.aimOffset, "0", 9), false);
  point(
    actorPoint(
      sample(
        isolated,
        isolated.timing.preparation + isolated.timing.delivery,
        data,
      ),
    ),
    data.target.map(
      (value: number, index: number): number => value + fixedAim[index]!,
    ) as MotionAction.Vec3,
  );
  source.timing.delivery = 8;
  source.direction[0] = -1;
  source.variation!.seed = 999;
  assert.equal(Reflect.set(isolated.request.timing, "delivery", 9), false);
  assert.equal(Reflect.set(isolated.request.direction, "0", -1), false);
  assert.equal(Reflect.set(isolated.request.variation!, "seed", 999), false);
  assert.equal(Reflect.set(isolated.timing, "delivery", 9), false);
  assert.equal(Reflect.set(isolated, "duration", 9), false);
  close(isolated.duration, duration);
  close(isolated.timing.delivery, resolvedDelivery);
  point(
    sample(isolated, 0.2, data).effectors[0]!.target,
    before.effectors[0]!.target,
  );
  point([...isolated.aimOffset], fixedAim);
}

/**
 * Verify mirrored clinical controls, distinct paths and actual-patch requirements.
 *
 * Scenarios:
 * 1. Opposite stances exchange anatomical hands and support shares.
 * 2. Hook and uppercut paths differ from the straight delivery before impact.
 * 3. Turning punches require retained pivot witnesses; direction changes root intent.
 *
 * @evidence contracts/testing.md#observable-behavior Samples the real reusable technique definitions without a host. It catches fixed-handedness, identical technique paths, missing pivot admission and ignored direction while leaving physical realization to actual-Human consumer checks.
 * @evidence contracts/testing.md#independent-cases Anatomical reflection requires opposite signed axial turn and the same factual segment lengths and included-angle law, rather than identical iterative solver coordinates. Compact hook/uppercut coaching supplies the bent/lateral/rising relation. Synthetic named patches establish support identities. Timing, blocked return and variation are separate cases.
 */
export function test_punch_techniques_and_mirroring(): void {
  const left: PunchAction.Instance = PunchAction.create("jab", request("left"));
  const right: PunchAction.Instance = PunchAction.create(
    "jab",
    request("right"),
  );
  const a: MotionAction.Sample = sample(left, 0.3, context("left"));
  const b: MotionAction.Sample = sample(right, 0.3, context("right"));
  close(a.pose.pelvis!.rotation!, -b.pose.pelvis!.rotation!);
  for (const [sample, side] of [
    [a, "left"],
    [b, "right"],
  ] as const) {
    const data: MotionAction.Context = context(side);
    const facts: AutoMovieHumanSkeleton.IOutput = data.evaluatePose!(
      sample.pose,
    );
    const joint: (bone: string) => MotionAction.Vec3 = (
      bone: string,
    ): MotionAction.Vec3 =>
      facts.posed.find(
        (row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone,
      )!.position;
    const shoulder: MotionAction.Vec3 = joint(`${side}UpperArm`);
    const elbow: MotionAction.Vec3 = joint(`${side}LowerArm`);
    const wrist: MotionAction.Vec3 = joint(`${side}Hand`);
    const upper: number = distance(shoulder, elbow);
    const lower: number = distance(elbow, wrist);
    close(upper, data.geometry.upperArmMetres!);
    close(lower, data.geometry.forearmMetres!);
    const cosine: number =
      (upper * upper + lower * lower - distance(shoulder, wrist) ** 2) /
      (2 * upper * lower);
    close(
      (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI,
      180 - sample.pose.arms![side].elbow!.flexion!,
    );
    assert.ok(sample.pose.arms![side].elbow!.flexion! >= 12 - 1e-10);
  }
  close(a.pose.arms!.right.elbow!.flexion!, 115);
  close(a.support.left, b.support.right);
  close(a.support.left + a.support.right, 1);
  assert.equal(a.effectors[0]!.bone, "leftHand");
  assert.equal(b.effectors[0]!.bone, "rightHand");
  const hook: PunchAction.Instance = PunchAction.create(
    "hook",
    request("left"),
  );
  const uppercut: PunchAction.Instance = PunchAction.create(
    "uppercut",
    request("left"),
  );
  const straightPoint: MotionAction.Vec3 = actorPoint(
    sample(left, 0.2, context("left")),
  );
  assert.ok(
    actorPoint(sample(hook, 0.2, context("left")))[2] > straightPoint[2] + 0.01,
  );
  assert.ok(
    actorPoint(sample(uppercut, 0.2, context("left")))[1] <
      straightPoint[1] - 0.01,
  );
  assert.ok(
    sample(hook, 0.3, context("left")).pose.arms!.left.elbow!.flexion! > 70,
  );
  assert.equal(
    sample(hook, 0.3, context("left")).support.patches!.find(
      (patch: MotionAction.SupportPatch): boolean => patch.side === "left",
    )!.mode,
    "pivot",
  );
  assert.throws(
    (): MotionAction.Sample =>
      sample(hook, 0.2, { ...context("left"), supportPatches: undefined }),
  );
  const turned: MotionAction.Context = context("left");
  turned.target = [
    turned.geometry.shoulder![0],
    turned.geometry.hand![1],
    turned.geometry.shoulder![2] + 0.4,
  ];
  const directed: PunchAction.Instance = PunchAction.create("jab", {
    ...request("left"),
    direction: [0, 0, 3],
  });
  const output: MotionAction.Sample = sample(directed, 0.3, turned);
  point(actorPoint(output), turned.target);
  close(output.rootOffset[0], 0);
  assert.ok(output.rootOffset[2] > 0);
}

/**
 * Verify that explicit constrained contact owns a causal, continuous return.
 *
 * Scenarios:
 * 1. Contact starts at a deliberately constrained elbow, root and hand location.
 * 2. Retraction follows one retained clinical path to guard, preserving actual bone-bound geometry.
 * 3. A future event leaves earlier delivery unchanged and a foreign actor refuses.
 *
 * @evidence contracts/testing.md#observable-behavior Runs the punch with retained contact feedback through actual common recovery. Exact contact/guard endpoints and intermediate bounds catch planned-endpoint recovery and retroactive delivery changes. This portable test supplies the constrained state; the lab must independently produce it from displayed geometry.
 * @evidence contracts/testing.md#independent-cases The test explicitly chooses a blocked elbow of123degrees and root offset, then public FK supplies all matching actual joint/hand targets. That configuration is independent of the planned endpoint. Endpoint tolerances cover double arithmetic and foreign identity is negative; actual collision and force response remain actual-consumer checks.
 */
export function test_punch_constrained_recovery(): void {
  const action: PunchAction.Instance = PunchAction.create(
    "jab",
    request("left"),
  );
  const data: MotionAction.Context = context("left");
  const blocked: MotionAction.Sample = sample(action, 0.2, data);
  blocked.pose.arms!.left.elbow = { flexion: 123 };
  blocked.rootOffset = [0.025, -0.012, 0.006];
  realize(blocked, data);
  data.contact = {
    event: {
      actionId: "placement-left",
      actorId: "actor",
      targetId: "receiver",
      time: 0.2,
      relation: "guard",
      point: [2.27, 1.59, 0.19],
      normal: [-1, 0, 0],
    },
    sample: blocked,
  };
  const onset: MotionAction.Sample = sample(action, 0.2, data);
  point(onset.effectors[0]!.target, blocked.effectors[0]!.target);
  close(onset.pose.arms!.left.elbow!.flexion!, 123);
  point(onset.rootOffset, blocked.rootOffset);
  const during: MotionAction.Sample = sample(action, 0.35, data);
  const expected: MotionAction.Sample = structuredClone(during);
  realize(expected, data);
  point(during.effectors[0]!.target, expected.effectors[0]!.target);
  assert.ok(
    during.pose.arms!.left.elbow!.flexion! >=
      Math.min(123, data.basePose.arms!.left.elbow!.flexion!) - 1e-8,
  );
  assert.ok(
    during.pose.arms!.left.elbow!.flexion! <=
      Math.max(123, data.basePose.arms!.left.elbow!.flexion!) + 1e-8,
  );
  const finished: MotionAction.Sample = sample(action, 0.54, data);
  point(finished.effectors[0]!.target, data.geometry.hand!);
  close(
    finished.pose.arms!.left.elbow!.flexion!,
    data.basePose.arms!.left.elbow!.flexion!,
  );
  const noContact: MotionAction.Context = context("left");
  point(
    sample(action, 0.15, data).effectors[0]!.target,
    sample(action, 0.15, noContact).effectors[0]!.target,
  );
  data.contact.event.actorId = "foreign";
  assert.throws((): MotionAction.Sample => sample(action, 0.25, data));
}

/**
 * Verify explicit retained-pivot unwinding before a blocked cross replants.
 *
 * Scenarios:
 * 1. Retraction keeps the actual contact pivot point and smoothly reduces yaw.
 * 2. The pivot survives arm return; original plantar witnesses return after settling.
 * 3. Independent body-settling time returns load intent to the bilateral guard.
 *
 * @evidence contracts/testing.md#observable-behavior Samples a real cross with an explicit blocked pivot state through common recovery. It detects constant-yaw retention, premature anchor replacement and absent post-return plant intent. The lab must separately fit these requests and check actual world continuity.
 * @evidence contracts/testing.md#independent-cases The test uses its synthetic measured patch identities, recorded initial yaw and local release/retraction durations as the oracle. Interior retained bone/local/world coordinates must stay exact, yaw must decrease, and the original planted patch is required after return. Float tuples use tolerance, never signed-zero equality.
 */
export function test_punch_pivot_replant(): void {
  const data: MotionAction.Context = context("right");
  const placement: MotionAction.Request = {
    ...request("left"),
    id: "blocked-cross",
    side: "right",
  };
  const action: PunchAction.Instance = PunchAction.create("cross", placement);
  const stopped: MotionAction.Sample = sample(action, 0.2, data);
  realize(stopped, data);
  const pivot: MotionAction.SupportPatch = stopped.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
  )!;
  assert.equal(pivot.mode, "pivot");
  data.contact = {
    event: {
      actionId: placement.id,
      actorId: placement.actorId,
      targetId: placement.targetId,
      time: 0.2,
      relation: "guard",
      point: [1, 1.6, 0],
      normal: [-1, 0, 0],
    },
    sample: stopped,
  };
  const middle: MotionAction.Sample = sample(action, 0.39, data);
  const retained: MotionAction.SupportPatch = middle.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
  )!;
  assert.equal(retained.bone, pivot.bone);
  assert.equal(retained.mode, "pivot");
  point(retained.localPoint, pivot.localPoint);
  point(retained.world, pivot.world);
  assert.equal(retained.yawDegrees, undefined);
  close(Math.hypot(...retained.frameRotation!), 1);
  const startAngle: number = 2 * Math.acos(Math.abs(pivot.frameRotation![3]));
  const remainingAngle: number =
    2 * Math.acos(Math.abs(retained.frameRotation![3]));
  assert.ok(remainingAngle > 0 && remainingAngle < startAngle);
  const release: number = 0.2 + 0.04;
  const returned: MotionAction.Sample = sample(action, release + 0.3, data);
  const planted: MotionAction.SupportPatch = returned.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
  )!;
  assert.equal(returned.phase, "recovery");
  assert.equal(planted.mode, "pivot");
  point(returned.effectors[0]!.target, data.geometry.hand!);
  point(returned.rootOffset, [0, 0, 0]);
  const complete: MotionAction.Sample = sample(
    action,
    release + 0.3 + 0.1,
    data,
  );
  assert.equal(
    complete.support.patches!.find(
      (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
    )!.mode,
    "planted",
  );
  close(complete.support.left, 0.5);
  close(complete.support.right, 0.5);
}

/**
 * Verify measured forefoot approach, one-centre yaw/roll and explicit reverse roll.
 *
 * Scenarios:
 * 1. An initially raised same-point forefoot approaches its real floor goal after unloading.
 * 2. Delivery applies world yaw after measured roll without a competing yaw field.
 * 3. Blocked return retains floor pitch, then unloads and reverses roll before replanting.
 * 4. Excluding preparation or settling refuses an actually unprepared framed foot.
 *
 * @evidence contracts/testing.md#observable-behavior Samples real turning-punch support requests with an explicit nonidentity measured-frame fixture. Assertions catch instant ball lowering, mixed rotation representations, wrong quaternion composition, identity-pitch return under a lowered ball and skipped replant phases. Actual full-foot floor/effector fitting remains the lab's independent consumer responsibility.
 * @evidence contracts/testing.md#independent-cases The fixture starts the same forefoot point .02m above its floor anchor with a10degree world-Z roll. Independent sine/cosine rotation of the X basis checks roll-then-world-yaw order. Exact preserved anchors, intermediate free-foot height and explicit zero-duration refusals distinguish supported stage changes; no empirical angle or pressure claim is inferred.
 */
export function test_punch_measured_forefoot_frame(): void {
  const data: MotionAction.Context = context("right");
  const pivot: MotionAction.SupportPatch = data.supportPatches!.find(
    (patch: MotionAction.SupportPatch): boolean =>
      patch.side === "right" && patch.mode === "pivot",
  )!;
  const half: number = (5 * Math.PI) / 180;
  pivot.initialWorld = [pivot.world[0], 0.02, pivot.world[2]];
  pivot.frameRotation = [0, 0, Math.sin(half), Math.cos(half)];
  const placement: MotionAction.Request = {
    ...request("left"),
    id: "framed-cross",
    side: "right",
  };
  const action: PunchAction.Instance = PunchAction.create("cross", placement);
  const prepared: MotionAction.Sample = sample(action, 0.065, data);
  const approach: MotionAction.SupportPatch = prepared.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
  )!;
  assert.equal(approach.mode, "free");
  assert.equal(approach.constraint, "hard");
  assert.ok(approach.world[1] > 0 && approach.world[1] < 0.02);
  point(approach.initialWorld!, pivot.initialWorld);
  close(prepared.support.right, 0);
  assert.equal(
    prepared.support.patches!.find(
      (patch: MotionAction.SupportPatch): boolean => patch.side === "left",
    )!.mode,
    "planted",
  );
  const strike: MotionAction.Sample = sample(action, 0.2, data);
  const turned: MotionAction.SupportPatch = strike.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
  )!;
  assert.equal(turned.yawDegrees, undefined);
  close(turned.world[1], 0);
  close(Math.hypot(...turned.frameRotation!), 1);
  const [x, y, z, w]: [number, number, number, number] = turned.frameRotation!;
  const basis: MotionAction.Vec3 = [
    1 - 2 * (y * y + z * z),
    2 * (x * y + w * z),
    2 * (x * z - w * y),
  ];
  const roll: number = (10 * Math.PI) / 180;
  const yaw: number = (9 * Math.PI) / 180;
  point(basis, [
    Math.cos(yaw) * Math.cos(roll),
    Math.sin(roll),
    Math.sin(yaw) * Math.cos(roll),
  ]);
  assert.ok(strike.pose.legs!.right.foot!.hallux!.mtpFlexion! < 0);
  realize(strike, data);
  data.contact = {
    event: {
      actionId: placement.id,
      actorId: placement.actorId,
      targetId: placement.targetId,
      time: 0.2,
      relation: "guard",
      point: [1, 1.6, 0],
      normal: [-1, 0, 0],
    },
    sample: strike,
  };
  const release: number = 0.2 + 0.04;
  const returned: MotionAction.Sample = sample(action, release + 0.3, data);
  const retained: MotionAction.SupportPatch = returned.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
  )!;
  assert.equal(retained.mode, "pivot");
  point(retained.world, pivot.world);
  point(retained.initialWorld!, pivot.initialWorld);
  for (let index: number = 0; index < 4; index++)
    close(retained.frameRotation![index]!, pivot.frameRotation[index]!);
  const reversing: MotionAction.Sample = sample(
    action,
    release + 0.3 + 0.05,
    data,
  );
  const free: MotionAction.SupportPatch = reversing.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
  )!;
  assert.equal(free.mode, "free");
  assert.ok(free.world[1] > 0 && free.world[1] < 0.02);
  close(reversing.support.right, 0);
  const complete: MotionAction.Sample = sample(
    action,
    release + 0.3 + 0.1,
    data,
  );
  assert.equal(
    complete.support.patches!.find(
      (patch: MotionAction.SupportPatch): boolean => patch.side === "right",
    )!.mode,
    "planted",
  );
  close(complete.pose.legs!.right.foot?.hallux?.mtpFlexion ?? 0, 0);
  assert.throws(
    (): MotionAction.Sample =>
      PunchAction.create("cross", {
        ...placement,
        timing: { ...placement.timing, preparation: 0 },
      }).sample(0, data),
  );
  assert.throws(
    (): MotionAction.Sample =>
      PunchAction.create("cross", {
        ...placement,
        timing: { ...placement.timing, recovery: 0 },
      }).sample(0, data),
  );
}

/**
 * Consume distinct planned-frame and actual-ground results without counting an unloaded frame as support.
 *
 * @evidence contracts/testing.md#observable-behavior The real action consumes an explicitly synthetic measurement fixture with both foot frames. One world-Y yaw affects only the acting frame/minimum. Minimum-point objectives remain hard through unload and ground-role changes, while captured support survives arm return. Ground role releases after unloading; its hard trajectory remains. Actual full-foot measurement and physical realization belong to independent Human tests, not this fixture.
 * @evidence contracts/testing.md#independent-cases The fixture declares a10degree roll, .03m distinct contact offset and .02m initial frame height. Independent sine/cosine basis and offset expectations detect double yaw, clinical-pelvis contamination, conflated frame/contact and premature contact removal. Local .2s contact and authored .3/.8 recovery boundaries supply independent timing landmarks.
 */
export function test_punch_frame_and_ground_consumption(): void {
  const data: MotionAction.Context = context("right");
  const source: MotionAction.SupportPatch = data.supportPatches!.find(
    (patch: MotionAction.SupportPatch): boolean =>
      patch.side === "right" && patch.mode === "pivot",
  )!;
  source.initialWorld = [source.world[0], 0.02, source.world[2]];
  source.frameRotation = [
    0,
    0,
    Math.sin((5 * Math.PI) / 180),
    Math.cos((5 * Math.PI) / 180),
  ];
  data.supportFrame = (
    pose: IAutoMovieHumanPose,
    _rootOffset: MotionAction.Vec3,
    patch: MotionAction.SupportPatch,
  ): MotionAction.SupportMeasurement => {
    const weight: number =
      patch.side === "right"
        ? -(pose.legs?.right.ankle?.dorsiflexion ?? 0) / 12
        : 0;
    close(pose.pelvis?.rotation ?? 0, data.basePose.pelvis?.rotation ?? 0);
    const half: number = (weight * 5 * Math.PI) / 180;
    const frame: MotionAction.SupportPatch = {
      ...structuredClone(patch),
      mode: "free",
      constraint: "hard",
      world: [
        patch.world[0],
        patch.side === "right" ? 0.02 * (1 - weight) : 0,
        patch.world[2],
      ],
      frameRotation: [0, 0, Math.sin(half), Math.cos(half)],
    };
    const contact: MotionAction.SupportPatch = {
      side: patch.side,
      bone: patch.side === "right" ? "rightFoot" : "leftFoot",
      localPoint: [0.11, 0, 0],
      world: [
        frame.world[0] + (patch.side === "right" ? 0.03 : 0),
        0,
        frame.world[2],
      ],
      mode: "planted",
      constraint: "hard",
    };
    return { frame, contact };
  };
  const placement: MotionAction.Request = {
    ...request("left"),
    id: "separate-ground",
    side: "right",
  };
  const action: PunchAction.Instance = PunchAction.create("cross", placement);
  const approach: MotionAction.Sample = sample(action, 0.065, data);
  close(approach.support.right, 0);
  assert.equal(
    approach.support.patches!.filter(
      (patch: MotionAction.SupportPatch): boolean =>
        patch.side === "right" && patch.mode === "planted",
    ).length,
    0,
  );
  assert.equal(
    approach.support.patches!.filter(
      (patch: MotionAction.SupportPatch): boolean =>
        patch.side === "right" &&
        patch.mode === "free" &&
        patch.constraint === "hard",
    ).length,
    2,
  );
  const before: MotionAction.SupportPatch[] = sample(
    action,
    0.1 - 0.000005,
    data,
  ).support.patches!;
  const after: MotionAction.SupportPatch[] = sample(
    action,
    0.1 + 0.000005,
    data,
  ).support.patches!;
  assert.equal(before.length, after.length);
  for (let index: number = 0; index < before.length; index++) {
    assert.equal(before[index]!.bone, after[index]!.bone);
    point(before[index]!.localPoint, after[index]!.localPoint);
    assert.equal(before[index]!.constraint, "hard");
    assert.equal(after[index]!.constraint, "hard");
    assert.ok(
      distance(before[index]!.world, after[index]!.world) < 1e-8,
      "Ground-role change must not insert or move a hard target",
    );
  }
  const stopped: MotionAction.Sample = sample(action, 0.2, data);
  const frame: MotionAction.SupportPatch = stopped.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean =>
      patch.side === "right" && patch.frameRotation !== undefined,
  )!;
  const contact: MotionAction.SupportPatch = stopped.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean =>
      patch.side === "right" && patch.mode === "planted",
  )!;
  assert.equal(frame.mode, "free");
  assert.equal(frame.constraint, "hard");
  const opposite: MotionAction.SupportPatch = stopped.support.patches!.find(
    (patch: MotionAction.SupportPatch): boolean =>
      patch.side === "left" && patch.frameRotation !== undefined,
  )!;
  assert.deepEqual(opposite.frameRotation, [0, 0, 0, 1]);
  const [x, y, z, w]: [number, number, number, number] = frame.frameRotation!;
  const yaw: number = (9 * Math.PI) / 180;
  const roll: number = (10 * Math.PI) / 180;
  point(
    [1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y)],
    [
      Math.cos(yaw) * Math.cos(roll),
      Math.sin(roll),
      Math.sin(yaw) * Math.cos(roll),
    ],
  );
  point(contact.world, [
    frame.world[0] + 0.03 * Math.cos(yaw),
    0,
    frame.world[2] + 0.03 * Math.sin(yaw),
  ]);
  realize(stopped, data);
  data.contact = {
    event: {
      actionId: placement.id,
      actorId: placement.actorId,
      targetId: placement.targetId,
      time: 0.2,
      relation: "guard",
      point: [1, 1.6, 0],
      normal: [-1, 0, 0],
    },
    sample: stopped,
  };
  for (const elapsed of [0.39, 0.54]) {
    const returned: MotionAction.Sample = sample(action, elapsed, data);
    assert.equal(
      returned.support.patches!.length,
      stopped.support.patches!.length,
    );
    for (
      let index: number = 0;
      index < stopped.support.patches!.length;
      index++
    ) {
      const actual: MotionAction.SupportPatch =
        returned.support.patches![index]!;
      const retained: MotionAction.SupportPatch =
        stopped.support.patches![index]!;
      assert.equal(actual.bone, retained.bone);
      assert.equal(actual.mode, retained.mode);
      point(actual.localPoint, retained.localPoint);
      point(actual.world, retained.world);
      if (retained.frameRotation)
        for (let axis: number = 0; axis < 4; axis++)
          close(actual.frameRotation![axis]!, retained.frameRotation[axis]!);
    }
  }
  const released: MotionAction.Sample = sample(action, 0.59, data);
  close(released.support.right, 0);
  assert.equal(
    released.support.patches!.filter(
      (patch: MotionAction.SupportPatch): boolean =>
        patch.side === "right" && patch.mode === "planted",
    ).length,
    0,
  );
  const complete: MotionAction.Sample = sample(action, 0.64, data);
  assert.ok(
    complete.support.patches!.some(
      (patch: MotionAction.SupportPatch): boolean =>
        patch.side === "right" && patch.mode === "planted",
    ),
  );
  close(complete.support.right, 0.5);
}

/**
 * Verify deterministic bounded variation and a geometry-defined out-of-range miss.
 *
 * Scenarios:
 * 1. Fixed seeds and arbitrary sample order preserve the same output.
 * 2. Timing and aim remain within caller bounds and another seed changes the aim.
 * 3. A target beyond measured limb length reports a miss and malformed geometry refuses.
 *
 * @evidence contracts/testing.md#observable-behavior Exercises the real two-stage source boundary without replacing globals. Unchanged original pad versus actual clinical FK and native raw-pad and independent family-shape receipt reject discarded misfitting poses. A separately shifted body-placement fixture keeps the original actor-frame target and is immutable. These source facts do not admit support or a hit.
 * @evidence contracts/testing.md#independent-cases Declared .1 timing fraction, .025m aim radius and measured public FK segment lengths define independent bounds. The explicit .007m placement shift checks root conversion once; authored girdle/forearm/wrist and coupled shoulder3+elbow separate policy from blanket unlock. Changed seeds, distant miss, malformed geometry and zero retraction cover independent boundaries with unchanged .25mm seed precision.
 */
export function test_punch_variation_and_reach(): void {
  const input: MotionAction.Request = {
    ...request("left"),
    variation: {
      seed: 31,
      timingFraction: 0.1,
      aimMetres: 0.025,
      amplitudeFraction: 0.1,
    },
  };
  const action: PunchAction.Instance = PunchAction.create("jab", input);
  const repeat: PunchAction.Instance = PunchAction.create("jab", input);
  const data: MotionAction.Context = context("left");
  assert.ok(action.duration >= 0.74 * 0.9 && action.duration <= 0.74 * 1.1);
  const peak: number = action.timing.preparation + action.timing.delivery;
  const aim: MotionAction.Vec3 = actorPoint(sample(action, peak, data));
  assert.ok(
    Math.hypot(
      aim[0] - data.target[0],
      aim[1] - data.target[1],
      aim[2] - data.target[2],
    ) <=
      0.025 + 1e-12,
  );
  sample(action, action.duration, data);
  point(
    sample(action, 0.2, data).effectors[0]!.target,
    sample(repeat, 0.2, data).effectors[0]!.target,
  );
  const different: PunchAction.Instance = PunchAction.create("jab", {
    ...input,
    variation: { ...input.variation!, seed: 32 },
  });
  assert.ok(
    Math.hypot(
      ...actorPoint(
        sample(
          different,
          different.timing.preparation + different.timing.delivery,
          data,
        ),
      ).map((value: number, index: number): number => value - aim[index]!),
    ) > 1e-8,
  );
  const far: MotionAction.Context = context("left");
  far.target = [
    far.geometry.shoulder![0] + 2,
    far.geometry.shoulder![1],
    far.geometry.shoulder![2],
  ];
  const exact: PunchAction.Instance = PunchAction.create(
    "jab",
    request("left"),
  );
  const reach: PunchAction.Reach = exact.inspect(far);
  const upper: number = far.geometry.upperArmMetres!;
  const lever: number =
    far.geometry.forearmMetres! + far.geometry.gloveOffsetMetres!;
  close(
    reach.maximum,
    Math.sqrt(
      upper * upper +
        lever * lever +
        2 * upper * lever * Math.cos((12 * Math.PI) / 180),
    ),
  );
  assert.equal(reach.reachable, false);
  const missed: PunchAction.Sample = sample(exact, 0.3, far);
  const miss: MotionAction.Vec3 = actorPoint(missed);
  assert.ok(miss[0] < far.target[0]);
  const frame: PunchArm.Witness[] = PunchArm.witnesses(
    far,
    missed.pose,
    "left",
  );
  const sourcePad: MotionAction.Vec3 = frame[0]!.point;
  assert.ok(
    distance(sourcePad, missed.effectors[0]!.target) <= 0.00025,
    "Clinical path must realize the unchanged independent pad task",
  );
  const shoulder: MotionAction.Vec3 = frame[1]!.point;
  assert.ok(
    distance(sourcePad, shoulder) <= upper + lever,
    "Actual clinical shape cannot stretch the measured arm",
  );
  assert.equal(
    missed.effectors.length,
    1,
    "Internal shape witnesses are not duplicated Cartesian task authorities",
  );
  assert.deepEqual(
    missed.armFit!.points.map(
      (row: PunchArm.Fit["points"][number]): string => row.name,
    ),
    ["pad"],
    "Normal shoulder-origin motion cannot be an invented frozen target",
  );
  assert.equal(
    missed.armFit?.status,
    "realized",
    JSON.stringify(missed.armFit),
  );
  assert.ok(
    missed.armFit!.points.every(
      (row: PunchArm.Fit["points"][number]): boolean => row.error <= 0.00025,
    ),
    JSON.stringify(missed.armFit),
  );
  const shifted: MotionAction.BodyPlacement = {
    ...exact.planBody(0.3, data),
    rootOffset: [0.007, 0, 0],
  };
  const beforePlacement: string = JSON.stringify(shifted);
  const afterPlacement: PunchAction.Sample = exact.sample(0.3, data, shifted);
  point(actorPoint(afterPlacement), data.target);
  point(afterPlacement.rootOffset, [0.007, 0, 0]);
  assert.equal(JSON.stringify(shifted), beforePlacement);
  assert.deepEqual(afterPlacement.preservedChannels, [
    "arms.left.shoulderGirdle.elevation",
    "arms.left.shoulderGirdle.upwardRotation",
    "arms.left.shoulderGirdle.protraction",
    "arms.left.forearm.pronation",
    "arms.left.wrist.flexion",
    "arms.left.wrist.radialDeviation",
  ]);
  assert.throws(
    (): MotionAction.Sample => sample(exact, 0.2, { ...far, geometry: {} }),
  );
  assert.throws(
    (): PunchAction.Instance =>
      PunchAction.create("jab", {
        ...request("left"),
        timing: { ...request("left").timing, retraction: 0 },
      }),
  );
}

/** Actual public Human FK supplies arm axes; synthetic foot anchors isolate support-contract arithmetic. */
function context(side: MotionAction.Side): MotionAction.Context {
  const arm: NonNullable<IAutoMovieHumanPose["arms"]>["left"] = {
    shoulder: { flexion: 20 },
    elbow: { flexion: 115 },
  };
  const basePose: IAutoMovieHumanPose = {
    arms: { left: structuredClone(arm), right: structuredClone(arm) },
    legs: { left: { knee: { flexion: 15 } }, right: { knee: { flexion: 15 } } },
  };
  EVALUATE ??= AutoMovieHumanSkeleton.prepare(
    createPersonParameters(1800, true),
  );
  const neutral: AutoMovieHumanSkeleton.IOutput = EVALUATE({});
  const output: AutoMovieHumanSkeleton.IOutput = EVALUATE(basePose);
  const row: (bone: string) => AutoMovieHumanSkeleton.IPlacement = (
    bone: string,
  ): AutoMovieHumanSkeleton.IPlacement =>
    output.posed.find(
      (item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === bone,
    )!;
  const bind: (bone: string) => MotionAction.Vec3 = (
    bone: string,
  ): MotionAction.Vec3 =>
    neutral.posed.find(
      (item: AutoMovieHumanSkeleton.IPlacement): boolean => item.bone === bone,
    )!.position;
  const lower: MotionAction.Vec3 = bind(`${side}LowerArm`);
  const wrist: MotionAction.Vec3 = bind(`${side}Hand`);
  const shoulder: MotionAction.Vec3 = row(`${side}UpperArm`).position;
  const forearm: MotionAction.Vec3 = [
    wrist[0] - lower[0],
    wrist[1] - lower[1],
    wrist[2] - lower[2],
  ];
  const length: number = Math.hypot(...forearm);
  const neutralHand: AutoMovieHumanSkeleton.IPlacement = neutral.posed.find(
    (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
      item.bone === `${side}Hand`,
  )!;
  const inverse: { x: number; y: number; z: number; w: number } =
    Quaternion.inverse({
      x: neutralHand.rotation[0],
      y: neutralHand.rotation[1],
      z: neutralHand.rotation[2],
      w: neutralHand.rotation[3],
    });
  const localOffset: { x: number; y: number; z: number } =
    Quaternion.rotateVector(inverse, {
      x: (forearm[0] / length) * 0.08,
      y: (forearm[1] / length) * 0.08,
      z: (forearm[2] / length) * 0.08,
    });
  const local: MotionAction.Vec3 = [
    localOffset.x,
    localOffset.y,
    localOffset.z,
  ];
  const hand: AutoMovieHumanSkeleton.IPlacement = row(`${side}Hand`);
  const rotated: { x: number; y: number; z: number } = Quaternion.rotateVector(
    {
      x: hand.rotation[0],
      y: hand.rotation[1],
      z: hand.rotation[2],
      w: hand.rotation[3],
    },
    { x: local[0], y: local[1], z: local[2] },
  );
  const pad: MotionAction.Vec3 = [
    hand.position[0] + rotated.x,
    hand.position[1] + rotated.y,
    hand.position[2] + rotated.z,
  ];
  const upper: number = Math.hypot(
    ...bind(`${side}UpperArm`).map(
      (value: number, index: number): number => value - lower[index]!,
    ),
  );
  const supportPatches: MotionAction.SupportPatch[] = (
    ["left", "right"] as const
  ).flatMap((foot: MotionAction.Side): MotionAction.SupportPatch[] => {
    const bone: "leftFoot" | "rightFoot" =
      foot === "left" ? "leftFoot" : "rightFoot";
    const z: number = foot === "left" ? 0.15 : -0.15;
    return [
      {
        side: foot,
        bone,
        localPoint: [0, 0, 0],
        world: [0, 0, z],
        mode: "planted",
      },
      {
        side: foot,
        bone,
        localPoint: [0.08, 0, 0],
        world: [0.08, 0, z],
        mode: "pivot",
      },
    ];
  });
  return {
    basePose,
    target: [shoulder[0] + 0.4, pad[1], pad[2]],
    geometry: {
      shoulder,
      hand: pad,
      handLocalPoint: local,
      upperArmMetres: upper,
      forearmMetres: length,
      gloveOffsetMetres: 0.08,
      gloveRadiusMetres: 0.09,
    },
    supportPatches,
    evaluatePose: EVALUATE,
    neutral,
  };
}

/** Local timing deliberately differs from all measured profiles. */
function request(leadSide: MotionAction.Side): MotionAction.Request {
  return {
    id: `placement-${leadSide}`,
    actorId: "actor",
    targetId: "receiver",
    side: leadSide,
    leadSide,
    direction: [1, 0, 0],
    timing: {
      preparation: 0.1,
      delivery: 0.2,
      contact: 0.04,
      retraction: 0.3,
      recovery: 0.1,
    },
  };
}

/** Contract tolerance for deterministic double-precision metre/second arithmetic. */
function close(actual: number, expected: number): void {
  assert.ok(
    Math.abs(actual - expected) <= 1e-10,
    `${actual} differs from ${expected}`,
  );
}

/** Compare floats componentwise rather than treating floating tuples as exact data. */
function point(actual: MotionAction.Vec3, expected: MotionAction.Vec3): void {
  for (let index: number = 0; index < 3; index++)
    close(actual[index]!, expected[index]!);
}

/** Fixed actor-frame paths combine the requested root and its FK-local hand goal. */
function actorPoint(sample: MotionAction.Sample): MotionAction.Vec3 {
  return [
    sample.rootOffset[0] + sample.effectors[0]!.target[0],
    sample.rootOffset[1] + sample.effectors[0]!.target[1],
    sample.rootOffset[2] + sample.effectors[0]!.target[2],
  ];
}

/** Actual FK segment distance, independent of the technique's reach implementation. */
function distance(a: MotionAction.Vec3, b: MotionAction.Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** One fixed-body public evaluator is reused; each invocation returns fresh FK snapshots. */
let EVALUATE: AutoMovieHumanSkeleton.PoseEvaluator | undefined;

/** Make an explicitly authored stop configuration internally coherent through public FK. */
function realize(
  sample: MotionAction.Sample,
  data: MotionAction.Context,
): void {
  const output: AutoMovieHumanSkeleton.IOutput = data.evaluatePose!(
    sample.pose,
  );
  sample.effectors = sample.effectors.map(
    (effector: MotionAction.Effector): MotionAction.Effector => {
      const row: AutoMovieHumanSkeleton.IPlacement = output.posed.find(
        (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
          item.bone === effector.bone,
      )!;
      const local: MotionAction.Vec3 = effector.localPoint ?? [0, 0, 0];
      const offset: { x: number; y: number; z: number } =
        Quaternion.rotateVector(
          {
            x: row.rotation[0],
            y: row.rotation[1],
            z: row.rotation[2],
            w: row.rotation[3],
          },
          { x: local[0], y: local[1], z: local[2] },
        );
      return {
        ...effector,
        target: [
          row.position[0] + offset.x,
          row.position[1] + offset.y,
          row.position[2] + offset.z,
        ],
      };
    },
  );
}

/** Two-stage source fixture isolates phase and arm logic; its declared placement is not physical admission. */
function sample(
  action: PunchAction.Instance,
  elapsed: number,
  data: MotionAction.Context,
): PunchAction.Sample {
  const plan: MotionAction.BodyPlacement = action.planBody(elapsed, data);
  const before: string = JSON.stringify(plan);
  const result: PunchAction.Sample = action.sample(elapsed, data, plan);
  assert.equal(
    JSON.stringify(plan),
    before,
    "Arm authoring cannot mutate the body-placement fixture",
  );
  return result;
}
