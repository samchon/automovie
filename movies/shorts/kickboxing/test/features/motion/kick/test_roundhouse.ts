import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import assert from "node:assert/strict";
import * as THREE from "three";

import { LabActor } from "../../../../src/motion-lab/LabActor";
import type { MotionAction } from "../../../../src/motion/core/MotionAction";
import { RoundhouseAction } from "../../../../src/motion/kick/RoundhouseAction";
import { RoundhouseKinematics } from "../../../../src/motion/kick/RoundhouseKinematics";
import { RoundhouseReach } from "../../../../src/motion/kick/RoundhouseReach";

/**
 * Keep local phases, raw aims and complete return endpoints explicit on both sides.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real reusable action and actual prepared Human callback. It observes phases, root offsets, fixed-origin shin requests and support priorities; it claims no opponent contact or browser approval.
 * @evidence contracts/testing.md#independent-cases Caller durations determine each phase endpoint. The independently supplied aim and guard determine peak and completion. Both anatomical sides, negative time, preparation, return and completion exercise distinct boundaries.
 */
export function test_roundhouse_phases(): void {
  for (const side of ["left", "right"] as const) {
    const fixture: Fixture = makeFixture(side);
    const original: IAutoMovieHumanPose = structuredClone(
      fixture.context.basePose,
    );
    const action: RoundhouseAction = new RoundhouseAction(
      fixture.request,
      fixture.options,
    );
    const timing: MotionAction.Timing = action.timing;
    const peak: number = timing.preparation + timing.delivery;
    const landing: number = peak + timing.contact + timing.retraction;
    const end: number = landing + timing.recovery;
    assert.equal(action.sample(fixture.context, -0.01).phase, "idle");
    assert.equal(
      action.sample(fixture.context, timing.preparation).phase,
      "delivery",
    );
    assert.equal(action.sample(fixture.context, peak).phase, "contact");
    assert.equal(action.sample(fixture.context, landing).phase, "recovery");
    near(
      fixedShin(action.sample(fixture.context, 0)),
      fixture.options.shinPoint,
    );
    near(
      fixedShin(action.sample(fixture.context, peak)),
      fixture.context.target,
    );
    const complete: MotionAction.Sample = action.sample(fixture.context, end);
    assert.equal(complete.phase, "complete");
    assert.deepEqual(complete.pose, original);
    assert.deepEqual(fixture.context.basePose, original);
    assert.deepEqual(complete.support, fixture.options.initialSupport);
    near(complete.rootOffset, [0, 0, 0]);
    const preparation: MotionAction.Sample = action.sample(
      fixture.context,
      timing.preparation / 2,
    );
    const free: MotionAction.SupportPatch = preparation.support.patches!.find(
      (patch: MotionAction.SupportPatch): boolean => patch.mode === "free",
    )!;
    assert.equal(free.constraint, "hard");
    assert.ok(free.world[1] >= 0);
    assert.equal(
      preparation.support.patches!.find(
        (patch: MotionAction.SupportPatch): boolean => patch.side === side,
      )!.mode,
      "planted",
    );
    const returned: MotionAction.Sample = action.sample(
      fixture.context,
      landing,
    );
    assert.equal(returned.support[side], 0);
    assert.equal(
      returned.support.patches!.find(
        (patch: MotionAction.SupportPatch): boolean => patch.side === side,
      )!.mode,
      "planted",
    );
    assert.ok(
      action.sample(fixture.context, landing + timing.recovery / 2).support[
        side
      ] > 0,
    );
    for (const time of [
      0,
      0.0125,
      0.025,
      0.05,
      0.075,
      0.0875,
      0.1,
      0.2,
      0.3,
      0.4,
      0.6,
      0.8,
      0.85,
      0.9,
      end,
    ]) {
      const sample: MotionAction.Sample = action.sample(fixture.context, time);
      assert.ok(
        sample.effectors.every((point: MotionAction.Effector): boolean =>
          point.target.every(Number.isFinite),
        ),
      );
      assert.equal(
        sample.effectors.some(
          (point: MotionAction.Effector): boolean => point.role === "strike",
        ),
        sample.phase === "contact" ||
          (sample.phase === "delivery" && sample.progress >= 0.35),
      );
      assert.ok(
        sample.effectors
          .filter(
            (point: MotionAction.Effector): boolean => point.role === "guide",
          )
          .every(
            (point: MotionAction.Effector): boolean =>
              point.constraint === "hard",
          ),
      );
      assert.ok(
        Math.abs(sample.support.left + sample.support.right - 1) < 1e-12,
      );
      for (const loaded of ["left", "right"] as const)
        if (sample.support[loaded] > 0)
          assert.ok(
            sample.support.patches!.some(
              (patch: MotionAction.SupportPatch): boolean =>
                patch.side === loaded &&
                patch.mode !== "free" &&
                patch.constraint !== "soft",
            ),
            `${loaded} has load without a ground point at ${time}`,
          );
    }
    assert.equal(
      action.sample(fixture.context, timing.preparation / 2).support[side],
      1,
    );
    assert.equal(
      action.sample(fixture.context, landing + timing.recovery / 2).support[
        side
      ],
      1,
    );
  }
}

/**
 * Reuse one action family across actor identities, anatomical sides and target heights.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real class for either side and compares all guide points with a fresh public FK. It catches fixed actor identifiers, ignored direction and detached anatomical guides.
 * @evidence contracts/testing.md#independent-cases Explicit height-family targets remain unchanged. Canonical measured joint bounds, current FK positions and changed input direction define independent expectations without a stored pose snapshot.
 */
