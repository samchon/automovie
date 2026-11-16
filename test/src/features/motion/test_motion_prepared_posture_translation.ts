import { type IAutoMovieResolvedBone, resolvePose } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  type IHumanBody,
  type IHumanPosture,
  createHumanBody,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Prepared posture transport preserves original authoring demands and lends
 * a solved pose only while its actual raw and rig prerequisites still hold.
 *
 * Scenarios:
 * 1. A canonical Human's head flexion 10 degrees is translated to two roots.
 *    Source edits and mutation of the public prepared pose cannot alter the
 *    private original demand or any later resolved result.
 * 2. Changing a transported head demand to 20, then constraining it to a
 *    five-degree maximum, must produce 20 and 5 respectively. Neither the
 *    old canonical answer nor a mutable token may bypass current clamping.
 * 3. Adding a free-leg world goal after transport requires a fresh actual
 *    fit whose foot is within the existing 0.001 metre target bound.
 *    Translating that original goal preserves the asked point and bend.
 * 4. A copied preparation wrapper is unissued and refuses transport. A copied
 *    raw posture still resolves ordinarily and agrees with an actual cold
 *    solve, with independently owned pose and nested outputs.
 * 5. A fixed-posture workspace solves two different free-leg candidates and
 *    then the first again. Current target contact, cold-pose agreement and
 *    earlier-result mutation distinguish fixed source work from cached fits.
 * 6. Rebasing an issued translation may change an unrelated head joint, a
 *    leg ancestor or the actual goal. Every result retains the new head
 *    angle and current foot target beside an ordinary cold solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States original clinical/world demand ownership, live rig/raw invalidation, Human provenance, contact precision and four snapshot/fallback/ownership scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Uses public prepare/translated and fixed-base candidate workspaces beside ordinary seeded resolution on a real canonical Human; changes source/results/current head constraints and world-leg candidates, then observes actual clinical angles, cold parity and displayed foot contact.
 * @evidence contracts/development/testing.md#independent-expectations Literal authored head angles and the later five-degree bound independently fix 10/20/5. World goals must retain their actual asked coordinates under source-plus-root displacement and the existing 0.001 metre contact limit. Cold parity supplements these assertions but cannot independently certify all inverse kinematics.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers multiple translations, source/output mutation, changed raw versus rig, added free-leg context, original goal/bend transport, copied wrapper refusal, copied raw ordinary resolution, fresh outputs and A/B/A fixed-base candidate fits. No global Human table or shared fixture is mutated.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit uses the repository's canonical Human fixture and independently cloned skeleton/profile through the actual body factory. All changed records belong to the test; no renderer, viewer, foreign method replacement, subprocess or compiler is started.
 */
