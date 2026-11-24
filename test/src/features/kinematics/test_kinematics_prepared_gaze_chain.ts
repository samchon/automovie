import { gazeChainJoints, Transform } from "@automovie/engine";
import type { IAutoMovieAngleRange, IAutoMovieBone, IAutoMovieJointConstraint, IAutoMovieJointPose, IAutoMovieSkeleton } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Prepared cervical capacity keeps the original head-first degree budget,
 * unclamped residual and nullable neck coordinates for each actual aim.
 *
 * Scenarios:
 * 1. Head capacities F±20/T±30 and neckF[-15,10]/T±10 split25/35 into
 *    neck5/5 and head20/30. Negative aims, one-axis and small head-only aims
 *    retain the independently derived shares under A/B/A query order.
 * 2. Excess35/50 leaves neck10/10 and head25/40, exposing combined shortage;
 *    negative excess likewise remains on the head. A null head flexion axis
 *    delegates5 to the neck, while absent/disconnected chains keep one head.
 * 3. Every returned array/joint is fresh. Editing an earlier head cannot
 *    change later shares or be repaired by a new same-demand result.
 * 4. Owned raw getters retain rig→rig→constraints→F/usedbounds→T/usedbounds
 *    order. Explicit preparation reads nothing at construction and positive
 *    requests never read throwing unused minima or unused abduction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines clinical-degree capacities, head-first split, residual reporting versus clamping, null/absent fallback, fixed rig lifetime, fresh outputs and original observable raw/lazy bound order in four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public raw/prepare gazeChainJoints on an owned mathematical cervical kernel and compares literal parent-first records across positive/negative/one-axis/excess demands. Output poison exposes retained articulation answers; owned getter order and throwing unused fields detect eager or reordered metadata work without changing ranges or introducing an iteration/candidate count.
 * @evidence contracts/development/testing.md#independent-expectations The head takes up to its signed capacity and the neck takes the remaining demand up to its capacity; all shortage is still assigned to the head. Thus25−20=5 goes to neck,35−30=5 twist, while35/50 exceeds total30/40 by5/10 and remains head25/40. The negative capacities give neck-15/-10 and head-35/-50 for-50/-60. Integer degree shares allow1e-12 arithmetic precision; zero neck axes remain null and no geometric two-axis additivity is claimed. Getter sequences specify original public input effects rather than measured internal work.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers positive/negative and repeated aims, head-only, nullable one-axis neck records, positive/negative unreachable residual, immobile head axis, rig-less/disconnected fallback, prior-output poison, lazy preparation and required versus unused metadata. Anatomical Human gaze/eyes and general ROM validation retain their own entries.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable engine unit owns a labeled two-bone capacity kernel, fixed ranges, getter targets and issued output edits. It calls only public source, changes no Human/table/global/library method and starts no host, compiler or renderer.
 */
export function test_kinematics_prepared_gaze_chain(): void {
  const headRom: IAutoMovieJointConstraint = { flexion: { min: -20, max: 20 }, abduction: null, twist: { min: -30, max: 30 } };
  const neckRom: IAutoMovieJointConstraint = { flexion: { min: -15, max: 10 }, abduction: null, twist: { min: -10, max: 10 } };
  const rig: IAutoMovieSkeleton = { id: "cervical-capacity-kernel", bones: [
    { bone: "neck", parent: null, constraint: neckRom, rest: Transform.identity() },
    { bone: "head", parent: "neck", constraint: headRom, rest: Transform.identity() },
  ] };
  const read: ReturnType<typeof gazeChainJoints.prepare> = gazeChainJoints.prepare(rig);
  let previous: IAutoMovieJointPose[] | undefined;
  for (const [flexion, twist, neckF, neckT, headF, headT] of [
    [25, 35, 5, 5, 20, 30], [-25, -35, -5, -5, -20, -30], [35, 50, 10, 10, 25, 40],
    [-50, -60, -15, -10, -35, -50], [25, 0, 5, null, 20, 0], [5, 0, null, null, 5, 0], [25, 35, 5, 5, 20, 30],
  ] as const) {
    const expected: IAutoMovieJointPose[] = [
      ...(neckF === null && neckT === null ? [] : [{ bone: "neck" as const, flexion: neckF, abduction: null, twist: neckT }]),
      { bone: "head", flexion: headF, abduction: null, twist: headT },
    ];
    const actual: IAutoMovieJointPose[] = read(flexion, twist);
    shares(actual, expected);
    shares(gazeChainJoints({ rig, flexionDeg: flexion, twistDeg: twist }), expected);
    if (previous !== undefined)
      TestValidator.predicate("later cervical capacities cannot borrow or repair a previous caller-edited head",
        actual !== previous && actual.every((joint: IAutoMovieJointPose): boolean => !previous!.includes(joint)) &&
        Object.is(previous[previous.length - 1]!.flexion, 777));
    actual[actual.length - 1]!.flexion = 777;
    previous = actual;
  }
  const immobile: IAutoMovieSkeleton = { ...rig, bones: rig.bones.map((bone: IAutoMovieBone): IAutoMovieBone =>
    bone.bone === "head" ? { ...bone, constraint: { ...headRom, flexion: null } } : bone) };
  shares(gazeChainJoints.prepare(immobile)(5, 0), [
    { bone: "neck", flexion: 5, abduction: null, twist: null }, { bone: "head", flexion: 0, abduction: null, twist: 0 },
  ]);
  const single: IAutoMovieJointPose[] = [{ bone: "head", flexion: 35, abduction: null, twist: 50 }];
  shares(gazeChainJoints.prepare(null)(35, 50), single);
  shares(gazeChainJoints.prepare({ ...rig, bones: rig.bones.map((bone: IAutoMovieBone): IAutoMovieBone =>
    bone.bone === "head" ? { ...bone, parent: null } : bone) })(35, 50), single);
  observations(rig);
}

