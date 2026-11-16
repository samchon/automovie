import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  resolvePose,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import { HumanGrasp, type HumanHand, type IHumanBody, type IHumanPosture, resolveHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * An arbitrary grasp judge observes the complete fitted body, including map
 * iteration and bones outside the acting arm. Wrapping it cannot narrow that
 * dependency. Known native hand-only measures have their own actual callers.
 *
 * Scenarios:
 * 1. One real canonical right-arm grasp and one stroke key retain a posed
 *    left arm and the body's hips. An owned judge reads map size, parent-first
 *    iteration, every bone name, hips and left hand. Its actual metric
 *    is the left wrist's distance to a site exactly20mm above its source.
 * 2. The direct judge and an owned wrapper each receive the complete map,
 *    run once for their single reached key and report the same20mm metric
 *    and30mm authored bound. The grasp's unjudged entry stays NaN.
 * 3. The actual shown right wrist stays within the original1mm task bound.
 *    The report's maximum elbow departure is independently read as the
 *    angle between projected actual/hinted elbow radials for grasp and key.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines complete arbitrary-callback observations, acting versus opposite hand, metre-valued metric/bound, one-candidate/key invocation scope and independent geometric report in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public HumanGrasp.reachable on a canonical body with a genuine custom stroke judge and wrapper. It observes full map content/order, unaffected actual frames, original judgement/bound correspondence, required metric, actual wrist task and elbow report; incorrectly treating an unknown callback as hand-only or omitting required judgement work fails.
 * @evidence contracts/development/testing.md#independent-expectations Ordinary full resolvePose with canonical clinical mappings supplies the unchanged hips/left-arm frames and complete parent-first names independently of requested FK adapters. The authored site is20mm above the unchanged opposite wrist, so Euclidean miss is0.02m within1e-9m. One declared candidate and reached key require one judge call. Independent unit-axis projection and atan2(cross length,dot) give the report angle; its cosine is compared within1e-12 to avoid acos endpoint conditioning without changing task/ROM/contact bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers acting-arm versus unrelated pelvis/opposite-hand observations, get/size/iteration dependencies, direct versus wrapped unknown functions, judged versus unjudged entries, metric/bound ordering, actual full coupled fitting and report-only departure. Native issued hand-only factories remain exercised by their existing tool/surface action cases; this unit exposes no private registration or metadata.
 * @evidence contracts/development/testing.md#execution-ownership One portable discoverable unit borrows canonical immutable geometry through a fresh body owner and owns its posture, goal, judge, wrapper and counters. It calls public grasp/resolver/FK APIs, replaces no foreign function/global and starts no renderer, process or compiler.
 */
export function test_motion_grasp_judge_full_observation(): void {
  const body: IHumanBody = { ...motionHumanBody("m-average") };
  const posture: IHumanPosture = { root: { x: 0.5, y: 0, z: -1 }, yaw: -31, pitch: 0, roll: 0,
    joints: { head: [7, 0, 0], leftUpperArm: [20, 5, 0], leftLowerArm: [30, 0, 0],
      rightUpperArm: [15, 10, 0], rightLowerArm: [35, 0, 0] }, limbs: {} };
  const original: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = full(body, resolveHumanPosture(body, posture));
  const names: AutoMovieHumanoidBone[] = Array.from(original.keys());
  const opposite: IAutoMovieVector3 = original.get("leftHand")!.worldPosition;
  const site: IAutoMovieVector3 = { x: opposite.x, y: opposite.y + 0.02, z: opposite.z };
  const wrist: HumanHand.IWrist = { point: { ...original.get("rightHand")!.worldPosition },
    rotation: { ...original.get("rightHand")!.worldRotation } };
  const elbow: IAutoMovieVector3 = original.get("rightLowerArm")!.worldPosition;
  const bend: IAutoMovieVector3 = { x: elbow.x, y: elbow.y + 0.1, z: elbow.z + 0.15 };
  for (const wrapped of [false, true]) {
    let calls: number = 0;
    let keyDeparture: number | undefined;
    const observe: NonNullable<HumanGrasp.IKey["judge"]> = (
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): number => {
      calls++;
      TestValidator.equals("arbitrary judge keeps complete parent-first iteration", Array.from(bones.keys()), names);
      TestValidator.predicate("arbitrary judge can inspect unrelated actual full-body frames",
        bones.size === original.size && names.every((name: AutoMovieHumanoidBone): boolean => bones.get(name)?.bone === name) &&
        vclose(bones.get("hips")!.worldPosition, original.get("hips")!.worldPosition, 1e-9) &&
        vclose(bones.get("leftHand")!.worldPosition, opposite, 1e-9),
      );
      keyDeparture = departure(bones, bend);
      const hand: IAutoMovieVector3 = bones.get("leftHand")!.worldPosition;
      return Math.hypot(hand.x - site.x, hand.y - site.y, hand.z - site.z);
    };
    const judge: NonNullable<HumanGrasp.IKey["judge"]> = wrapped
      ? (bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>): number => observe(bones)
      : observe;
    const reached: HumanGrasp.IReach = HumanGrasp.reachable(body, posture, "right", bend,
      (): HumanHand.IWrist => wrist, [0],
      (): Iterable<HumanGrasp.IKey> => [{ posture, wrist, bend, judge, bound: 0.03 }], [0], {
        bound: 0.03,
        measure: (keys: readonly number[], judged: readonly number[], bounds: readonly number[]): number => {
          TestValidator.predicate("required metric observes the original ordered key reports",
            keys.length === 2 && keys.every((value: number): boolean => Number.isFinite(value)) &&
            Number.isNaN(judged[0]) && Number.isNaN(bounds[0]) && nclose(bounds[1]!, 0.03, 0));
          return judged[1]!;
        },
      });
    TestValidator.predicate(`one actual ${wrapped ? "wrapped" : "direct"} judge supplies its full-map metric`,
      calls === 1 && reached.judged.length === 2 && Number.isNaN(reached.judged[0]) &&
      nclose(reached.judged[1]!, 0.02, 1e-9) && nclose(reached.bounds[1]!, 0.03, 0),
    );
    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = full(body, reached.pose);
    const hand: IAutoMovieVector3 = shown.get("rightHand")!.worldPosition;
    TestValidator.predicate("complete grasp still meets the actual original wrist target",
      Math.hypot(hand.x - wrist.point.x, hand.y - wrist.point.y, hand.z - wrist.point.z) <= 0.001);
    const expected: number = Math.max(departure(shown, bend), keyDeparture!);
    TestValidator.predicate("reported worst departure retains the original geometric elbow angle",
      keyDeparture !== undefined && reached.departure >= 0 && reached.departure <= 180 &&
      nclose(Math.cos(reached.departure * Math.PI / 180), Math.cos(expected), 1e-12));
  }
}

/** Read complete ordinary canonical FK independently of a demanded-output adapter. */
function full(body: IHumanBody, pose: IAutoMoviePose): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return new Map(resolvePose(pose, body.skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
    (bone: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone]));
}

