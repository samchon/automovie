import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSegmentPlant } from "../perform/HumanSegmentPlant";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Read a jump phase's achieved canonical endpoint, including its ordinary final
 * clamp and planted refit, before a free phase inherits that shape. This reads
 * the law's own posture, not arbitrary composed overlays or cuts.
 *
 * @param body The actual unchanged body.
 * @param posture The law's already lowered raw endpoint.
 * @param legs The knee/ankle FK reader `prepareLegs` built for this body by the
 *   caller.
 * @param resolution Optional exact FK source borrowed from this same
 *   synchronous endpoint preparation.
 * @param projection Optional genuine same-body ROM projector borrowed only
 *   through this endpoint's canonical solve and final clamp.
 * @returns Owned canonical joint values and root-local achieved foot/knee
 *   geometry.
 * @throws {Error} When preparation is attempted after a whole-body flight
 *   rotation or without a physical canonical root.
 */
export function jumpState(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  legs: ReturnType<typeof jumpState.prepareLegs>,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
): jumpState.IState {
  if (posture.rotation !== undefined)
    throw new Error(
      "Jump endpoint preparation precedes whole-body flight rotation",
    );
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(resolution);
  const project: ReturnType<typeof prepareHumanPostureProjection> =
    projection ?? prepareHumanPostureProjection(body);
  const resolved: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    posture,
    undefined,
    undefined,
    read,
    undefined,
    project,
  ).pose;
  const clamped: IAutoMoviePose = prepareHumanPostureProjection.project(
    body,
    resolved,
    project,
  );
  const pose: IAutoMoviePose = HumanSegmentPlant.fit(
    body,
    clamped,
    posture.limbs,
    undefined,
    read,
  ).pose;
  if (pose.root === null)
    throw new Error("A jump endpoint requires its physical root");
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  for (const joint of pose.joints)
    joints[joint.bone] = [
      joint.flexion ?? 0,
      joint.abduction ?? 0,
      joint.twist ?? 0,
    ];
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = legs(
    { ...pose, root: null },
    read(),
  );
  const leg: (side: AutoMovieHumanSide) => jumpState.ILeg = (
    side: AutoMovieHumanSide,
  ): jumpState.ILeg => {
    const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
    return {
      point: foot.worldPosition,
      rotation: foot.worldRotation,
      bend: bones.get(`${side}LowerLeg`)!.worldPosition,
    };
  };
  return {
    pose,
    root: { ...pose.root.translation },
    joints,
    legs: { left: leg("left"), right: leg("right") },
  };
}

/** Canonical endpoint data shared by the jump's free-flight shape and COM. */
export namespace jumpState {
  /**
   * Prepare the knee and ankle FK reader `of` reads endpoint legs with, once
   * per jump plan for its unchanged body.
   *
   * @param body The plan's unchanged body.
   * @returns A reader of the four leg bones' frames for a pose.
   */
  export function prepareLegs(
    body: IAutoMovieMotionHumanBody,
  ): ReturnType<typeof poseBones.prepare> {
    return poseBones.prepare(body, LEG_BONES);
  }

  /**
   * Only achieved ankles and knees are consumed after full canonical endpoint
   * resolution.
   */
  const LEG_BONES: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftFoot",
    "rightFoot",
    "leftLowerLeg",
    "rightLowerLeg",
  ]);

  /** One achieved leg in the canonical root frame. */
  export interface ILeg {
    /** Achieved ankle, root-frame metres. */
    point: IAutoMovieVector3;
    /** Achieved knee used as its free bend pole, root-frame metres. */
    bend: IAutoMovieVector3;
    /** Achieved foot rotation in the root frame. */
    rotation: IAutoMovieQuaternion;
  }

  /** One finalized source state. */
  export interface IState {
    /** Actual finalized canonical pose. */
    pose: IAutoMoviePose;
    /** World root translation, metres. */
    root: IAutoMovieVector3;
    /** Achieved clinical angles, degrees; neutral nulls read as zero. */
    joints: IAutoMovieMotionHumanPosture["joints"];
    /** Achieved geometry of both legs in the canonical root frame. */
    legs: Record<AutoMovieHumanSide, ILeg>;
  }
}
