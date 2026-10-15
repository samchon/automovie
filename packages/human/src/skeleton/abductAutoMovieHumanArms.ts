import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * How the shoulder girdle moves while the arm is raised from hanging to 90 degrees of abduction, degrees, from bone-pin tracking of twelve healthy adults (Ludewig et al. 2009, J Bone Joint Surg Am 91(2):378-389, Results): from 30 to 120 degrees of humerothoracic elevation the clavicle retracted 16 degrees (23 to 39) and elevated 6 (11 to 17) at the sternoclavicular joint, and the scapula, relative to the clavicle at the acromioclavicular joint, rotated upward 11 degrees (5 to 16) and tilted posteriorly 19 (-4 to 15); the scapulohumeral rhythm was 2.1:1 in abduction. Those changes over 90 degrees of arm elevation are taken as the change from the hanging arm to the T-pose's 90. The scapular plane stands 40 degrees internally rotated from the frontal plane (scapulothoracic internal rotation 41.1 degrees at rest, Table I). Grade: measured, then derived (the 30-to-120 change carried to 0-to-90).
 */
const GIRDLE: Record<
  | "clavicleRetraction"
  | "clavicleElevation"
  | "scapularUpwardRotation"
  | "scapularPosteriorTilt"
  | "scapularPlane",
  number
> = {
  clavicleRetraction: 16,
  clavicleElevation: 6,
  scapularUpwardRotation: 11,
  scapularPosteriorTilt: 19,
  scapularPlane: 40,
};

/** Bones raised with each arm: the upper arm and everything it carries. */
type ISide = "left" | "right";

/**
 * Convert both arms between the anthropometric posture (arms hanging) and the canonical T-pose rest, the one conversion between where the skeleton is measured and where it rests.
 *
 * Raising, each side first moves its shoulder girdle as a real 90-degree abduction does ({@link GIRDLE}): the clavicle turns about the sternoclavicular joint, elevating and retracting, and the scapula turns about the acromion, rotating upward and tilting posteriorly, carrying the acromion and the shoulder joint centre with it; the shoulder joint centre therefore rises and swings back along the clavicle's arc. The upper arm and every bone below it then take the canonical T-pose orientation, turned 90 degrees in the frontal plane about the moved shoulder joint centre with their joint centres, tails, declared axes and landmarks, so the arm lies horizontal with the palm down whatever the girdle did; positive abduction turns the left arm counter-clockwise seen from the front's +Z, the right arm clockwise. Last the arm slides toward the midline by `slide`, the share of the measured span the girdle's motion does not explain (see `generateAutoMovieHumanSkeleton`). The clavicle's tail follows the shoulder joint centre; the sternoclavicular joint and everything medial stay.
 *
 * Lowering inverts exactly: the slide and the shoulder joint centre's hanging depth below the acromion are recovered from the T-pose shoulder itself, because the girdle's motion is fixed and the hanging shoulder joint centre stands directly below the acromion. Raising and then lowering returns the original positions to floating-point precision.
 *
 * @param skeleton Skeleton to convert; not modified
 * @param direction `"raise"` from hanging to the T-pose, `"lower"` back
 * @param slide Slide of each raised arm toward the midline, millimetres; read only when raising
 * @returns A new skeleton with both arms converted
 */
