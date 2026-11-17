import type {
  IAutoMovieBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  createHumanBody,
  poseBones,
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
 *    Prepared authoring and its pose are values, never changed once issued;
 *    a second preparation of head flexion 20 keeps its own demand, so each
 *    translation carries its own source's demand, not a shared or later one.
 *    Mutation of a resolved result cannot alter any later resolved result.
 * 2. Changing a transported head demand to 20 must produce 20. A body made
 *    from a copy of the rig whose head is constrained to a five-degree
 *    maximum must produce 5 for the transported demand of 10, and the
 *    earlier body, whose rig is unchanged, still 10: a body describes the
 *    rig it was made from, and neither the old canonical answer nor a
 *    mutable token may bypass the clamping of the body that resolves.
 * 3. Adding a free-leg world goal after transport requires a fresh actual
 *    fit whose foot is within the existing 0.001 metre target bound.
 *    Translating that original goal preserves the asked point and bend.
 * 4. A copied preparation wrapper is unissued and refuses transport. A copied
 *    raw posture still resolves ordinarily and agrees with an actual cold
 *    solve, with independently owned pose and nested outputs.
 * 5. A fixed-posture workspace solves two different free-leg candidates and
 *    then the first again. Current target contact, cold-pose agreement and
 *    earlier-result mutation distinguish fixed source work from cached fits.
 * 6. Carrying edited authoring may change an unrelated head joint, a
 *    leg ancestor or the actual goal. Every result retains the new head
 *    angle and current foot target beside an ordinary cold solve.
 * 7. Own nonenumerable and fresh inherited-array toJSON hooks may serialize
 *    a current head20 as the former10. Issued and arbitrary carried raw
 *    postures still display20, or5 after the actual ROM change, beside cold
 *    resolution. A matching JSON string never proves unchanged clinical data.
 * 8. Both leg slots may share one owned goal. Translation shifts that goal's
 *    point/bend once, preserves the output alias graph and source values,
 *    and retains ordinary complete-pose results under the same root change.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States original clinical/world demand ownership, live rig/raw invalidation, canonical Human provenance, fixed-base candidates, checked carried authoring, current JSON-hook fields, shared-goal translation and contact precision across eight scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Uses public prepare/translated/carried and fixed-base candidate workspaces beside ordinary seeded resolution. It prepares distinct sources and changes results/head constraints, leg ancestors and actual goals, then observes clinical angles, cold parity and canonical displayed foot contact. Own/inherited JSON concealment must not certify stale joints, and aliased leg goals retain a single displacement and independent graph ownership.
 * @evidence contracts/development/testing.md#independent-expectations Literal authored head angles and the later five-degree bound independently fix 10/20/5. World goals must retain their actual asked coordinates under source-plus-root displacement and the existing 0.001 metre contact limit. Own/inherited toJSON serializing20 as10 must not change those raw clinical values or their current ROM; one shared goal receives the root displacement once and remains shared. Cold parity supplements these assertions but cannot independently certify all inverse kinematics.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers translations, distinct sources, result edits, changed raw/rig, added goals, raw goal/bend transport, copied-wrapper refusal, copied raw, fresh outputs, A/B/A fixed-base fits and carried head/hip/goal changes, own versus inherited JSON hooks on issued/arbitrary carried inputs, current ROM and shared-goal graph preservation. No global table or shared fixture is mutated.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit uses the repository's canonical Human fixture and independently cloned skeleton/profile through the actual body factory. All changed records belong to the test; no renderer, viewer, foreign method replacement, subprocess or compiler is started.
 */
export function test_motion_prepared_posture_translation(): void {
  const shared: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const skeleton: IAutoMovieSkeleton = structuredClone(shared.skeleton);
  const first: IAutoMovieMotionHumanBody = createHumanBody(skeleton, structuredClone(shared.profile));
  const source: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0,
    joints: { head: [10, 0, 0] }, limbs: {},
  };
  const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(first, source);
  TestValidator.predicate("the prepared pose is the solve of its authoring",
    nclose(head(prepared.pose), 10, 1e-12) && vclose(prepared.pose.root!.translation, source.root, 0),
  );
  const other: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(first, {
    ...source, root: { x: 7, y: 8, z: 9 }, joints: { head: [20, 0, 0] },
  });

  for (const root of [{ x: 2, y: 3, z: 4 }, { x: -1, y: 0.5, z: 0.25 }]) {
    const raw: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(prepared, root);
    TestValidator.predicate("transport retains its own original authoring demand",
      vclose(raw.root, root, 0) && nclose(raw.joints.head![0], 10, 0),
    );
    const moved: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(other, root);
    TestValidator.predicate("another preparation's transport carries its own demand",
      vclose(moved.root, root, 0) && nclose(moved.joints.head![0], 20, 0) &&
      nclose(head(resolveHumanPosture(first, moved)), 20, 1e-12),
    );
    const actual: IAutoMoviePose = resolveHumanPosture(first, raw);
    TestValidator.predicate("prepared result retains literal head and current root",
      nclose(head(actual), 10, 1e-12) && vclose(actual.root!.translation, root, 0),
    );
    const cold: IAutoMoviePose = resolveHumanPosture(first, structuredClone(raw));
    samePose(actual, cold);
    actual.root!.translation.x = 999;
    actual.joints.find((value: IAutoMovieJointPose): boolean => value.bone === "head")!.flexion = 888;
    const replay: IAutoMoviePose = resolveHumanPosture(first, raw);
    TestValidator.predicate("result mutation cannot change the private solve",
      nclose(head(replay), 10, 1e-12) && vclose(replay.root!.translation, root, 0),
    );
  }

  const changed: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(prepared, { x: 0, y: 0, z: 0 });
  changed.joints.head = [20, 0, 0];
  TestValidator.predicate("changed current demand cannot reuse canonical angles",
    nclose(head(resolveHumanPosture(first, changed)), 20, 1e-12),
  );
  jsonSpoof(first, prepared, 20);

  // A body describes the rig it was made from: the constraint goes on a copy
  // of the rig, and the body made from that copy clamps by it while the
  // earlier body keeps its own range.
  const narrowed: IAutoMovieSkeleton = structuredClone(skeleton);
  const headBone: IAutoMovieBone = narrowed.bones.find(
    (value: IAutoMovieBone): boolean => value.bone === "head",
  )!;
  headBone.constraint = { flexion: { min: 0, max: 5 }, abduction: null, twist: null };
  const body: IAutoMovieMotionHumanBody = createHumanBody(narrowed, structuredClone(shared.profile));
  jsonSpoof(body, prepared, 5);
  const constrained: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(prepared, { x: 0, y: 0, z: 0 });
  TestValidator.predicate("a body made from the constrained rig cannot reuse the earlier body's canonical evidence",
    nclose(head(resolveHumanPosture(body, constrained)), 5, 1e-12),
  );
  TestValidator.predicate("the earlier body keeps the range of the rig it was made from",
    nclose(head(resolveHumanPosture(first, constrained)), 10, 1e-12),
  );

  const rest: IAutoMovieResolvedBone[] = Array.from(poseBones(body, resolveHumanPosture(body, constrained)).values());
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
  const shown: IAutoMovieVector3 = poseBones(body, fitted).get("leftFoot")!.worldPosition;
  TestValidator.predicate("new free-leg goal receives an actual current fit",
    Math.hypot(shown.x - point.x, shown.y - point.y, shown.z - point.z) <= 0.001,
  );
  const legPrepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, constrained);
  const displacement: IAutoMovieVector3 = { x: 1, y: 2, z: -3 };
  const carried: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(legPrepared, displacement);
  TestValidator.predicate("goal translation preserves original asked point and bend",
    vclose(carried.limbs.leftLeg!.point,
      { x: point.x + 1, y: point.y + 2, z: point.z - 3 }, 1e-12) &&
    vclose(carried.limbs.leftLeg!.bend,
      { x: bend.x + 1, y: bend.y + 2, z: bend.z - 3 }, 1e-12),
  );
  samePose(resolveHumanPosture(body, carried), resolveHumanPosture(body, structuredClone(carried)));
  TestValidator.predicate("copied wrapper cannot issue transport evidence",
    throwsError((): IAutoMovieMotionHumanPosture => resolveHumanPosture.translated(
      { ...legPrepared }, displacement,
    ), "Unissued"),
  );
  const ordinary: IAutoMovieMotionHumanPosture = { ...carried };
  samePose(resolveHumanPosture(body, ordinary), resolveHumanPosture(body, structuredClone(carried)));

  const fixed: IAutoMovieMotionHumanPosture = { ...constrained, limbs: {} };
  const workspace: ReturnType<typeof resolveHumanPosture.prepareBase> = resolveHumanPosture.prepareBase(body, fixed);
  const candidates: IAutoMovieHumanLimbGoal[] = [
    { point: { ...point }, bend: { ...bend } },
    { point: { x: foot.x, y: foot.y + 0.09, z: foot.z - 0.04 }, bend: { ...bend } },
  ];
  let previous: IAutoMoviePose | undefined;
  for (const index of [0, 1, 0]) {
    const goal: IAutoMovieHumanLimbGoal = candidates[index]!;
    const current: IAutoMoviePose = workspace.seeded({ leftLeg: goal }).pose;
    const cold: IAutoMoviePose = resolveHumanPosture(body, { ...fixed, limbs: { leftLeg: goal } });
    samePose(current, cold);
    const endpoint: IAutoMovieVector3 = poseBones(body, current).get("leftFoot")!.worldPosition;
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

  const variants: readonly ((posture: IAutoMovieMotionHumanPosture) => void)[] = [
    (posture: IAutoMovieMotionHumanPosture): void => { posture.joints.head = [2, 0, 0]; },
    (posture: IAutoMovieMotionHumanPosture): void => { posture.joints.hips = [10, 0, 0]; },
    (posture: IAutoMovieMotionHumanPosture): void => { posture.limbs.leftLeg!.point.z += 0.02; },
  ];
  for (let i: number = 0; i < variants.length; i++) {
    const raw: IAutoMovieMotionHumanPosture = structuredClone(carried);
    variants[i]!(raw);
    const checked: IAutoMovieMotionHumanPosture = resolveHumanPosture.carried(legPrepared, raw);
    const actual: IAutoMoviePose = resolveHumanPosture(body, checked);
    samePose(actual, resolveHumanPosture(body, structuredClone(raw)));
    const endpoint: IAutoMovieVector3 = poseBones(body, actual).get("leftFoot")!.worldPosition;
    const target: IAutoMovieVector3 = raw.limbs.leftLeg!.point;
    TestValidator.predicate("carried evidence never substitutes an old raw goal or whole pose",
      nclose(head(actual), i === 0 ? 2 : 5, 1e-12) &&
      Math.hypot(endpoint.x - target.x, endpoint.y - target.y, endpoint.z - target.z) <= 0.001,
    );
  }
  aliasedGoals(body, fixed, foot, knee);
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

/** Current clinical scalars cannot be certified by a JSON callback concealing their change. */
function jsonSpoof(body: IAutoMovieMotionHumanBody, prepared: resolveHumanPosture.IPrepared, expected: number): void {
  for (const inherited of [false, true]) {
    const raw: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(prepared, { x: 0.25, y: 0.5, z: -0.75 });
    const before: string = JSON.stringify(raw);
    Object.defineProperty(raw.joints.head!, "0", { value: 20 });
    conceal(raw.joints.head!, inherited);
    TestValidator.equals("owned JSON hook really conceals the current clinical change", JSON.stringify(raw), before);
    const arbitrary: IAutoMovieMotionHumanPosture = structuredClone(raw);
    conceal(arbitrary.joints.head!, inherited);
    TestValidator.equals("arbitrary carried candidate has the same misleading serialized signature", JSON.stringify(arbitrary), before);
    for (const candidate of [raw, resolveHumanPosture.carried(prepared, arbitrary)]) {
      const actual: IAutoMoviePose = resolveHumanPosture(body, candidate);
      const cold: IAutoMoviePose = resolveHumanPosture(body, structuredClone(candidate));
      TestValidator.predicate(`current scalar/ROM survive ${inherited ? "inherited" : "own"} JSON spoof, expected${expected}`,
        nclose(candidate.joints.head![0], 20, 0) && nclose(head(actual), expected, 1e-12) && nclose(head(cold), expected, 1e-12));
      samePose(actual, cold);
    }
  }
}

/** Attach only to a test-owned array or a new private prototype, leaving global prototypes intact. */
function conceal(tuple: readonly [number, number, number], inherited: boolean): void {
  const owner: object = inherited ? Object.create(Array.prototype) as object : tuple;
  Object.defineProperty(owner, "toJSON", { value: (): number[] => [10, 0, 0], enumerable: false, configurable: true });
  if (inherited) Object.setPrototypeOf(tuple, owner);
}

/** Preserve shared authoring graphs while applying the independent root displacement exactly once. */
function aliasedGoals(body: IAutoMovieMotionHumanBody, fixed: IAutoMovieMotionHumanPosture, foot: IAutoMovieVector3, knee: IAutoMovieVector3): void {
  const goal: IAutoMovieHumanLimbGoal = { point: { x: 0, y: foot.y + 0.08, z: foot.z + 0.05 },
    bend: { x: 0, y: knee.y, z: knee.z + 0.3 } };
  const point: IAutoMovieVector3 = { ...goal.point };
  const bend: IAutoMovieVector3 = { ...goal.bend };
  const source: IAutoMovieMotionHumanPosture = { ...fixed, root: { x: 0, y: 0, z: 0 }, limbs: { leftLeg: goal, rightLeg: goal } };
  const prepared: resolveHumanPosture.IPrepared = resolveHumanPosture.prepare(body, source);
  const root: IAutoMovieVector3 = { x: 1, y: 2, z: -3 };
  const moved: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(prepared, root);
  TestValidator.predicate("one shared authoring goal receives exactly one translation and keeps its alias graph",
    moved.limbs.leftLeg === moved.limbs.rightLeg && moved.limbs.leftLeg !== goal &&
    vclose(moved.limbs.leftLeg!.point, { x: point.x + 1, y: point.y + 2, z: point.z - 3 }, 1e-12) &&
    vclose(moved.limbs.leftLeg!.bend, { x: bend.x + 1, y: bend.y + 2, z: bend.z - 3 }, 1e-12) &&
    source.limbs.leftLeg === source.limbs.rightLeg && vclose(goal.point, point, 0) && vclose(goal.bend, bend, 0));
  samePose(resolveHumanPosture(body, moved), resolveHumanPosture(body, structuredClone(moved)));
  moved.limbs.leftLeg!.point.x = 999;
  const replay: IAutoMovieMotionHumanPosture = resolveHumanPosture.translated(prepared, root);
  TestValidator.predicate("a translated shared-goal output cannot poison the source or next issued graph",
    replay.limbs.leftLeg === replay.limbs.rightLeg && replay.limbs.leftLeg !== moved.limbs.leftLeg &&
    vclose(replay.limbs.leftLeg!.point, { x: point.x + 1, y: point.y + 2, z: point.z - 3 }, 1e-12) &&
    vclose(goal.point, point, 0) && Object.is(moved.limbs.rightLeg!.point.x, 999));
}
