import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  fitChainToTarget,
  indexSkeletonTopology,
  jointRomOvershoot,
  resolvePose,
  rotationBetween,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The trunk with two T-posed arms and the readings
 * `test_motion_fit_chain_reach` fits and reads them with: the arms, one arm's
 * fit, a pose's world bones, a joint of a pose, a joint's range by the
 * engine's own measure and a hand's rotation from where its fingers point and
 * its palm faces.
 */

export namespace motionFitArms {
  /** A trunk with two T-posed arms. */
  export function arms(): IAutoMovieSkeleton {
    const bone = (
      name: AutoMovieHumanoidBone,
      parent: AutoMovieHumanoidBone | null,
      x: number,
      y: number,
    ): IAutoMovieBone => ({
      bone: name,
      parent,
      rest: {
        translation: { x, y, z: 0 },
        rotation: Quaternion.identity(),
        scale: { x: 1, y: 1, z: 1 },
      },
      constraint: null,
    });
    return {
      id: "arms",
      bones: [
        bone("hips", null, 0, 1),
        bone("spine", "hips", 0, 0.15),
        bone("chest", "spine", 0, 0.2),
        bone("leftUpperArm", "chest", 0.18, 0.15),
        bone("leftLowerArm", "leftUpperArm", 0.3, 0),
        bone("leftHand", "leftLowerArm", 0.25, 0),
        bone("rightUpperArm", "chest", -0.18, 0.15),
        bone("rightLowerArm", "rightUpperArm", -0.3, 0),
        bone("rightHand", "rightLowerArm", -0.25, 0),
      ],
    };
  }

  /** Fit one arm. */
  export function fit(
    skeleton: IAutoMovieSkeleton,
    side: "left" | "right",
    target: IAutoMovieVector3,
    bend: IAutoMovieVector3,
    effectorRotation?: IAutoMovieQuaternion,
  ): IAutoMoviePose {
    return fitChainToTarget({
      skeleton,
      pose: { skeleton: skeleton.id, root: null, joints: [] },
      chain: {
        upper: `${side}UpperArm`,
        lower: `${side}LowerArm`,
        effector: `${side}Hand`,
      },
      target,
      bend,
      ...(effectorRotation === undefined ? {} : { effectorRotation }),
      topology: indexSkeletonTopology(skeleton),
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    });
  }

  /** World bones of a pose. */
  export function fk(
    skeleton: IAutoMovieSkeleton,
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    return new Map(
      resolvePose(pose, skeleton, HUMANOID_JOINT_AXES, HUMANOID_REST_FRAME).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
  }

  /** A joint of a pose, at rest when absent. */
  export function joint(
    pose: IAutoMoviePose,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieJointPose {
    return (
      pose.joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone) ?? {
        bone,
        flexion: 0,
        abduction: 0,
        twist: 0,
      }
    );
  }

  /**
   * Whether a joint lies inside its default range, 1e-6 degrees allowed for
   * rounding, by the engine's own measure: the shoulder's range is a swing and
   * a twist (IAutoMovieJointConstraint.swingTwist), which its three clinical
   * angles only read, and the elbow's is its three angles.
   */
  export function inRange(j: IAutoMovieJointPose): boolean {
    return jointRomOvershoot(j, DEFAULT_HUMANOID_ROM[j.bone]!) <= 1e-6;
  }

  /** A hand's world rotation from rest for where its fingers point and its palm faces (rest: left fingers +X, right fingers -X, palms -Y). */
  export function hand(
    fingers: IAutoMovieVector3,
    palm: IAutoMovieVector3,
    side: "left" | "right" = "left",
  ): IAutoMovieQuaternion {
    const swing: IAutoMovieQuaternion = rotationBetween(
      { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      fingers,
    );
    const turned: IAutoMovieVector3 = Quaternion.rotateVector(swing, {
      x: 0,
      y: -1,
      z: 0,
    });
    const axis: IAutoMovieVector3 = Vector3.normalize(fingers);
    const angle: number =
      (Math.atan2(
        Vector3.dot(axis, Vector3.cross(turned, palm)),
        Vector3.dot(turned, palm),
      ) *
        180) /
      Math.PI;
    return Quaternion.normalize(
      Quaternion.multiply(Quaternion.fromAxisAngle(axis, angle), swing),
    );
  }
}
