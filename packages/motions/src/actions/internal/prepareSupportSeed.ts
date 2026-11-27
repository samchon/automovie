import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * Start a static support solve from its predecessor aligned onto the new keyed
 * contact. Knee and trunk contacts move the root, since those sites have no
 * wrist or ankle chain ending at them. Held hands and feet then counter that
 * movement through their own analytic fits. The resulting pose is a candidate
 * for the original whole-body constraint merit.
 * Parameter body: The same body as the support being fitted.
 * Parameter from: The predecessor with its previously solved joint angles.
 * Parameter contacts: The authored supports, in the order of the targets.
 * Parameter targets: The fit's actual per-contact world placements.
 * Returns: The candidate, absent when no knee or trunk contact names a place.
 */
export function prepareSupportSeed(
  body: IAutoMovieMotionHumanBody,
  from: IAutoMovieMotionHumanPosture,
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  targets: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[],
): Seed {
  const effectors: IEffector[] = [];
  const names: Set<AutoMovieHumanoidBone> = new Set();
  for (const [index, contact] of contacts.entries()) {
    const target: IAutoMovieMotionHumanBodyFitTypes.ITarget = targets[index]!;
    if (target.on !== undefined || target.axes?.length === 0) continue;
    names.add(target.bone);
    const side: AutoMovieHumanSide = contact.part.startsWith("left")
      ? "left"
      : "right";
    const effector: IEffector = contact.part.endsWith("Hand")
      ? {
          limb: `${side}Arm`,
          end: `${side}Hand`,
          middle: `${side}LowerArm`,
          start: `${side}UpperArm`,
          target,
        }
      : contact.part.endsWith("Foot")
        ? {
            limb: `${side}Leg`,
            end: `${side}Foot`,
            middle: `${side}LowerLeg`,
            start: `${side}UpperLeg`,
            target,
            floor: target.goal.y === 0 && target.axes?.includes("y") === false,
          }
        : { target };
    if (effector.end !== undefined) names.add(effector.end);
    if (effector.middle !== undefined) names.add(effector.middle);
    if (effector.start !== undefined) names.add(effector.start);
    effectors.push(effector);
  }
  if (
    !effectors.some(
      (effector: IEffector): boolean => effector.limb === undefined,
    )
  )
    return undefined;

  const knees: IEffector[] = effectors.filter(
    (effector: IEffector): boolean =>
      effector.limb === undefined && effector.target.bone.endsWith("LowerLeg"),
  );
  const knee: Knee = knees.length === 1 ? knees[0] : undefined;
  const near: AutoMovieHumanSide = knee?.target.bone.startsWith("left")
    ? "left"
    : "right";
  if (knee !== undefined) {
    names.add(`${near}UpperLeg`);
    names.add(`${near}Foot`);
  }
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture.seeded(body, from, undefined, undefined, read, names)
      .pose,
    read(),
    names,
  );
  const correction: IAutoMovieVector3[] = effectors.map(
    (effector: IEffector): IAutoMovieVector3 => {
      const target: IAutoMovieMotionHumanBodyFitTypes.ITarget = effector.target;
      const frame: IAutoMovieResolvedBone = bones.get(target.bone)!;
      const current: IAutoMovieVector3 =
        target.point === undefined
          ? frame.worldPosition
          : AutoMovieEngineVector3.add(
              frame.worldPosition,
              AutoMovieEngineQuaternion.rotateVector(frame.worldRotation, target.point),
            );
      const axes: NonNullable<
        IAutoMovieMotionHumanBodyFitTypes.ITarget["axes"]
      > = target.axes ?? AXES;
      return {
        x: axes.includes("x") ? target.goal.x - current.x : 0,
        y:
          effector.floor === true
            ? -HumanColliders.lowest(
                body,
                new Map([
                  [target.bone, frame],
                  [effector.end!, bones.get(effector.end!)!],
                ]),
              )
            : axes.includes("y")
              ? target.goal.y - current.y
              : 0,
        z: axes.includes("z") ? target.goal.z - current.z : 0,
      };
    },
  );
  const sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const count: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const [index, effector] of effectors.entries()) {
    if (effector.limb !== undefined) continue;
    for (const axis of effector.target.axes ?? AXES) {
      sum[axis] += correction[index]![axis];
      ++count[axis];
    }
  }
  const translation: IAutoMovieVector3 = {
    x: count.x === 0 ? 0 : sum.x / count.x,
    y: count.y === 0 ? 0 : sum.y / count.y,
    z: count.z === 0 ? 0 : sum.z / count.z,
  };
  const nextKnee: SeedPoint =
    knee === undefined
      ? undefined
      : AutoMovieEngineVector3.add(
          bones.get(knee.target.bone)!.worldPosition,
          correction[effectors.indexOf(knee)]!,
        );
  const move: IAutoMovieVector3 =
    nextKnee === undefined
      ? translation
      : (kneePlacement(bones, near, nextKnee, effectors, correction) ??
        translation);
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const [index, effector] of effectors.entries()) {
    if (effector.limb === undefined) continue;
    const end: IAutoMovieResolvedBone = bones.get(effector.end!)!;
    const middle: IAutoMovieResolvedBone = bones.get(effector.middle!)!;
    limbs[effector.limb] = {
      point: AutoMovieEngineVector3.add(end.worldPosition, correction[index]!),
      rotation: end.worldRotation,
      bend: AutoMovieEngineVector3.add(middle.worldPosition, move),
      planted: true,
    };
  }
  if (nextKnee !== undefined && limbs[`${near}Leg`] === undefined) {
    const shin: IAutoMovieVector3 = bones.get(`${near}LowerLeg`)!.worldPosition;
    const ankle: IAutoMovieResolvedBone = bones.get(`${near}Foot`)!;
    limbs[`${near}Leg`] = {
      point: AutoMovieEngineVector3.add(nextKnee, AutoMovieEngineVector3.subtract(ankle.worldPosition, shin)),
      bend: nextKnee,
      rotation: ankle.worldRotation,
      planted: true,
    };
  }
  const shifted: IAutoMovieMotionHumanPosture = {
    ...from,
    root: AutoMovieEngineVector3.add(from.root, move),
    limbs,
  };
  const fitted: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    shifted,
    undefined,
    undefined,
    read,
  ).pose;
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const joint of fitted.joints)
    joints[joint.bone] = [
      joint.flexion ?? 0,
      joint.abduction ?? 0,
      joint.twist ?? 0,
    ];
  return { ...shifted, joints, limbs: {} };
}

