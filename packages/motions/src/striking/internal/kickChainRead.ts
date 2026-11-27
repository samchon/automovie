import { Quaternion, ROM_TOLERANCE, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingReach,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { KickChain } from "../KickChain";
import { KickForm } from "../KickForm";
import { StrikingBody } from "../StrikingBody";
import { StrikingWeapon } from "../StrikingWeapon";

/**
 * Fit the leg once and read the fitted bones back (`KickChain.prepareFit`'s
 * round): the posture's own seeded leg fit toward the asked ankle goal, knee
 * hint and foot rotation, then the weapon, the fitted knee's flexion and the
 * support foot's slip read from the fitted bones.
 *
 * @param props The kick's body, side and weapon.
 * @param base The posture the leg is fitted into.
 * @param solved The strike reach's solution the fit follows.
 * @param ask The ankle goal, knee hint and foot rotation asked.
 * @param resolution The prepared pose resolution.
 * @param projection The prepared posture projection.
 * @param frames The prepared bone frames.
 * @returns The fit.
 */
export function kickChainRead(
  props: KickChain.IProps,
  base: IAutoMovieMotionHumanPosture,
  solved: IAutoMovieMotionHumanStrikingReach.ISolution,
  ask: KickChain.IAsked,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
  projection: ReturnType<typeof prepareHumanPostureProjection>,
  frames: ReturnType<typeof poseBones.prepare>,
): KickChain.IFit {
  const { body, side }: KickChain.IProps = props;
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const pose: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    {
      ...base,
      limbs: {
        ...base.limbs,
        [`${side}Leg`]: {
          point: ask.goal,
          bend: ask.hint,
          rotation: ask.asked,
        },
      },
    },
    undefined,
    {},
    resolution,
    undefined,
    projection,
  ).pose;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = frames(
    pose,
    resolution(),
  );
  const knee: IAutoMovieVector3 = bones.get(
    `${side}LowerLeg` as AutoMovieHumanoidBone,
  )!.worldPosition;
  const foot: IAutoMovieResolvedBone = bones.get(
    `${side}Foot` as AutoMovieHumanoidBone,
  )!;
  const reached: IAutoMovieVector3 =
    props.technique === "round"
      ? Vector3.add(
          Vector3.lerp(knee, foot.worldPosition, solved.along / m.shank),
          Vector3.scale(
            props.direction,
            StrikingWeapon.girth(
              StrikingWeapon.legRadii(body)[1],
              solved.along / m.shank,
            ),
          ),
        )
      : Vector3.add(
          Vector3.add(
            foot.worldPosition,
            StrikingBody.socket(
              body,
              side === "left" ? "ballLeft" : "ballRight",
              foot.worldRotation,
            ),
          ),
          Vector3.scale(props.direction, StrikingWeapon.legRadii(body)[2][0]),
        );
  const residual: number = Vector3.distance(reached, props.planned);
  const flexion: number =
    pose.joints.find((j): boolean => j.bone === `${side}LowerLeg`)?.flexion ??
    0;

  // The fitted knee, not the solve's, decides a jam: the fit moves the
  // ankle's goal until the weapon is on the point, and where the foot's
  // own range turns the ball off the solve's assumed rotation that folds
  // the knee past the band the solve held (the staged push kick reached
  // its point with the knee at 45 to 50 degrees, its band ending at 35).
  return {
    pose,
    knee,
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
    flexion,
    reached,
    slip: slip(body, support, base, bones),
    residual,
    status: kickChainRead.status(residual, flexion, props.technique),
  };
}

/**
 * How far the fitted support foot's ball is from where its planted goal puts
 * it, metres.
 */
function slip(
  body: IAutoMovieMotionHumanBody,
  support: AutoMovieHumanSide,
  base: IAutoMovieMotionHumanPosture,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): number {
  const goal: IAutoMovieHumanLimbGoal | undefined = base.limbs[`${support}Leg`];
  if (goal === undefined || goal.rotation === undefined) return 0;
  const offset: IAutoMovieVector3 = HumanFoot.offset(body, support, "ball");
  const foot: IAutoMovieResolvedBone = bones.get(
    `${support}Foot` as AutoMovieHumanoidBone,
  )!;
  return Vector3.distance(
    Vector3.add(
      foot.worldPosition,
      Quaternion.rotateVector(foot.worldRotation, offset),
    ),
    Vector3.add(goal.point, Quaternion.rotateVector(goal.rotation, offset)),
  );
}

/** Reading a solved kick chain back. */
export namespace kickChainRead {
  /**
   * Whether a solved kick reached its target: short when its weapon misses by
   * more than `KickForm.RESIDUAL`, jammed when its knee folds past the
   * technique's greatest flexion beyond the joint tolerance, and reached
   * otherwise.
   *
   * @param residual How far the weapon misses, metres.
   * @param flexion The knee's flexion, degrees.
   * @param technique The kick.
   * @returns The status.
   */
  export function status(
    residual: number,
    flexion: number,
    technique: KickChain.IProps["technique"],
  ): KickChain.IFit["status"] {
    return residual > KickForm.RESIDUAL
      ? "short"
      : flexion > KickForm.FLEXION[technique][1] + ROM_TOLERANCE
        ? "jammed"
        : "reached";
  }
}