export function abductAutoMovieHumanArms(
  skeleton: IAutoMovieHumanSkeleton,
  direction: "raise" | "lower",
  slide: Record<ISide, number>,
): IAutoMovieHumanSkeleton {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const find: (bone: AutoMovieHumanoidBone) => IAutoMovieHumanSkeleton.IJoint = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieHumanSkeleton.IJoint =>
    skeleton.joints.find(
      (joint: IAutoMovieHumanSkeleton.IJoint): boolean => joint.bone === bone,
    )!;

  // per side: the rigid map of the arm chain, the moved acromion and the moved shoulder centre
  const arm: Map<AutoMovieHumanoidBone, (p: IAutoMovieVector3, along: boolean) => IAutoMovieVector3> =
    new Map();
  const acromion: Partial<Record<ISide, IAutoMovieVector3>> = {};
  const shoulderTail: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const side of ["left", "right"] as const) {
    const s: number = side === "left" ? 1 : -1;
    const upper: IAutoMovieHumanSkeleton.IJoint = find(`${side}UpperArm`);
    const sternal: IAutoMovieVector3 = skeleton.landmarks[side].clavicale.position;
    const girdle: IGirdle = girdleOf(s);
    let from: IAutoMovieVector3;
    let to: IAutoMovieVector3;
    let turn: number;
    if (direction === "raise") {
      const a: IAutoMovieVector3 = skeleton.landmarks[side].acromion.position;
      const moved: IAutoMovieVector3 = V.offset(sternal, [girdle.clavicle(V.offset(a, [sternal, -1])), 1]);
      acromion[side] = moved;
      from = upper.position;
      to = V.offset(
        moved,
        [girdle.whole(V.offset(upper.position, [a, -1])), 1],
        [V.of(-s, 0, 0), slide[side]],
      );
      turn = s * 90;
    } else {
      const moved: IAutoMovieVector3 = skeleton.landmarks[side].acromion.position;
      const a: IAutoMovieVector3 = V.offset(sternal, [
        girdle.clavicleInverse(V.offset(moved, [sternal, -1])),
        1,
      ]);
      acromion[side] = a;
      // the shoulder centre hung a depth d below the acromion: T-pose offset = d·u + slide·(-s, 0, 0)
      const u: IAutoMovieVector3 = girdle.whole(V.of(0, -1, 0));
      const offset: IAutoMovieVector3 = V.offset(upper.position, [moved, -1]);
      const depth: number = offset.y / u.y;
      from = upper.position;
      to = V.offset(a, [V.of(0, -1, 0), depth]);
      turn = -s * 90;
    }
    const map: (p: IAutoMovieVector3, along: boolean) => IAutoMovieVector3 = (
      p: IAutoMovieVector3,
      along: boolean,
    ): IAutoMovieVector3 =>
      along
        ? V.rotateZ(p, V.of(0, 0, 0), turn)
        : V.offset(V.rotateZ(p, from, turn), [to, 1], [from, -1]);
    const moved: Set<AutoMovieHumanoidBone> = new Set([upper.bone]);
    for (const joint of skeleton.joints)
      if (joint.parent !== null && moved.has(joint.parent)) moved.add(joint.bone);
    for (const bone of moved) arm.set(bone, map);
    shoulderTail.set(`${side}Shoulder`, to);
  }

  const point: (bone: AutoMovieHumanoidBone, p: IAutoMovieVector3) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 => arm.get(bone)?.(p, false) ?? p;
  const turned: (bone: AutoMovieHumanoidBone, d: IAutoMovieVector3) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
    d: IAutoMovieVector3,
  ): IAutoMovieVector3 => arm.get(bone)?.(d, true) ?? d;
  const sideLandmarks: (side: ISide) => IAutoMovieHumanLandmarks.ISide = (
    side: ISide,
  ): IAutoMovieHumanLandmarks.ISide =>
    Object.fromEntries(
      Object.entries(skeleton.landmarks[side]).map(
        ([key, value]: [string, IAutoMovieHumanLandmarks.ILandmark]): [
          string,
          IAutoMovieHumanLandmarks.ILandmark,
        ] => [
          key,
          {
            bone: value.bone,
            position:
              key === "acromion" ? acromion[side]! : point(value.bone, value.position),
          },
        ],
      ),
    ) as unknown as IAutoMovieHumanLandmarks.ISide;
  return {
    joints: skeleton.joints.map(
      (joint: IAutoMovieHumanSkeleton.IJoint): IAutoMovieHumanSkeleton.IJoint => ({
        ...joint,
        position: point(joint.bone, joint.position),
        // the clavicle ends at the shoulder joint centre wherever the girdle and slide take it
        tail: shoulderTail.get(joint.bone) ?? point(joint.bone, joint.tail),
        axes: {
          flexion: turned(joint.bone, joint.axes.flexion),
          abduction: turned(joint.bone, joint.axes.abduction),
          twist: turned(joint.bone, joint.axes.twist),
        },
      }),
    ),
    landmarks: {
      ...skeleton.landmarks,
      left: sideLandmarks("left"),
      right: sideLandmarks("right"),
    },
  };
}