/** Angle in radians between nondegenerate actual and hinted elbow radial directions. */
function departure(bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, hint: IAutoMovieVector3): number {
  const shoulder: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
  const wrist: IAutoMovieVector3 = bones.get("rightHand")!.worldPosition;
  const norm: number = Math.hypot(wrist.x - shoulder.x, wrist.y - shoulder.y, wrist.z - shoulder.z);
  const axis: IAutoMovieVector3 = { x: (wrist.x - shoulder.x) / norm,
    y: (wrist.y - shoulder.y) / norm, z: (wrist.z - shoulder.z) / norm };
  const radial: (point: IAutoMovieVector3) => IAutoMovieVector3 = (point: IAutoMovieVector3): IAutoMovieVector3 => {
    const x: number = point.x - shoulder.x;
    const y: number = point.y - shoulder.y;
    const z: number = point.z - shoulder.z;
    const projection: number = x * axis.x + y * axis.y + z * axis.z;
    return { x: x - projection * axis.x, y: y - projection * axis.y, z: z - projection * axis.z };
  };
  const actual: IAutoMovieVector3 = radial(bones.get("rightLowerArm")!.worldPosition);
  const asked: IAutoMovieVector3 = radial(hint);
  TestValidator.predicate("the bent-arm observation has nondegenerate actual and hinted radials",
    Math.hypot(actual.x, actual.y, actual.z) > 1e-6 && Math.hypot(asked.x, asked.y, asked.z) > 1e-6);
  return Math.atan2(Math.hypot(actual.y * asked.z - actual.z * asked.y,
    actual.z * asked.x - actual.x * asked.z, actual.x * asked.y - actual.y * asked.x),
    actual.x * asked.x + actual.y * asked.y + actual.z * asked.z);
}
