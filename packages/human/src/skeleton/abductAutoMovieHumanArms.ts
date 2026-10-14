import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Turn both arms in the frontal plane about their shoulder joint centres by a clinical abduction angle: the one conversion between the anthropometric posture (arms hanging) and the canonical T-pose rest.
 *
 * The upper arm and every bone below it rotate rigidly, with their joint centres, tails, declared axes and the landmarks they carry; the clavicle, the acromion and everything medial stay. That matches the engine's `HUMANOID_REST_FRAME`, which gives the upper arm 90 degrees of clinical abduction at rest and the shoulder bone none, so the scapular share of a real abduction, which moves the acromion toward the radiale (acromion-radiale is about 75 mm shorter abducted than hanging; de Leva 1996, J Biomech 29(9):1223-1230, Table 1), is posed through the shoulder bone rather than baked into the rest. Positive angles raise both arms: the left arm turns counter-clockwise seen from the front's +Z, the right arm clockwise. Hanging palms that face the thighs end facing down, the canonical T-pose palm.
 *
 * Applying +90 and then −90 returns the original positions to floating-point precision.
 *
 * @param skeleton Skeleton to convert; not modified
 * @param degrees Abduction to add, degrees
 * @returns A new skeleton with both arms turned
 */
export function abductAutoMovieHumanArms(
  skeleton: IAutoMovieHumanSkeleton,
  degrees: number,
): IAutoMovieHumanSkeleton {
  const pivots: Map<AutoMovieHumanoidBone, [IAutoMovieVector3, number]> = new Map();
  for (const side of ["left", "right"] as const) {
    const upper: IAutoMovieHumanSkeleton.IJoint = skeleton.joints.find(
      (joint: IAutoMovieHumanSkeleton.IJoint): boolean =>
        joint.bone === `${side}UpperArm`,
    )!;
    const angle: number = side === "left" ? degrees : -degrees;
    const moved: Set<AutoMovieHumanoidBone> = new Set([upper.bone]);
    for (const joint of skeleton.joints)
      if (joint.parent !== null && moved.has(joint.parent)) moved.add(joint.bone);
    for (const bone of moved) pivots.set(bone, [upper.position, angle]);
  }
  const point: (bone: AutoMovieHumanoidBone, p: IAutoMovieVector3) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const pivot: [IAutoMovieVector3, number] | undefined = pivots.get(bone);
    return pivot === undefined
      ? p
      : AutoMovieHumanVector.rotateZ(p, pivot[0], pivot[1]);
  };
  const direction: (
    bone: AutoMovieHumanoidBone,
    d: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
    d: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const pivot: [IAutoMovieVector3, number] | undefined = pivots.get(bone);
    return pivot === undefined
      ? d
      : AutoMovieHumanVector.rotateZ(d, AutoMovieHumanVector.of(0, 0, 0), pivot[1]);
  };
  const landmark: (
    l: IAutoMovieHumanLandmarks.ILandmark,
  ) => IAutoMovieHumanLandmarks.ILandmark = (
    l: IAutoMovieHumanLandmarks.ILandmark,
  ): IAutoMovieHumanLandmarks.ILandmark => ({
    bone: l.bone,
    position: point(l.bone, l.position),
  });
  const side: (s: IAutoMovieHumanLandmarks.ISide) => IAutoMovieHumanLandmarks.ISide = (
    s: IAutoMovieHumanLandmarks.ISide,
  ): IAutoMovieHumanLandmarks.ISide =>
    Object.fromEntries(
      Object.entries(s).map(
        ([key, value]: [string, IAutoMovieHumanLandmarks.ILandmark]): [
          string,
          IAutoMovieHumanLandmarks.ILandmark,
        ] => [key, landmark(value)],
      ),
    ) as unknown as IAutoMovieHumanLandmarks.ISide;
  const { left, right, ...midline }: IAutoMovieHumanLandmarks = skeleton.landmarks;
  return {
    joints: skeleton.joints.map(
      (joint: IAutoMovieHumanSkeleton.IJoint): IAutoMovieHumanSkeleton.IJoint => ({
        ...joint,
        position: point(joint.bone, joint.position),
        tail: point(joint.bone, joint.tail),
        axes: {
          flexion: direction(joint.bone, joint.axes.flexion),
          abduction: direction(joint.bone, joint.axes.abduction),
          twist: direction(joint.bone, joint.axes.twist),
        },
      }),
    ),
    landmarks: {
      ...(Object.fromEntries(
        Object.entries(midline).map(
          ([key, value]: [string, IAutoMovieHumanLandmarks.ILandmark]): [
            string,
            IAutoMovieHumanLandmarks.ILandmark,
          ] => [key, landmark(value)],
        ),
      ) as unknown as Omit<IAutoMovieHumanLandmarks, "left" | "right">),
      left: side(left),
      right: side(right),
    },
  };
}