/** The girdle's rotations for one side, as maps of directions. */
interface IGirdle {
  /** The clavicle's turn about the sternoclavicular joint. */
  clavicle: (d: IAutoMovieVector3) => IAutoMovieVector3;

  /** Its inverse. */
  clavicleInverse: (d: IAutoMovieVector3) => IAutoMovieVector3;

  /** The clavicle's turn followed by the scapula's about the acromion: what a vector from the acromion to a point the scapula carries becomes. */
  whole: (d: IAutoMovieVector3) => IAutoMovieVector3;
}

/**
 * Build one side's girdle rotations from {@link GIRDLE}.
 *
 * The clavicle elevates about the forward axis and retracts about the vertical axis, signed so its lateral end rises and moves back on either side. The scapula then turns about axes that ride on the clavicle: upward rotation about the normal of the scapular plane, signed so points below the acromion swing laterally, and posterior tilt about the plane's horizontal mediolateral line, signed so points below the acromion swing forward.
 *
 * @param s +1 for the left side, -1 for the right
 * @returns The side's rotations
 */
function girdleOf(s: number): IGirdle {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const elevation: IAutoMovieVector3 = V.of(0, 0, s);
  const retraction: IAutoMovieVector3 = V.of(0, s, 0);
  const clavicle: (d: IAutoMovieVector3) => IAutoMovieVector3 = (
    d: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    rotate(rotate(d, elevation, GIRDLE.clavicleElevation), retraction, GIRDLE.clavicleRetraction);
  const clavicleInverse: (d: IAutoMovieVector3) => IAutoMovieVector3 = (
    d: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    rotate(rotate(d, retraction, -GIRDLE.clavicleRetraction), elevation, -GIRDLE.clavicleElevation);
  const plane: number = (GIRDLE.scapularPlane * Math.PI) / 180;
  // the scapular plane faces forward and out; its normal and its horizontal line, before the clavicle turns
  const normal: IAutoMovieVector3 = V.of(-s * Math.sin(plane), 0, Math.cos(plane));
  const across: IAutoMovieVector3 = V.of(s * Math.cos(plane), 0, Math.sin(plane));
  const below: IAutoMovieVector3 = V.of(0, -1, 0);
  const signed: (axis: IAutoMovieVector3, toward: IAutoMovieVector3) => IAutoMovieVector3 = (
    axis: IAutoMovieVector3,
    toward: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    V.dot(V.cross(axis, below), toward) >= 0 ? axis : V.offset(V.of(0, 0, 0), [axis, -1]);
  const upward: IAutoMovieVector3 = clavicle(signed(normal, V.of(s, 0, 0)));
  const tilt: IAutoMovieVector3 = clavicle(signed(across, V.of(0, 0, 1)));
  return {
    clavicle,
    clavicleInverse,
    whole: (d: IAutoMovieVector3): IAutoMovieVector3 =>
      rotate(
        rotate(clavicle(d), upward, GIRDLE.scapularUpwardRotation),
        tilt,
        GIRDLE.scapularPosteriorTilt,
      ),
  };
}

/**
 * Rotate a vector about a unit axis by the right-hand rule (Rodrigues' formula).
 *
 * @param v Vector
 * @param axis Unit axis
 * @param degrees Angle, degrees
 * @returns The rotated vector
 */
function rotate(v: IAutoMovieVector3, axis: IAutoMovieVector3, degrees: number): IAutoMovieVector3 {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const r: number = (degrees * Math.PI) / 180;
  const c: number = Math.cos(r);
  return V.offset(
    V.of(0, 0, 0),
    [v, c],
    [V.cross(axis, v), Math.sin(r)],
    [axis, V.dot(axis, v) * (1 - c)],
  );
}