export function test_motion_prepared_posture_translation(): void {
  const shared: IHumanBody = motionHumanBody("m-average");
  const skeleton: IAutoMovieSkeleton = structuredClone(shared.skeleton);
  const body: IHumanBody = createHumanBody(skeleton, structuredClone(shared.profile));
  const source: IHumanPosture = {
    root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0,
    joints: { head: [10, 0, 0] }, limbs: {},
  };
  const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, source);
  const exposed: IAutoMovieJointPose = prepared.pose.joints.find(
    (value: IAutoMovieJointPose): boolean => value.bone === "head",
  )!;
  exposed.flexion = 123;
  prepared.pose.root!.translation.x = 456;
  source.root.x = 789;
  source.joints.head = [50, 0, 0];

  for (const root of [{ x: 2, y: 3, z: 4 }, { x: -1, y: 0.5, z: 0.25 }]) {
    const raw: IHumanPosture = resolveHumanPosture.translated(prepared, root);
    TestValidator.predicate("transport retains its independent original authoring demand",
      vclose(raw.root, root, 0) && nclose(raw.joints.head![0], 10, 0),
    );
    const actual: IAutoMoviePose = resolveHumanPosture(body, raw);
    TestValidator.predicate("prepared result retains literal head and current root",
      nclose(head(actual), 10, 1e-12) && vclose(actual.root!.translation, root, 0),
    );
    const cold: IAutoMoviePose = resolveHumanPosture(body, structuredClone(raw));
    samePose(actual, cold);
    actual.root!.translation.x = 999;
    actual.joints.find((value: IAutoMovieJointPose): boolean => value.bone === "head")!.flexion = 888;
    const replay: IAutoMoviePose = resolveHumanPosture(body, raw);
    TestValidator.predicate("result mutation cannot change the private solve",
      nclose(head(replay), 10, 1e-12) && vclose(replay.root!.translation, root, 0),
    );
  }

  const changed: IHumanPosture = resolveHumanPosture.translated(prepared, { x: 0, y: 0, z: 0 });
  changed.joints.head = [20, 0, 0];
  TestValidator.predicate("changed current demand cannot reuse canonical angles",
    nclose(head(resolveHumanPosture(body, changed)), 20, 1e-12),
  );
  const headBone: IAutoMovieBone = skeleton.bones.find(
    (value: IAutoMovieBone): boolean => value.bone === "head",
  )!;
  headBone.constraint = { flexion: { min: 0, max: 5 }, abduction: null, twist: null };
  const constrained: IHumanPosture = resolveHumanPosture.translated(prepared, { x: 0, y: 0, z: 0 });
  TestValidator.predicate("changed rig constraint invalidates canonical evidence",
    nclose(head(resolveHumanPosture(body, constrained)), 5, 1e-12),
  );

  const rest: IAutoMovieResolvedBone[] = resolvePose(resolveHumanPosture(body, constrained), skeleton);
  const foot: IAutoMovieVector3 = rest.find(
    (value: IAutoMovieResolvedBone): boolean => value.bone === "leftFoot",
  )!.worldPosition;
  const knee: IAutoMovieVector3 = rest.find(
    (value: IAutoMovieResolvedBone): boolean => value.bone === "leftLowerLeg",
  )!.worldPosition;
  const point: IAutoMovieVector3 = { x: foot.x, y: foot.y + 0.05, z: foot.z + 0.05 };
  const bend: IAutoMovieVector3 = { x: knee.x, y: knee.y, z: knee.z + 0.3 };
  constrained.limbs.leftLeg = { point: { ...point }, bend: { ...bend } };
  const fitted: IAutoMoviePose = resolveHumanPosture(body, constrained);
  const shown: IAutoMovieVector3 = resolvePose(fitted, skeleton).find(
    (value: IAutoMovieResolvedBone): boolean => value.bone === "leftFoot",
  )!.worldPosition;
  TestValidator.predicate("new free-leg goal receives an actual current fit",
    Math.hypot(shown.x - point.x, shown.y - point.y, shown.z - point.z) <= 0.001,
  );
  const legPrepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, constrained);
  const displacement: IAutoMovieVector3 = { x: 1, y: 2, z: -3 };
  const carried: IHumanPosture = resolveHumanPosture.translated(legPrepared, displacement);
  TestValidator.predicate("goal translation preserves original asked point and bend",
    vclose(carried.limbs.leftLeg!.point,
      { x: point.x + 1, y: point.y + 2, z: point.z - 3 }, 1e-12) &&
    vclose(carried.limbs.leftLeg!.bend,
      { x: bend.x + 1, y: bend.y + 2, z: bend.z - 3 }, 1e-12),
  );
  samePose(resolveHumanPosture(body, carried), resolveHumanPosture(body, structuredClone(carried)));
  TestValidator.predicate("copied wrapper cannot issue transport evidence",
    throwsError((): IHumanPosture => resolveHumanPosture.translated(
      { ...legPrepared }, displacement,
    ), "Unissued"),
  );
  const ordinary: IHumanPosture = { ...carried };
  samePose(resolveHumanPosture(body, ordinary), resolveHumanPosture(body, structuredClone(carried)));

  const fixed: IHumanPosture = { ...constrained, limbs: {} };
  const workspace: ReturnType<typeof resolveHumanPosture.prepareBase> = resolveHumanPosture.prepareBase(body, fixed);
  const candidates: IHumanPosture.IGoal[] = [
    { point: { ...point }, bend: { ...bend } },
    { point: { x: foot.x, y: foot.y + 0.09, z: foot.z - 0.04 }, bend: { ...bend } },
  ];
  let previous: IAutoMoviePose | undefined;
  for (const index of [0, 1, 0]) {
    const goal: IHumanPosture.IGoal = candidates[index]!;
    const current: IAutoMoviePose = workspace.seeded({ leftLeg: goal }).pose;
    const cold: IAutoMoviePose = resolveHumanPosture(body, { ...fixed, limbs: { leftLeg: goal } });
    samePose(current, cold);
    const endpoint: IAutoMovieVector3 = resolvePose(current, skeleton).find(
      (value: IAutoMovieResolvedBone): boolean => value.bone === "leftFoot",
    )!.worldPosition;
    TestValidator.predicate("fixed-base candidate still performs its current actual fit",
      Math.hypot(endpoint.x - goal.point.x, endpoint.y - goal.point.y, endpoint.z - goal.point.z) <= 0.001,
    );
    if (previous !== undefined)
      TestValidator.predicate("a later candidate leaves earlier caller output unchanged",
        previous.root!.translation.x === 777 &&
        previous.joints.find((value: IAutoMovieJointPose): boolean => value.bone === "leftUpperLeg")!.flexion === 888,
      );
    current.root!.translation.x = 777;
    current.joints.find((value: IAutoMovieJointPose): boolean => value.bone === "leftUpperLeg")!.flexion = 888;
    previous = current;
  }

  const variants: readonly ((posture: IHumanPosture) => void)[] = [
    (posture: IHumanPosture): void => { posture.joints.head = [2, 0, 0]; },
    (posture: IHumanPosture): void => { posture.joints.hips = [10, 0, 0]; },
    (posture: IHumanPosture): void => { posture.limbs.leftLeg!.point.z += 0.02; },
  ];
  for (let i: number = 0; i < variants.length; i++) {
    const raw: IHumanPosture = structuredClone(carried);
    variants[i]!(raw);
    const rebased: IHumanPosture = resolveHumanPosture.rebased(carried, raw);
    const actual: IAutoMoviePose = resolveHumanPosture(body, rebased);
    samePose(actual, resolveHumanPosture(body, structuredClone(raw)));
    const endpoint: IAutoMovieVector3 = resolvePose(actual, skeleton).find(
      (value: IAutoMovieResolvedBone): boolean => value.bone === "leftFoot",
    )!.worldPosition;
    const target: IAutoMovieVector3 = raw.limbs.leftLeg!.point;
    TestValidator.predicate("rebased evidence never substitutes an old raw goal or whole pose",
      nclose(head(actual), i === 0 ? 2 : 5, 1e-12) &&
      Math.hypot(endpoint.x - target.x, endpoint.y - target.y, endpoint.z - target.z) <= 0.001,
    );
  }
}