export function test_roundhouse_reuse(): void {
  for (const side of ["left", "right"] as const) {
    const fixture: Fixture = makeFixture(side);
    for (const height of ["low", "body", "high"] as const) {
      const action: RoundhouseAction = new RoundhouseAction(
        {
          ...fixture.request,
          actorId: `person-${side}`,
          targetId: "independent-receiver",
        },
        { ...fixture.options, height },
      );
      const target: MotionAction.Vec3 = [
        0.6,
        height === "low" ? 0.52 : height === "body" ? 1.04 : 1.55,
        0,
      ];
      const sample: MotionAction.Sample = action.sample(
        { ...fixture.context, target },
        0.3,
      );
      near(fixedShin(sample), target);
      const bounds: ReturnType<typeof AutoMovieHumanRigControls.bounds> =
        AutoMovieHumanRigControls.bounds(`legs.${side}.knee.flexion`);
      assert.ok(
        sample.pose.legs![side].knee!.flexion! >= bounds.minimum &&
          sample.pose.legs![side].knee!.flexion! <= bounds.maximum,
      );
      const actual: AutoMovieHumanSkeleton.IOutput = fixture.context
        .evaluatePose!(sample.pose);
      near(
        clinical(sample)[1]!.target,
        placement(actual, `${side}LowerLeg`).position,
      );
      near(
        clinical(sample)[2]!.target,
        placement(actual, `${side}Foot`).position,
      );
    }
    const standard: RoundhouseAction = new RoundhouseAction(
      fixture.request,
      fixture.options,
    );
    const turned: RoundhouseAction = new RoundhouseAction(
      { ...fixture.request, direction: [1, 0, 0.35] },
      fixture.options,
    );
    assert.notDeepEqual(
      turned.sample(fixture.context, 0.18).effectors[0]!.target,
      standard.sample(fixture.context, 0.18).effectors[0]!.target,
    );
    assert.notEqual(
      turned.sample(fixture.context, 0.18).pose.pelvis?.rotation,
      standard.sample(fixture.context, 0.18).pose.pelvis?.rotation,
    );
  }
  const right: Fixture = makeFixture("right");
  const left: Fixture = makeFixture("left");
  const a: RoundhouseAction = new RoundhouseAction(
    right.request,
    right.options,
  );
  const b: RoundhouseAction = new RoundhouseAction(left.request, left.options);
  for (const time of [0.03, 0.09, 0.16, 0.23, 0.31, 0.5, 0.75]) {
    const r: MotionAction.Sample = a.sample(right.context, time);
    const l: MotionAction.Sample = b.sample(left.context, time);
    near(
      fixedShin(l),
      [fixedShin(r)[0], fixedShin(r)[1], -fixedShin(r)[2]],
      1e-7,
    );
    assert.ok(
      Math.abs(
        (l.pose.pelvis?.rotation ?? 0) + (r.pose.pelvis?.rotation ?? 0),
      ) < 1e-10,
    );
    assert.equal(l.phase, r.phase);
  }
}

/**
 * Keep bounded seeded variation deterministic across nonchronological seeks.
 *
 * @evidence contracts/testing.md#observable-behavior Samples actual configured instances, changes seek order and mutates a returned timing copy. It detects global RNG, historical state and leaked timing ownership.
 * @evidence contracts/testing.md#independent-cases Caller bounds of .1 duration fraction and .015 metre Euclidean aim define inequalities; equal seed and inputs define replay equality. Unsigned boundary and interior seeds exercise the random input range.
 */
export function test_roundhouse_variation(): void {
  const fixture: Fixture = makeFixture("right");
  for (const seed of [0, 1, 33, 65535, 0xffffffff]) {
    const request: MotionAction.Request = {
      ...fixture.request,
      variation: {
        seed,
        timingFraction: 0.1,
        aimMetres: 0.015,
        amplitudeFraction: 0.1,
      },
    };
    const action: RoundhouseAction = new RoundhouseAction(
      request,
      fixture.options,
    );
    const copy: RoundhouseAction = new RoundhouseAction(
      request,
      fixture.options,
    );
    const timing: MotionAction.Timing = action.timing;
    const ratio: number = timing.delivery / request.timing.delivery;
    assert.ok(ratio >= 0.9 && ratio <= 1.1);
    assert.ok(
      distance(
        fixedShin(
          action.sample(fixture.context, timing.preparation + timing.delivery),
        ),
        fixture.context.target,
      ) <=
        0.015 + 1e-12,
    );
    assert.deepEqual(
      action.sample(fixture.context, 0.17),
      copy.sample(fixture.context, 0.17),
    );
    const before: MotionAction.Sample = action.sample(fixture.context, 0.17);
    action.sample(fixture.context, 7);
    assert.deepEqual(action.sample(fixture.context, 0.17), before);
    action.timing.delivery = 999;
    assert.equal(action.timing.delivery, timing.delivery);
  }
}

/**
 * Recover from a distinct actual stopped configuration, preserving the conservative stop.
 *
 * @evidence contracts/testing.md#observable-behavior Supplies an explicit constrained clinical pose, actual FK effectors and changed root to the real sampler. It checks exact stop retention, causality, release continuity and landing rather than substituting an ideal peak.
 * @evidence contracts/testing.md#independent-cases The caller's stopped pose/root, raw aim, event participants and local durations determine endpoints. Adjacent-time metric comparisons distinguish signed zero without weakening physical admission. The event is synthetic attribution; this test claims no mesh collision.
 */
export function test_roundhouse_contact(): void {
  const fixture: Fixture = makeFixture("right");
  const action: RoundhouseAction = new RoundhouseAction(
    fixture.request,
    fixture.options,
  );
  const stop: number = 0.18;
  const stopped: MotionAction.Sample = action.sample(fixture.context, stop);
  stopped.pose.pelvis = { ...stopped.pose.pelvis, rotation: 23 };
  stopped.rootOffset = [0.012, -0.006, 0.019];
  const actual: RoundhouseKinematics.Result = RoundhouseKinematics.inspect(
    fixture.context,
    stopped.pose,
    "right",
    fixture.options.shinLocalPoint,
    fixture.context.target,
  );
  stopped.effectors[0]!.target = [...actual.shin];
  const stoppedSole: MotionAction.Effector = stopped.effectors.find(
    (point: MotionAction.Effector): boolean => point.role === "guide",
  )!;
  stoppedSole.target = RoundhouseKinematics.point(
    fixture.context,
    stopped.pose,
    stoppedSole.bone,
    stoppedSole.localPoint,
  );
  const event: MotionAction.ContactEvent = {
    actionId: fixture.request.id,
    actorId: fixture.request.actorId,
    targetId: fixture.request.targetId,
    time: stop,
    relation: "guard",
    point: [0.3, 0.9, -0.12],
    normal: [-1, 0, 0],
  };
  const context: MotionAction.Context = {
    ...fixture.context,
    contact: { event, sample: stopped },
  };
  const retained: MotionAction.Sample = action.sample(context, stop);
  assert.deepEqual(retained.pose, stopped.pose);
  assert.deepEqual(retained.effectors, stopped.effectors);
  assert.deepEqual(retained.rootOffset, stopped.rootOffset);
  assert.deepEqual(retained.support, stopped.support);
  assert.deepEqual(
    action.sample(context, 0.12),
    action.sample(fixture.context, 0.12),
  );
  const release: number = stop + action.timing.contact;
  const after: MotionAction.Sample = action.sample(context, release + 1e-7);
  near(clinical(after)[0]!.target, stopped.effectors[0]!.target, 1e-9);
  near(after.rootOffset, stopped.rootOffset, 1e-9);
  near(clinical(after)[1]!.target, actual.knee, 1e-7);
  near(clinical(after)[2]!.target, actual.ankle, 1e-7);
  const end: number = release + action.timing.retraction;
  near(
    fixedShin(action.sample(context, end - 1e-7)),
    fixedShin(action.sample(context, end)),
    1e-9,
  );
  assert.equal(action.sample(context, end).support.right, 0);
  assert.deepEqual(
    action.sample(context, end + action.timing.recovery).support,
    fixture.options.initialSupport,
  );
  const reordered: MotionAction.Sample = structuredClone(stopped);
  reordered.effectors.reverse();
  const alternate: MotionAction.Sample = action.sample(
    { ...context, contact: { event, sample: reordered } },
    release + 0.2,
  );
  const canonical: MotionAction.Sample = action.sample(context, release + 0.2);
  assert.deepEqual(alternate.pose, canonical.pose);
  for (const point of canonical.effectors)
    near(
      alternate.effectors.find(
        (candidate: MotionAction.Effector): boolean =>
          candidate.bone === point.bone && candidate.role === point.role,
      )!.target,
      point.target,
    );
  const detached: MotionAction.Sample = structuredClone(stopped);
  detached.effectors[0]!.target[0] += 0.01;
  assert.throws(
    (): MotionAction.Sample =>
      action.sample(
        { ...context, contact: { event, sample: detached } },
        release + 0.01,
      ),
  );
}