/** Compare exact record structure/null semantics and independently derived clinical values. */
function shares(actual: readonly IAutoMovieJointPose[], expected: readonly IAutoMovieJointPose[]): void {
  TestValidator.predicate("actual cervical records retain literal capacity/residual shares in parent order",
    actual.length === expected.length && actual.every((joint: IAutoMovieJointPose, index: number): boolean => {
      const wanted: IAutoMovieJointPose = expected[index]!;
      return joint.bone === wanted.bone && joint.abduction === null &&
        (joint.flexion === null || wanted.flexion === null ? joint.flexion === wanted.flexion : nclose(joint.flexion, wanted.flexion, 1e-12)) &&
        (joint.twist === null || wanted.twist === null ? joint.twist === wanted.twist : nclose(joint.twist, wanted.twist, 1e-12));
    }));
}

/** Observe original raw effects and reject eager reads of immutable but unused bound fields. */
function observations(base: IAutoMovieSkeleton): void {
  const trace: string[] = [];
  const head: IAutoMovieJointConstraint = observed("head", 20, 30, trace);
  const neck: IAutoMovieJointConstraint = observed("neck", 10, 10, trace);
  const rig: IAutoMovieSkeleton = { ...base, bones: base.bones.map((bone: IAutoMovieBone): IAutoMovieBone => ({ ...bone,
    get constraint(): IAutoMovieJointConstraint { trace.push(`${bone.bone}.constraint`); return bone.bone === "head" ? head : neck; } })) };
  const read: ReturnType<typeof gazeChainJoints.prepare> = gazeChainJoints.prepare(rig);
  TestValidator.equals("fixed cervical construction reads no inactive metadata", trace, []);
  shares(read(25, 35), [{ bone: "neck", flexion: 5, abduction: null, twist: 5 },
    { bone: "head", flexion: 20, abduction: null, twist: 30 }]);
  trace.length = 0;
  shares(gazeChainJoints({
    get rig(): IAutoMovieSkeleton { trace.push("rig"); return rig; },
    get flexionDeg(): number { trace.push("F"); return 25; },
    get twistDeg(): number { trace.push("T"); return 35; },
  }), [{ bone: "neck", flexion: 5, abduction: null, twist: 5 }, { bone: "head", flexion: 20, abduction: null, twist: 30 }]);
  TestValidator.equals("raw fields retain the original capacity/residual evaluation order", trace,
    ["rig", "rig", "head.constraint", "neck.constraint", "F", "head.F", "head.F.max", "neck.F", "neck.F.max",
      "T", "head.T", "head.T.max", "neck.T", "neck.T.max"]);
}

/** Fixed positive capacities leave negative minima and abduction genuinely unread. */
function observed(name: string, flexion: number, twist: number, trace: string[]): IAutoMovieJointConstraint {
  const range: (axis: string, maximum: number) => IAutoMovieAngleRange = (axis: string, maximum: number): IAutoMovieAngleRange => ({
    get min(): never { throw new Error(`unused ${name}.${axis}.min`); },
    get max(): number { trace.push(`${name}.${axis}.max`); return maximum; },
  });
  const f: IAutoMovieAngleRange = range("F", flexion);
  const t: IAutoMovieAngleRange = range("T", twist);
  return {
    get flexion(): IAutoMovieAngleRange { trace.push(`${name}.F`); return f; },
    get twist(): IAutoMovieAngleRange { trace.push(`${name}.T`); return t; },
    get abduction(): never { throw new Error("unused cervical abduction"); },
  };
}