/** Observe the literal authored clinical head coordinate after actual clamping. */
function head(pose: IAutoMoviePose): number {
  return pose.joints.find((value: IAutoMovieJointPose): boolean => value.bone === "head")!.flexion!;
}

/** Supplement independent angle/contact assertions with cold-path numerical parity. */
function samePose(actual: IAutoMoviePose, expected: IAutoMoviePose): void {
  TestValidator.predicate("actual and cold poses preserve the same root and clinical values",
    actual !== expected && actual.root !== expected.root && actual.root !== null && expected.root !== null &&
    vclose(actual.root.translation, expected.root.translation, 1e-12) &&
    qclose(actual.root.rotation, expected.root.rotation, 1e-12) &&
    actual.joints.length === expected.joints.length &&
    actual.joints.every((value: IAutoMovieJointPose, i: number): boolean => {
      const other: IAutoMovieJointPose = expected.joints[i]!;
      return value !== other && value.bone === other.bone &&
        sameAngle(value.flexion, other.flexion) && sameAngle(value.abduction, other.abduction) &&
        sameAngle(value.twist, other.twist);
    }),
  );
}

/** Null remains a distinct rest coordinate; numerical parity retains 1e-7 degrees. */
function sameAngle(a: number | null, b: number | null): boolean {
  return a === null || b === null ? a === b : nclose(a, b, 1e-7);
}