/**
 * Refuse missing anatomy, missing actual support measurement and unrelated contact.
 *
 * @evidence contracts/testing.md#observable-behavior Calls constructor and sampler through malformed semantic inputs and observes explicit refusal. No foreign method is replaced to produce a preferred result.
 * @evidence contracts/testing.md#independent-cases Actual evaluator/support callback presence, opposite-foot ownership, rigid witness identity, horizontal direction and matching participants are declared input invariants. Valid counterparts execute independently above.
 */
export function test_roundhouse_refusals(): void {
  const fixture: Fixture = makeFixture("right");
  const action: RoundhouseAction = new RoundhouseAction(
    fixture.request,
    fixture.options,
  );
  assert.throws(
    (): MotionAction.Sample =>
      action.sample({ ...fixture.context, geometry: {} }, 0.2),
  );
  assert.throws(
    (): MotionAction.Sample =>
      action.sample({ ...fixture.context, evaluatePose: undefined }, 0.2),
  );
  assert.throws(
    (): MotionAction.Sample =>
      action.sample({ ...fixture.context, supportFrame: undefined }, 0.2),
  );
  assert.throws(
    (): MotionAction.Sample =>
      action.sample({ ...fixture.context, supportTargets: undefined }, 0.2),
  );
  assert.throws(
    (): RoundhouseAction =>
      new RoundhouseAction(fixture.request, {
        ...fixture.options,
        supportPivot: { ...fixture.options.supportPivot, side: "right" },
      }),
  );
  assert.throws(
    (): RoundhouseAction =>
      new RoundhouseAction(fixture.request, {
        ...fixture.options,
        kneePoint: [9, 9, 9],
      }),
  );
  assert.throws(
    (): RoundhouseAction =>
      new RoundhouseAction(
        { ...fixture.request, direction: [0, 1, 0] },
        fixture.options,
      ),
  );
  const event: MotionAction.ContactEvent = {
    actionId: fixture.request.id,
    actorId: "unrelated",
    targetId: fixture.request.targetId,
    time: 0.18,
    relation: "guard",
    point: [0, 1, 0],
    normal: [-1, 0, 0],
  };
  assert.throws(
    (): MotionAction.Sample =>
      action.sample(
        {
          ...fixture.context,
          contact: { event, sample: action.sample(fixture.context, 0.18) },
        },
        0.2,
      ),
  );
}

/**
 * Preserve segment lengths and keep impossible raw targets visible.
 *
 * @evidence contracts/testing.md#observable-behavior Calls the real pure reach solver, checking rigid distances, mirrored bend planes, degeneracy and explicit infeasibility. It establishes radial geometry only, without a clinical or support claim.
 * @evidence contracts/testing.md#independent-cases A .5m thigh and .3m knee-to-witness lever imply a [.2,.8] radial interval by triangle inequality. Independently supplied segments and reflection determine preservation; far and too-close coordinates determine deficits. Every input-point position separately rejects sparse, missing, extra and nonfinite coordinates before arithmetic.
 */
