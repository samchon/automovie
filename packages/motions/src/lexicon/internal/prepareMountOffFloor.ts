import { Quaternion, Vector3, hingedArmSwivel, AutoMovieEngineMotionSampling, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * The ground plant after a dismount. At touchdown a leg acquires its own
 * floor placement, with no swivel carried over from its flight. Fit the
 * stance knots with the native contact re-aim, then keep its reached foot
 * turn and actual knee branch. Playback reconstructs the ankle about the
 * fixed stance contact and uses the prepared branch for closed-form placement.
 * Parameter body: The dismounting body.
 * Parameter side: The leg taking the floor.
 * Parameter start: The touchdown, on the action clock.
 * Parameter end: The end of the stance on that clock.
 * Parameter posture: The lower posture with the authored floor goal.
 * Returns: The floor goal and toes at a second of the plant.
 */
export function prepareMountOffFloor(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  start: number,
  end: number,
  posture: (t: number) => IAutoMovieMotionHumanPosture,
): prepareMountOffFloor.Read {
  const limb: AutoMovieHumanLimb = `${side}Leg`;
  const foot: AutoMovieHumanoidBone = `${side}Foot`;
  const toes: AutoMovieHumanoidBone = `${side}Toes`;
  const bones: readonly AutoMovieHumanoidBone[] = [
    `${side}UpperLeg`,
    `${side}LowerLeg`,
    foot,
    toes,
  ];
  const rest: IAutoMovieHumanLimbGoal = posture(end).limbs[limb]!;
  const contact: IAutoMovieVector3 = rest.contact!;
  const anchor: IAutoMovieVector3 = Vector3.add(
    rest.point,
    Quaternion.rotateVector(rest.rotation!, contact),
  );
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const readFoot: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    new Set<AutoMovieHumanoidBone>([foot]),
  );
  const step: number = AutoMovieMotionHumanArmCourse.STEP;
  const times: readonly number[] = AutoMovieEngineMotionSampling.windowSampleTimes(start, end, 1 / step);
  const knots: IKnot[] = [];
  for (const t of times) {
    const at: IAutoMovieMotionHumanPosture = posture(t);
    const asked: IAutoMovieHumanLimbGoal = at.limbs[limb]!;
    const previous: IAutoMovieSwivelSeed | null = knots.at(-1)?.seed ?? null;
    const placed: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(
        body,
        {
          ...at,
          limbs: {
            [limb]: {
              ...asked,
              point: Vector3.subtract(
                anchor,
                Quaternion.rotateVector(asked.rotation!, contact),
              ),
            },
          },
        },
        undefined,
        previous === null
          ? undefined
          : {
              [limb]: { ...previous, tolerance: hingedArmSwivel.RESOLUTION },
            },
        resolution,
      );
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const joint of placed.pose.joints)
      if (bones.includes(joint.bone))
        joints[joint.bone] = [
          joint.flexion ?? 0,
          joint.abduction ?? 0,
          joint.twist ?? 0,
        ];
    // A native fallback can still land exactly on the contact. Read its
    // achieved swivel from the real joints instead of keeping the old seed.
    knots.push({
      bend: asked.bend,
      rotation: readFoot(placed.pose, resolution()).get(foot)!.worldRotation,
      seed: HumanLimbFit.seed(body, placed.pose, limb),
      joints,
    });
  }
  const intervals: IInterval[] = knots
    .slice(0, Math.max(1, knots.length - 1))
    .map((a: IKnot, index: number): IInterval => {
      const b: IKnot = knots[index + 1] ?? a;
      // A free knee axis or a degenerate chain has no hinge coordinates. A
      // branch change likewise has no single swivel chart. Keep the actual
      // planted joint endpoints through that interval.
      if (a.seed === null || b.seed === null || a.seed.branch !== b.seed.branch) {
        const reads: ReturnType<typeof blends> = blends(bones, a, b);
        return (share: number): prepareMountOffFloor.IPlaced => {
          const joints: IAutoMovieMotionHumanPosture["joints"] = {};
          for (const [bone, read] of reads) joints[bone] = read(share);
          return { joints };
        };
      }
      const from: IAutoMovieSwivelSeed = a.seed;
      const to: IAutoMovieSwivelSeed = b.seed;
      const swivel: number = AutoMovieEngineMath.wrapDegrees(to.swivel - from.swivel);
      const toe: JointRead | undefined = blends([toes], a, b)[0]?.[1];
      return (share: number): prepareMountOffFloor.IPlaced => {
        const rotation: IAutoMovieQuaternion = Quaternion.slerp(
          a.rotation,
          b.rotation,
          share,
        );
        return {
          goal: {
            point: Vector3.subtract(
              anchor,
              Quaternion.rotateVector(rotation, contact),
            ),
            rotation,
            bend: Vector3.lerp(a.bend, b.bend, share),
            planted: true,
            contact,
            seed: { ...from, swivel: from.swivel + share * swivel },
          },
          joints: toe === undefined ? {} : { [toes]: toe(share) },
        };
      };
    });
  return (t: number): prepareMountOffFloor.IPlaced => {
    let low: number = 0;
    let high: number = times.length - 1;
    while (high - low > 1) {
      const middle: number = (low + high) >> 1;
      if (t < times[middle]!) high = middle;
      else low = middle;
    }
    const share: number =
      low === high
        ? 0
        : Math.min(
            1,
            Math.max(0, (t - times[low]!) / (times[high]! - times[low]!)),
          );
    return intervals[low]!(share);
  };

  function blends(
    names: readonly AutoMovieHumanoidBone[],
    a: IKnot,
    b: IKnot,
  ): readonly (readonly [AutoMovieHumanoidBone, JointRead])[] {
    const result: [AutoMovieHumanoidBone, JointRead][] = [];
    for (const bone of names) {
      const from = a.joints[bone];
      const to = b.joints[bone];
      if (from !== undefined && to !== undefined)
        result.push([bone, blendHumanJoint.between(body, bone, from, to)]);
    }
    return result;
  }
}

/*
 * The prepared goal and reader of a dismount stance.
 */
export namespace prepareMountOffFloor {
  /*
   * A hinged foot goal with its toes, or the native joints if not hinged.
   */
  export interface IPlaced {
    goal?: IAutoMovieHumanLimbGoal;
    joints: IAutoMovieMotionHumanPosture["joints"];
  }

  /*
   * A stance's prepared floor placement, in action seconds.
   */
  export type Read = (t: number) => IPlaced;
}

/*
 * The geometry the native contact fit placed at one stance knot.
 */
interface IKnot {
  bend: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  seed: IAutoMovieSwivelSeed | null;
  joints: IAutoMovieMotionHumanPosture["joints"];
}

/*
 * One interval's native joint blend, in clinical degrees.
 */
type JointRead = ReturnType<typeof blendHumanJoint.between>;

/*
 * One prepared interval read by its share.
 */
type IInterval = (share: number) => prepareMountOffFloor.IPlaced;