/*
 * An articulated contact that the body fit must bring to its target.
 */
interface IEffector {
  /*
   * The side's arm or leg, if the contact rides its endpoint.
   */
  limb?: AutoMovieHumanLimb;

  /*
   * Its wrist or ankle when there is a limb.
   */
  end?: AutoMovieHumanoidBone;

  /*
   * Its elbow or knee when there is a limb.
   */
  middle?: AutoMovieHumanoidBone;

  /*
   * The shoulder or hip of the limb.
   */
  start?: AutoMovieHumanoidBone;

  /*
   * The point for the static fit, in its declared goal frame.
   */
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget;

  /*
   * A floor-bearing foot supplies its own sole height when y is implicit.
   */
  floor?: boolean;
}

/*
 * An optional additional starting pose for a severely displaced support.
 */
type Seed = IAutoMovieMotionHumanPosture | undefined;

/*
 * A fully specified Cartesian goal constrains all world coordinates.
 */
const AXES: NonNullable<IAutoMovieMotionHumanBodyFitTypes.ITarget["axes"]> = [
  "x",
  "y",
  "z",
];

/*
 * A directional upper bound on the hip placement sphere.
 */
interface ICap {
  normal: IAutoMovieVector3;
  limit: number;
}

/*
 * A geometrically available root displacement.
 */
type SeedPoint = IAutoMovieVector3 | undefined;

/*
 * A single planted knee where closed-form reach caps apply.
 */
type Knee = IEffector | undefined;

/*
 * Floating-point guard on the unit-vector dot products.
 */
const SPHERE_ROUNDOFF: number = 8 * Number.EPSILON;

/*
 * A placed knee leaves its hip a sphere of thigh radius. Holding each other
 * endpoint within its chain's length cuts the sphere by a plane:
 *
 * |knee + hipOffset + radius \* direction - end|² ≤ chainLength².
 *
 * The nearest direction is the original, one plane circle, or the intersection
 * of two such circles.
 */