export function test_roundhouse_reach(): void {
  const geometry: RoundhouseReach.Geometry = {
    hip: [0, 1, 0],
    knee: [0.3, 0.6, 0],
    ankle: [0.6, 0.2, 0],
    contact: [0.48, 0.36, 0],
    thighMetres: 0.5,
  };
  const original: RoundhouseReach.Result = RoundhouseReach.solve(
    geometry,
    geometry.contact,
    geometry.knee,
  );
  near(original.knee, geometry.knee);
  near(original.ankle, geometry.ankle);
  const results: RoundhouseReach.Result[] = [];
  for (const own of [-1, 1]) {
    const result: RoundhouseReach.Result = RoundhouseReach.solve(
      geometry,
      [0.64, 1.1, 0],
      [0, 2, own * 0.2],
    );
    results.push(result);
    assert.equal(result.feasible, true);
    assert.ok(Math.abs(distance(result.knee, geometry.hip) - 0.5) < 1e-10);
    assert.ok(Math.abs(distance(result.target, result.knee) - 0.3) < 1e-10);
    assert.ok(Math.abs(distance(result.ankle, result.knee) - 0.5) < 1e-10);
  }
  near(results[0]!.knee, [
    results[1]!.knee[0],
    results[1]!.knee[1],
    -results[1]!.knee[2],
  ]);
  const far: RoundhouseReach.Result = RoundhouseReach.solve(
    geometry,
    [1.2, 1, 0],
    [0, 2, 0],
  );
  assert.equal(far.feasible, false);
  near(far.target, [1.2, 1, 0]);
  assert.ok(Math.abs(far.deficitMetres - 0.4) < 1e-10);
  const close: RoundhouseReach.Result = RoundhouseReach.solve(
    geometry,
    geometry.hip,
    [0, 2, 0],
  );
  assert.equal(close.feasible, false);
  assert.ok(Math.abs(close.deficitMetres - 0.2) < 1e-10);
  assert.ok(
    RoundhouseReach.solve(geometry, [0.6, 1, 0], [0, 2, 0]).ankle.every(
      Number.isFinite,
    ),
  );
  assert.throws(
    (): RoundhouseReach.Result =>
      RoundhouseReach.solve(
        { ...geometry, contact: geometry.knee },
        [0.5, 1, 0],
        [0, 2, 0],
      ),
  );
  const invalid: unknown[] = [
    Array<number>(3),
    [0, 1],
    [0, 1, 2, 3],
    [0, undefined, 0],
    [0, NaN, 0],
    [0, Infinity, 0],
    null,
    undefined,
  ];
  for (const point of invalid) {
    for (const key of ["hip", "knee", "ankle", "contact"] as const)
      assert.throws(
        (): RoundhouseReach.Result =>
          RoundhouseReach.solve(
            { ...geometry, [key]: point as MotionAction.Vec3 },
            geometry.contact,
            geometry.knee,
          ),
        /finite measured geometry/u,
      );
    assert.throws(
      (): RoundhouseReach.Result =>
        RoundhouseReach.solve(
          geometry,
          point as MotionAction.Vec3,
          geometry.knee,
        ),
      /finite measured geometry/u,
    );
    assert.throws(
      (): RoundhouseReach.Result =>
        RoundhouseReach.solve(
          geometry,
          geometry.contact,
          point as MotionAction.Vec3,
        ),
      /finite measured geometry/u,
    );
  }
}

/**
 * Fit actual clinical chains and a jointly specified original plantar vertex.
 *
 * @evidence contracts/testing.md#observable-behavior Executes actual prepared Human/public clinical IK and cross-checks the resulting guides and landing point through fresh public FK. It catches stale pelvis coordinates, nonhinge guides and target replacement; no browser or mesh-contact approval follows.
 * @evidence contracts/testing.md#independent-cases Reachable shin and foot endpoints come from a separately authored valid clinical pose on each side. An independently distant target remains raw and unresolved. The shared real evaluator supplies geometry rather than a fake branch chosen for the solver.
 */
export function test_roundhouse_actual_kinematics(): void {
  for (const side of ["left", "right"] as const) {
    const fixture: Fixture = makeFixture(side);
    const sign: number = side === "right" ? 1 : -1;
    const reference: IAutoMovieHumanPose = structuredClone(
      fixture.context.basePose,
    );
    reference.pelvis = {
      ...reference.pelvis,
      rotation: sign * 35,
      obliquity: -sign * 8,
    };
    reference.legs![side] = {
      ...reference.legs![side],
      hip: { flexion: 105, abduction: 24, rotation: 25 },
      knee: { flexion: 32 },
    };
    const output: AutoMovieHumanSkeleton.IOutput =
      fixture.context.evaluatePose!(reference);
    const target: MotionAction.Vec3 = bonePoint(
      output,
      `${side}LowerLeg`,
      fixture.options.shinLocalPoint,
    );
    const seed: IAutoMovieHumanPose = structuredClone(reference);
    seed.legs![side].hip!.flexion = 99;
    seed.legs![side].knee!.flexion = 36;
    const result: RoundhouseKinematics.Result = RoundhouseKinematics.fit(
      fixture.context,
      seed,
      side,
      fixture.options.shinLocalPoint,
      target,
    );
    assert.ok(result.errorMetres < 0.00025);
    const actual: AutoMovieHumanSkeleton.IOutput = fixture.context
      .evaluatePose!(result.pose);
    near(result.hip, placement(actual, `${side}UpperLeg`).position);
    near(result.knee, placement(actual, `${side}LowerLeg`).position);
    near(result.ankle, placement(actual, `${side}Foot`).position);
    const low: MotionAction.SupportPatch =
      fixture.options.initialSupport.patches!.find(
        (patch: MotionAction.SupportPatch): boolean => patch.side === side,
      )!;
    const foot: MotionAction.Vec3 = bonePoint(output, low.bone, low.localPoint);
    const joint: RoundhouseKinematics.Result = RoundhouseKinematics.fit(
      fixture.context,
      reference,
      side,
      fixture.options.shinLocalPoint,
      target,
      { bone: low.bone, localPoint: low.localPoint, target: foot },
    );
    near(
      bonePoint(
        fixture.context.evaluatePose!(joint.pose),
        low.bone,
        low.localPoint,
      ),
      foot,
      0.00025,
    );
    assert.ok(joint.errorMetres < 0.00025);
    const far: RoundhouseKinematics.Result = RoundhouseKinematics.fit(
      fixture.context,
      seed,
      side,
      fixture.options.shinLocalPoint,
      [4, 2, 0],
    );
    near(far.target, [4, 2, 0]);
    assert.ok(far.errorMetres > 2);
  }
}

/**
 * Inspect actual polygon continuity at preparation, landing and complete return.
 *
 * @evidence contracts/testing.md#observable-behavior Applies the real action and independently reads public FK/Grounding, all original foot vertices and distal shape. Functional planted Subtalar uses its native carrier; midfoot/toe shape, original WORLD tasks, floor and every vertex's phase continuity remain separate checks. Planning bounds/status and seed/final authority are retained; no substituted solver is used.
 * @evidence contracts/testing.md#independent-cases Adjacent local times straddle phase boundaries and both unload/roll/load joins on both sides. A 2mm displacement ceiling over two microseconds detects numerical branches; separate unchanged .25mm hard-goal and 1micrometre floor limits govern physical admission. Same original support identity and explicit load shares supply the role/priority oracle.
 */
