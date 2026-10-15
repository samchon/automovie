import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Turn both arms in the frontal plane about their shoulder joint centres by a clinical abduction angle: the one conversion between the anthropometric posture (arms hanging) and the canonical T-pose rest.
 *
 * The upper arm and every bone below it rotate rigidly about the shoulder joint centre, with their joint centres, tails, declared axes and the landmarks they carry, then slide toward the midline by `medial` for each 90 degrees: a real abduction brings the acromion markedly closer to the radiale (acromion-radiale 235.9 mm in women and 244.8 mm in men abducted 90 degrees, against about 323 and 331 mm adducted from de Leva's own joint-centre offsets and upper-arm lengths; de Leva 1996, J Biomech 29(9):1223-1230, Tables 1, 2 and 4), so the arm reaches less far from the trunk than it hangs. The clavicle, the acromion and everything medial stay, and the clavicle's tail follows the shoulder joint centre. That matches the engine's `HUMANOID_REST_FRAME`, which gives the upper arm 90 degrees of clinical abduction at rest and the shoulder bone none. Positive angles raise both arms: the left arm turns counter-clockwise seen from the front's +Z, the right arm clockwise. Hanging palms that face the thighs end facing down, the canonical T-pose palm.
 *
 * Applying +90 and then −90 with the same slide returns the original positions to floating-point precision: the turn is about the shoulder joint centre as it stands, and the slide is reversed with the angle.
 *
 * @param skeleton Skeleton to convert; not modified
 * @param degrees Abduction to add, degrees
 * @param medial Slide of each arm toward the midline per 90 degrees, millimetres
 * @returns A new skeleton with both arms turned
 */
export function abductAutoMovieHumanArms(
  skeleton: IAutoMovieHumanSkeleton,
  degrees: number,
  medial: Record<"left" | "right", number>,
): IAutoMovieHumanSkeleton {
  const pivots: Map<AutoMovieHumanoidBone, [IAutoMovieVector3, number]> = new Map();
  const slides: Map<AutoMovieHumanoidBone, number> = new Map();
  const shoulders: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone> = new Map();
  for (const side of ["left", "right"] as const) {
    const upper: IAutoMovieHumanSkeleton.IJoint = skeleton.joints.find(
      (joint: IAutoMovieHumanSkeleton.IJoint): boolean =>
        joint.bone === `${side}UpperArm`,
    )!;
    const angle: number = side === "left" ? degrees : -degrees;
    const moved: Set<AutoMovieHumanoidBone> = new Set([upper.bone]);
    for (const joint of skeleton.joints)
      if (joint.parent !== null && moved.has(joint.parent)) moved.add(joint.bone);
    const slide: number = -(side === "left" ? 1 : -1) * medial[side] * (degrees / 90);
    for (const bone of moved) {
      pivots.set(bone, [upper.position, angle]);
      slides.set(bone, slide);
    }
    shoulders.set(`${side}Shoulder`, upper.bone);
  }
  const point: (bone: AutoMovieHumanoidBone, p: IAutoMovieVector3) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const pivot: [IAutoMovieVector3, number] | undefined = pivots.get(bone);
    if (pivot === undefined) return p;
    const turned: IAutoMovieVector3 = AutoMovieHumanVector.rotateZ(p, pivot[0], pivot[1]);
    return { x: turned.x + slides.get(bone)!, y: turned.y, z: turned.z };
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
        // the clavicle ends at the shoulder joint centre wherever the slide takes it
        tail: shoulders.has(joint.bone)
          ? point(shoulders.get(joint.bone)!, joint.tail)
          : point(joint.bone, joint.tail),
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