function kneePlacement(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: AutoMovieHumanSide,
  knee: IAutoMovieVector3,
  effectors: readonly IEffector[],
  corrections: readonly IAutoMovieVector3[],
): SeedPoint {
  const hip: IAutoMovieVector3 = bones.get(`${side}UpperLeg`)!.worldPosition;
  const radius: number = AutoMovieEngineVector3.distance(
    hip,
    bones.get(`${side}LowerLeg`)!.worldPosition,
  );
  if (radius <= 0) return undefined;
  const toward: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(hip, knee),
  );
  const caps: ICap[] = [];
  for (const [index, effector] of effectors.entries()) {
    if (effector.start === undefined || effector.limb === `${side}Leg`)
      continue;
    const from: IAutoMovieVector3 = bones.get(effector.start)!.worldPosition;
    const mid: IAutoMovieVector3 = bones.get(effector.middle!)!.worldPosition;
    const end: IAutoMovieVector3 = bones.get(effector.end!)!.worldPosition;
    const fixed: IAutoMovieVector3 = AutoMovieEngineVector3.add(end, corrections[index]!);
    const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      AutoMovieEngineVector3.add(knee, AutoMovieEngineVector3.subtract(from, hip)),
      fixed,
    );
    const distance: number = AutoMovieEngineVector3.length(delta);
    const reach: number =
      AutoMovieEngineVector3.distance(from, mid) + AutoMovieEngineVector3.distance(mid, end);
    if (distance + radius <= reach) continue;
    if (distance === 0 || Math.abs(distance - radius) > reach) return undefined;
    caps.push({
      normal: AutoMovieEngineVector3.scale(delta, 1 / distance),
      limit:
        (reach * reach - distance * distance - radius * radius) /
        (2 * distance * radius),
    });
  }
  let best: SeedPoint;
  let score: number = -Infinity;
  function candidate(point: IAutoMovieVector3): void {
    const fit: number = AutoMovieEngineVector3.dot(point, toward);
    if (
      fit > score &&
      caps.every(
        (cap: ICap): boolean =>
          AutoMovieEngineVector3.dot(cap.normal, point) <= cap.limit + SPHERE_ROUNDOFF,
      )
    ) {
      best = point;
      score = fit;
    }
  }
  candidate(toward);
  if (best === undefined)
    for (const [i, a] of caps.entries()) {
      const pole: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
        toward,
        a.normal,
        -AutoMovieEngineVector3.dot(toward, a.normal),
      );
      if (AutoMovieEngineVector3.length(pole) > SPHERE_ROUNDOFF)
        candidate(
          AutoMovieEngineVector3.addScaled(
            AutoMovieEngineVector3.scale(a.normal, a.limit),
            AutoMovieEngineVector3.normalize(pole),
            Math.sqrt(Math.max(0, 1 - a.limit * a.limit)),
          ),
        );
      for (let j: number = i + 1; j < caps.length; ++j) {
        const b: ICap = caps[j]!;
        const dot: number = AutoMovieEngineVector3.dot(a.normal, b.normal);
        const determinant: number = 1 - dot * dot;
        if (determinant <= SPHERE_ROUNDOFF) continue;
        const line: IAutoMovieVector3 = AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(a.normal, (a.limit - dot * b.limit) / determinant),
          AutoMovieEngineVector3.scale(b.normal, (b.limit - dot * a.limit) / determinant),
        );
        const lengthSq: number = AutoMovieEngineVector3.dot(line, line);
        if (lengthSq > 1 + SPHERE_ROUNDOFF) continue;
        const across: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
          AutoMovieEngineVector3.cross(a.normal, b.normal),
        );
        const acrossRadius: number = Math.sqrt(Math.max(0, 1 - lengthSq));
        candidate(AutoMovieEngineVector3.addScaled(line, across, acrossRadius));
        candidate(AutoMovieEngineVector3.addScaled(line, across, -acrossRadius));
      }
    }
  return best === undefined
    ? undefined
    : AutoMovieEngineVector3.subtract(AutoMovieEngineVector3.addScaled(knee, best, radius), hip);
}