export function test_roundhouse_actual_boundaries(): void {
  const failures: string[] = [];
  const observations: object[] = [];
  for (const side of ["left", "right"] as const) {
    const fixture: Fixture = makeFixture(side);
    const action: RoundhouseAction = new RoundhouseAction(
      fixture.request,
      fixture.options,
    );
    const actor: LabActor = new LabActor(
      `kick-boundary-${side}`,
      "a",
      0,
      0,
      side,
    );
    try {
      const timing: MotionAction.Timing = action.timing;
      const landing: number =
        timing.preparation +
        timing.delivery +
        timing.contact +
        timing.retraction;
      for (const boundary of [
        timing.preparation * 0.25,
        timing.preparation * 0.75,
        timing.preparation,
        landing,
        landing + timing.recovery * 0.25,
        landing + timing.recovery * 0.75,
        landing + timing.recovery,
      ]) {
        const outputs: { key: string; point: MotionAction.Vec3 }[][] = [];
        const samples: MotionAction.Sample[] = [];
        for (const time of [boundary - 1e-6, boundary + 1e-6]) {
          try {
            const sample: MotionAction.Sample = action.sample(
              fixture.context,
              time,
            );
            const planning: RoundhouseKinematics.PlantResult[] = (
              sample as RoundhouseAction.Sample
            ).diagnostics.planting;
            for (const reports of (sample as RoundhouseAction.Sample)
              .diagnostics.endpointPlanning ?? [])
              if (
                reports.length !== 2 ||
                reports.some(
                  (
                    report: Omit<RoundhouseKinematics.PlantResult, "pose">,
                  ): boolean => report.calls !== 1 || report.iterations > 16,
                )
              )
                failures.push(
                  `${side} ${time}: cached endpoint work report mismatch`,
                );
            for (const result of planning) {
              const maximum: number = Math.max(
                ...result.perPointResiduals.map(
                  (
                    point: RoundhouseKinematics.PlantResult["perPointResiduals"][number],
                  ): number => distance(point.actual, point.target.position),
                ),
              );
              if (
                Math.abs(result.error - maximum) > 1e-9 ||
                result.plannedStatus !==
                  (result.error <= 0.00025 ? "converged" : "unresolved") ||
                result.iterations > 16
              )
                failures.push(
                  `${side} ${time}: dishonest planning status/residual/budget`,
                );
              if (
                result.channels.some(
                  (channel: AutoMovieHumanRigControls.DegreeChannel): boolean =>
                    sample.preservedChannels!.includes(channel),
                ) ||
                result.channels.some((channel: string): boolean =>
                  /midfoot|mtp|pip|dip|ipFlexion/.test(channel),
                )
              )
                failures.push(
                  `${side} ${time}: seed/final support channel policy mismatch`,
                );
              if (
                result.bounds.length !== result.channels.length ||
                result.bounds.some(
                  (
                    bound: RoundhouseKinematics.PlantResult["bounds"][number],
                  ): boolean =>
                    ![bound.minimum, bound.maximum, bound.applied].every(
                      Number.isFinite,
                    ),
                )
              )
                failures.push(`${side} ${time}: missing planner bounds`);
            }
            actor.apply(sample);
            const snapshot: object = actor.inspect();
            const supportGoals: {
              bone: string;
              localPoint?: MotionAction.Vec3;
              position: MotionAction.Vec3;
            }[] = (
              snapshot as {
                requestedWorldSupportGoals: {
                  bone: string;
                  localPoint?: MotionAction.Vec3;
                  position: MotionAction.Vec3;
                }[];
              }
            ).requestedWorldSupportGoals;
            const residuals: object[] = supportGoals.map(
              (goal: {
                bone: string;
                localPoint?: MotionAction.Vec3;
                position: MotionAction.Vec3;
              }): object => {
                const actual: MotionAction.Vec3 = drawnPoint(
                  actor,
                  goal.bone,
                  goal.localPoint ?? [0, 0, 0],
                );
                return {
                  ...goal,
                  actual,
                  errorMetres: distance(actual, goal.position),
                };
              },
            );
            const witnesses: { key: string; point: MotionAction.Vec3 }[] =
              actor.person.output.posed.map(
                (
                  row: AutoMovieHumanSkeleton.IPlacement,
                ): { key: string; point: MotionAction.Vec3 } => ({
                  key: row.bone,
                  point: actor.person.point(row.bone),
                }),
              );
            const floors: object[] = [];
            const authored: AutoMovieHumanSkeleton.IOutput = fixture.context
              .evaluatePose!(sample.pose);
            for (const footSide of ["left", "right"] as const) {
              const shape: {
                bone: string;
                localPoint: MotionAction.Vec3;
                errorMetres: number;
              }[] = [];
              const carrier: string = sample.preservedChannels!.includes(
                `legs.${footSide}.foot.subtalarInversion`,
              )
                ? `${footSide}Foot`
                : `${footSide}Subtalar`;
              const intendedFoot: AutoMovieHumanSkeleton.IPlacement = placement(
                authored,
                carrier,
              );
              const actualFoot: AutoMovieHumanSkeleton.IPlacement = placement(
                actor.person.output,
                carrier,
              );
              const points: {
                bone: string;
                localPoint: MotionAction.Vec3;
                actual: MotionAction.Vec3;
              }[] = actor
                .footPoints(footSide)
                .map(
                  (
                    point: { bone: string; localPoint: MotionAction.Vec3 },
                    index: number,
                  ): {
                    bone: string;
                    localPoint: MotionAction.Vec3;
                    actual: MotionAction.Vec3;
                  } => {
                    const actual: MotionAction.Vec3 = drawnPoint(
                      actor,
                      point.bone,
                      point.localPoint,
                    );
                    witnesses.push({
                      key: `${point.bone}/vertex-${index}`,
                      point: actual,
                    });
                    return { ...point, actual };
                  },
                );
              for (const point of points) {
                const intended: MotionAction.Vec3 = new THREE.Vector3(
                  ...bonePoint(authored, point.bone, point.localPoint),
                )
                  .sub(new THREE.Vector3(...intendedFoot.position))
                  .applyQuaternion(
                    new THREE.Quaternion(...intendedFoot.rotation).invert(),
                  )
                  .toArray();
                const actual: MotionAction.Vec3 = new THREE.Vector3(
                  ...bonePoint(
                    actor.person.output,
                    point.bone,
                    point.localPoint,
                  ),
                )
                  .sub(new THREE.Vector3(...actualFoot.position))
                  .applyQuaternion(
                    new THREE.Quaternion(...actualFoot.rotation).invert(),
                  )
                  .toArray();
                shape.push({
                  bone: point.bone,
                  localPoint: point.localPoint,
                  errorMetres: distance(actual, intended),
                });
              }
              const shapeMaximum: (typeof shape)[number] = shape.reduce(
                (
                  best: (typeof shape)[number],
                  point: (typeof shape)[number],
                ): (typeof shape)[number] =>
                  point.errorMetres > best.errorMetres ? point : best,
              );
              floors.push({
                side: footSide,
                shapeCarrier: carrier,
                minimum: points.reduce(
                  (
                    best: (typeof points)[number],
                    point: (typeof points)[number],
                  ): (typeof points)[number] =>
                    point.actual[1] < best.actual[1] ? point : best,
                ),
                shapeMaximum,
              });
              if (shapeMaximum.errorMetres > 1e-8)
                failures.push(
                  `${side} ${time}: ${footSide} original full-foot clinical shape changed ${shapeMaximum.errorMetres}m`,
                );
            }
            observations.push({
              side,
              boundary,
              time,
              phase: sample.phase,
              requested: sample,
              native: actor.support && {
                status: actor.support.status,
                reason: actor.support.reason,
                error: actor.support.error,
                floorMinimum: actor.support.floorMinimum,
                supportError: actor.support.supportError,
                softError: actor.support.softError,
                activeBounds: actor.support.activeBounds,
              },
              inspection: snapshot,
              supportResiduals: residuals,
              floors,
            });
            outputs.push(witnesses);
            samples.push(sample);
            if (actor.support?.status !== "admitted")
              failures.push(
                `${side} ${sample.phase} ${time}: ${actor.support?.reason}; hard ${actor.support?.error}; floor ${actor.support?.floorMinimum}`,
              );
            if ((actor.support?.floorMinimum ?? -Infinity) < -1e-6)
              failures.push(`${side} ${time}: floor penetration`);
            if ((actor.support?.error ?? Infinity) > 0.00025)
              failures.push(`${side} ${time}: hard residual`);
            for (const loaded of ["left", "right"] as const)
              if (
                sample.support[loaded] > 0 &&
                !sample.support.patches!.some(
                  (patch: MotionAction.SupportPatch): boolean =>
                    patch.side === loaded && patch.mode !== "free",
                )
              )
                failures.push(
                  `${side} ${time}: positive ${loaded} load without ground role`,
                );
          } catch (error: unknown) {
            const message: string =
              error instanceof Error ? error.message : String(error);
            failures.push(`${side} ${time}: ${message}`);
            observations.push({ side, boundary, time, error: message });
          }
        }
        if (outputs.length === 2) {
          const jumps: { key: string; metres: number }[] = outputs[0]!.map(
            (
              point: { key: string; point: MotionAction.Vec3 },
              index: number,
            ): { key: string; metres: number } => ({
              key: point.key,
              metres: distance(point.point, outputs[1]![index]!.point),
            }),
          );
          const largest: { key: string; metres: number } = jumps.reduce(
            (
              best: (typeof jumps)[number],
              value: (typeof jumps)[number],
            ): (typeof jumps)[number] =>
              value.metres > best.metres ? value : best,
          );
          observations.push({ side, boundary, largestJump: largest });
          if (largest.metres >= 0.002)
            failures.push(
              `${side} ${boundary}: ${largest.key} jumped ${largest.metres}m`,
            );
        }
        if (samples.length === 2) {
          for (const sample of samples)
            if (
              !sample.effectors.some(
                (point: MotionAction.Effector): boolean =>
                  point.role === "guide" && point.constraint === "hard",
              )
            )
              failures.push(
                `${side} ${boundary}: missing stable hard sole trajectory`,
              );
          if (
            distance(fixedPoint(samples[0]!, 3), fixedPoint(samples[1]!, 3)) >
            1e-5
          )
            failures.push(`${side} ${boundary}: planned sole target jump`);
        }
      }
    } finally {
      actor.dispose();
    }
  }
  if (failures.length) assert.fail(JSON.stringify({ failures, observations }));
}

/**
 * Keep internal return anatomy on one FK path and the original sole as an external landing task.
 *
 * @evidence contracts/testing.md#observable-behavior Samples the actual prepared Human on both sides through chamber, folding and the loaded endpoint. Fresh public FK independently checks rigid shin/knee/ankle shape, declared foot locks and the unchanged original world plantar target. Actual admission and all original vertices remain separately inspected by actual_boundaries.
 * @evidence contracts/testing.md#independent-cases Same-bone rigid distances and independent public FK define the anatomical oracle. The original caller sole world anchor defines landing; internal targets cannot replace it. Adjacent return/recovery times and exact landing exercise the endpoint formerly re-solved with different foot freedoms.
 */
export function test_roundhouse_return_shape(): void {
  for (const side of ["left", "right"] as const) {
    const fixture: Fixture = makeFixture(side);
    const action: RoundhouseAction = new RoundhouseAction(
      fixture.request,
      fixture.options,
    );
    const landing: number =
      action.timing.preparation +
      action.timing.delivery +
      action.timing.contact +
      action.timing.retraction;
    for (const time of [
      0.12,
      0.16,
      0.4,
      0.6,
      landing - 1e-6,
      landing,
      landing + 1e-6,
    ]) {
      const sample: MotionAction.Sample = action.sample(fixture.context, time);
      const output: AutoMovieHumanSkeleton.IOutput = fixture.context
        .evaluatePose!(sample.pose);
      for (const point of clinical(sample))
        near(
          point.target,
          bonePoint(output, point.bone, point.localPoint ?? [0, 0, 0]),
          1e-8,
        );
      assert.ok(
        Math.abs(
          distance(clinical(sample)[0]!.target, clinical(sample)[1]!.target) -
            Math.hypot(...fixture.options.shinLocalPoint),
        ) < 1e-8,
      );
      for (const footSide of ["left", "right"] as const)
        for (const channel of [
          "subtalarInversion",
          "midfootSupination",
        ] as const) {
          if (channel === "midfootSupination") {
            assert.ok(
              sample.preservedChannels!.includes(
                `legs.${footSide}.foot.${channel}`,
              ),
            );
            assert.equal(
              sample.pose.legs?.[footSide].foot?.[channel] ?? 0,
              fixture.context.basePose.legs?.[footSide].foot?.[channel] ?? 0,
            );
          }
          const range: ReturnType<typeof AutoMovieHumanRigControls.bounds> =
            AutoMovieHumanRigControls.bounds(
              `legs.${footSide}.foot.${channel}`,
              sample.pose,
            );
          assert.ok(
            (sample.pose.legs?.[footSide].foot?.[channel] ?? 0) >=
              range.minimum &&
              (sample.pose.legs?.[footSide].foot?.[channel] ?? 0) <=
                range.maximum,
          );
        }
    }
    const endpoint: MotionAction.Sample = action.sample(
      fixture.context,
      landing,
    );
    const original: MotionAction.SupportPatch =
      fixture.options.initialSupport.patches!.find(
        (patch: MotionAction.SupportPatch): boolean => patch.side === side,
      )!;
    const world: MotionAction.Vec3 = new THREE.Vector3(
      ...fixedPoint(endpoint, 3),
    )
      .applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        fixture.context.frame!.yawRadians,
      )
      .add(new THREE.Vector3(...fixture.context.frame!.origin))
      .toArray();
    near(world, original.world);
    const previous: MotionAction.Sample = action.sample(
      fixture.context,
      landing - 1e-6,
    );
    const previousFK: AutoMovieHumanSkeleton.IOutput = fixture.context
      .evaluatePose!(previous.pose);
    for (const point of fixture.context.evaluatePose!(endpoint.pose).posed) {
      const before: AutoMovieHumanSkeleton.IPlacement = placement(
        previousFK,
        point.bone,
      );
      near(before.position, point.position, 1e-8);
      assert.ok(
        new THREE.Quaternion(...before.rotation).angleTo(
          new THREE.Quaternion(...point.rotation),
        ) < 1e-6,
        `Return endpoint changed ${point.bone}`,
      );
    }
  }
}

/**
 * Reconsume unchanged original frame points with immutable callback ownership.
 * @evidence contracts/testing.md#observable-behavior Calls the public planting planner through the actual host callback, independently checks each returned raw world target and same-pose FK witness, and validates the reported status/error/update count. This proves neither whole-body support nor browser motion.
 * @evidence contracts/testing.md#independent-cases The fixed original guard frame and a nonzero requested-root offset distinguish world from evaluator metres. Both anatomical sides and frame snapshots before/after planning catch tuple mutation and double root conversion; the unchanged16-update/.25mm budget supplies the reporting oracle.
 */
export function test_roundhouse_original_frame_planning(): void {
  for (const side of ["left", "right"] as const) {
    const fixture: Fixture = makeFixture(side);
    const patch: MotionAction.SupportPatch = {
      ...structuredClone(
        fixture.options.initialSupport.patches!.find(
          (point: MotionAction.SupportPatch): boolean => point.side === side,
        )!,
      ),
      mode: "free",
      constraint: "hard",
      frameRotation: [0, 0, 0, 1],
    };
    const before: unknown = structuredClone(
      fixture.context.supportTargets!(patch),
    );
    const root: MotionAction.Vec3 = [0.012, 0.006, -0.009];
    const result: RoundhouseKinematics.PlantResult = RoundhouseKinematics.plant(
      fixture.context,
      fixture.context.basePose,
      patch,
      root,
      "planted",
    );
    assert.deepEqual(
      result.perPointResiduals.map(
        (
          point: RoundhouseKinematics.PlantResult["perPointResiduals"][number],
        ): object => point.target,
      ),
      before,
    );
    assert.deepEqual(fixture.context.supportTargets!(patch), before);
    for (const point of result.perPointResiduals) {
      const world: MotionAction.Vec3 = new THREE.Vector3(
        ...bonePoint(
          fixture.context.evaluatePose!(result.pose),
          point.target.bone,
          point.target.localPoint ?? [0, 0, 0],
        ),
      )
        .add(new THREE.Vector3(...root))
        .applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          fixture.context.frame!.yawRadians,
        )
        .add(new THREE.Vector3(...fixture.context.frame!.origin))
        .toArray();
      near(point.actual, world);
      assert.ok(
        Math.abs(point.errorMetres - distance(world, point.target.position)) <
          1e-10,
      );
    }
    assert.ok(
      Math.abs(
        result.error -
          Math.max(
            ...result.perPointResiduals.map(
              (
                point: RoundhouseKinematics.PlantResult["perPointResiduals"][number],
              ): number => point.errorMetres,
            ),
          ),
      ) < 1e-9,
    );
    assert.equal(
      result.plannedStatus,
      result.error <= 0.00025 ? "converged" : "unresolved",
    );
    assert.ok(result.iterations <= 16);
  }
}

/**
 * Preserve the caller's exact guard and sampling history independence.
 *
 * @evidence contracts/testing.md#observable-behavior Freezes the actual caller pose before sampling across attack/return phases, compares the untouched guard and repeats earlier times after late seeks. It catches nested foot/toe aliasing and cached plans changing inputs. The original sole stays external and hard; phase-declared clinical witnesses do not become duplicated world tasks. Independent opponent impact remains unchanged.
 * @evidence contracts/testing.md#independent-cases The frozen caller record and two independently constructed instances are the ownership/order oracles. Both sides, complete return, forward/backward seeks, repeated identical times and mutation of a returned owned pose cover the previously hidden alias and boundary branches.
 */
export function test_roundhouse_input_ownership(): void {
  for (const side of ["left", "right"] as const) {
    const fixture: Fixture = makeFixture(side);
    const original: IAutoMovieHumanPose = structuredClone(
      fixture.context.basePose,
    );
    freeze(fixture.context.basePose);
    const action: RoundhouseAction = new RoundhouseAction(
      fixture.request,
      fixture.options,
    );
    const reference: RoundhouseAction = new RoundhouseAction(
      fixture.request,
      fixture.options,
    );
    action.reach(fixture.context);
    assert.deepEqual(fixture.context.basePose, original);
    const early: MotionAction.Sample = action.sample(fixture.context, 0.0125);
    for (const time of [
      0.3, 0.78, 0.55, 0.925, 0.1, 0.025, 0.8875, 0.18, 0.0125,
    ]) {
      const sample: MotionAction.Sample = action.sample(fixture.context, time);
      assert.deepEqual(fixture.context.basePose, original);
      assert.deepEqual(sample, reference.sample(fixture.context, time));
      assert.deepEqual(action.sample(fixture.context, time), sample);
      assert.equal(
        sample.effectors.length,
        sample.phase === "contact" ||
          (sample.phase === "delivery" && sample.progress >= 0.35)
          ? 2
          : 1,
      );
      assert.equal(
        sample.effectors.find(
          (point: MotionAction.Effector): boolean => point.role === "guide",
        )!.constraint,
        "hard",
      );
    }
    assert.deepEqual(action.sample(fixture.context, 0.0125), early);
    const completed: MotionAction.Sample = action.sample(fixture.context, 2);
    assert.deepEqual(completed.pose, original);
    completed.pose.legs![side].foot = { hallux: { mtpFlexion: 30 } };
    assert.deepEqual(fixture.context.basePose, original);
    assert.deepEqual(action.sample(fixture.context, 2).pose, original);
    near(
      fixedShin(
        action.sample(
          fixture.context,
          action.timing.preparation + action.timing.delivery,
        ),
      ),
      fixture.context.target,
    );
  }
}

/** Actual evaluator and unchanged original polygon support metadata for one actor. */
interface Fixture {
  /** Local action timing and independent identities. */
  request: MotionAction.Request;
  /** Actual baseline chain and original sole vertices. */
  options: RoundhouseAction.Options;
  /** Detached real measurement callbacks and actual same-body geometry. */
  context: MotionAction.Context;
}

/** Release CPU drawing resources after copying the actual context's detached geometry measurement. */
function makeFixture(side: MotionAction.Side): Fixture {
  const other: MotionAction.Side = side === "left" ? "right" : "left";
  const actor: LabActor = new LabActor(`kick-unit-${side}`, "a", 0, 0, side);
  try {
    const context: MotionAction.Context = actor.context(side, [
      0.62,
      1.04,
      side === "left" ? 0.02 : -0.02,
    ]);
    const neutral: AutoMovieHumanSkeleton.IOutput = context.neutral!;
    const output: AutoMovieHumanSkeleton.IOutput = context.evaluatePose!(
      context.basePose,
    );
    const knee: AutoMovieHumanSkeleton.IPlacement = placement(
      neutral,
      `${side}LowerLeg`,
    );
    const localPoint: MotionAction.Vec3 = new THREE.Vector3(
      ...placement(neutral, `${side}Foot`).position,
    )
      .sub(new THREE.Vector3(...knee.position))
      .applyQuaternion(new THREE.Quaternion(...knee.rotation).invert())
      .multiplyScalar(0.85)
      .toArray();
    return {
      request: {
        id: "kick",
        actorId: "striker",
        targetId: "receiver",
        side,
        leadSide: "left",
        direction: [1, 0, 0],
        timing: {
          preparation: 0.1,
          delivery: 0.2,
          contact: 0.025,
          retraction: 0.45,
          recovery: 0.15,
        },
      },
      options: {
        height: "body",
        kneePoint: [...placement(output, `${side}LowerLeg`).position],
        kickingFoot: [...placement(output, `${side}Foot`).position],
        shinPoint: bonePoint(output, `${side}LowerLeg`, localPoint),
        shinLocalPoint: localPoint,
        supportingFoot: [...placement(output, `${other}Foot`).position],
        supportPivotStart: [...actor.pivotStarts[other]],
        supportPivot: structuredClone(actor.patches[other].pivot),
        initialSupport: {
          left: 0.5,
          right: 0.5,
          patches: [
            structuredClone(actor.patches.left.low),
            structuredClone(actor.patches.right.low),
          ],
        },
      },
      context,
    };
  } finally {
    actor.dispose();
  }
}

/** Read a real canonical joint, refusing incomplete actual anatomy. */
function placement(
  output: AutoMovieHumanSkeleton.IOutput,
  bone: string,
): AutoMovieHumanSkeleton.IPlacement {
  const point: AutoMovieHumanSkeleton.IPlacement | undefined =
    output.posed.find(
      (row: AutoMovieHumanSkeleton.IPlacement): boolean => row.bone === bone,
    );
  if (!point) throw new Error(`Missing actual test joint ${bone}`);
  return point;
}

/** Transform the original bone-local point through independent public FK. */
function bonePoint(
  output: AutoMovieHumanSkeleton.IOutput,
  bone: string,
  local: MotionAction.Vec3,
): MotionAction.Vec3 {
  const point: AutoMovieHumanSkeleton.IPlacement = placement(output, bone);
  return new THREE.Vector3(...local)
    .applyQuaternion(new THREE.Quaternion(...point.rotation))
    .add(new THREE.Vector3(...point.position))
    .toArray();
}

/** Compare tuples without treating signed zero as a physical difference. */
function near(
  actual: MotionAction.Vec3,
  expected: MotionAction.Vec3,
  tolerance: number = 1e-10,
): void {
  assert.ok(
    actual.every(
      (value: number, index: number): boolean =>
        Math.abs(value - expected[index]!) <= tolerance,
    ),
    `${actual} differs from ${expected}`,
  );
}

/** Independent Euclidean metre distance. */
function distance(a: MotionAction.Vec3, b: MotionAction.Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Convert requested-root FK target into the fixed actor-origin frame. */
function fixedShin(sample: MotionAction.Sample): MotionAction.Vec3 {
  const point: MotionAction.Vec3 = (
    sample.effectors.find(
      (point: MotionAction.Effector): boolean => point.role === "strike",
    ) ?? clinical(sample)[0]!
  ).target;
  return [
    point[0] + sample.rootOffset[0],
    point[1] + sample.rootOffset[1],
    point[2] + sample.rootOffset[2],
  ];
}

/** Read the current displayed original bone transform, without changing any physical target. */
function drawnPoint(
  actor: LabActor,
  bone: string,
  localPoint: MotionAction.Vec3,
): MotionAction.Vec3 {
  const group: THREE.Group | undefined = actor.person.drawing.bones.get(
    AutoMovieHumanRigControls.joint(bone),
  );
  if (!group) throw new Error(`Missing displayed original witness ${bone}`);
  return group.localToWorld(new THREE.Vector3(...localPoint)).toArray();
}

/** Freeze only plain owned input records; callable context owners stay borrowed. */
function freeze(value: object): void {
  for (const entry of Object.values(value))
    if (entry && typeof entry === "object") freeze(entry);
  Object.freeze(value);
}

/** Fixed actor-frame coordinates of any stable requested-root anatomical objective. */
function fixedPoint(
  sample: MotionAction.Sample,
  index: number,
): MotionAction.Vec3 {
  const point: MotionAction.Vec3 = (
    index === 3
      ? sample.effectors.find(
          (point: MotionAction.Effector): boolean => point.role === "guide",
        )!
      : clinical(sample)[index]!
  ).target;
  return [
    point[0] + sample.rootOffset[0],
    point[1] + sample.rootOffset[1],
    point[2] + sample.rootOffset[2],
  ];
}

/** Read module-owned clinical diagnostics without treating them as independent world tasks. */
function clinical(sample: MotionAction.Sample): MotionAction.Effector[] {
  return (sample as RoundhouseAction.Sample).diagnostics.clinical;
}
