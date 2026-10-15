import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";
import { placeAutoMovieHumanHand } from "./placeAutoMovieHumanHand";

/**
 * Joint centres from their landmarks along the hanging arm, fractions of the segment the offset was measured on: shoulder centre below the acromion (33.7 mm women, 34.5 mm men) and elbow centre above radiale (13.9 and 14.3 mm), both from acromion-radiale, over its pooled ANSUR II mean of 323.2 mm; wrist centre below stylion (1.5 mm) over the pooled radiale-stylion mean of 254.6 mm (de Leva 1996, J Biomech 29(9):1223-1230, Table 2; Gordon et al. 2014, NATICK/TR-15/007). Grade: derived.
 */
const JOINT_OFFSET: Record<"shoulder" | "elbow" | "wrist", number> = {
  shoulder: 0.1055,
  elbow: 0.0436,
  wrist: 0.0059,
};

/**
 * Sternoclavicular joint from the midline as a fraction of biacromial breadth. No measured source was read. Grade: conventional.
 */
const CLAVICALE_PER_BIACROMIAL: number = 0.06;

/**
 * The engine's arm axes for the canonical T-pose, which its `HUMANOID_REST_FRAME` calibrates per side: flexion about +Y, abduction about +Z, twist about +X, the same vectors on both arms because the rest frame mirrors the sign. Human keeps them for the shoulder girdle and arm so arm motion authored for any humanoid means the same on the person.
 */
const ARM_AXES: IAutoMovieHumanSkeleton.IAxes = {
  flexion: { x: 0, y: 1, z: 0 },
  abduction: { x: 0, y: 0, z: 1 },
  twist: { x: 1, y: 0, z: 0 },
};

/**
 * Place one arm, in the anthropometric posture with the arm hanging.
 *
 * The acromion sits at acromial height, half the biacromial breadth from the midline. The arm hangs straight below it: radiale at acromial height minus acromion-radiale length, stylion a forearm length lower, the middle fingertip a hand length below stylion, so measuring the hanging arm returns the identity's lengths exactly. The shoulder, elbow and wrist centres sit at de Leva's offsets from those landmarks, scaled with the segment. The arm hangs in the coronal plane at the trunk's shoulder depth. The clavicle runs from the sternoclavicular joint beside the jugular notch, on the front of the neck, back and out to the shoulder joint centre; the scapula has no bone, so the shoulder bone carries the acromion. No carrying angle is modelled, for want of a measured source.
 *
 * The skeleton generator then turns the upper arm and everything below it about the shoulder centre into the T-pose; the clavicle and acromion stay, because the canonical rest frame assigns the whole 90 degrees to the upper arm.
 *
 * @param body The body measurements
 * @param side Which arm
 * @param suprasternale The jugular notch
 * @param depth Front-back position of the shoulder and the hanging arm, millimetres
 * @returns Joints from the clavicle to the fingertips, the shoulder centre, and the arm's landmarks
 */
export function placeAutoMovieHumanArm(
  body: IAutoMovieHumanIdentity.IBody,
  side: "left" | "right",
  suprasternale: IAutoMovieVector3,
  depth: number,
): placeAutoMovieHumanArm.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const s: number = side === "left" ? 1 : -1;
  const arm: IAutoMovieHumanIdentity.IArm =
    side === "left" ? body.leftArm : body.rightArm;
  const x: number = (s * body.biacromialBreadth) / 2;
  const acromion: IAutoMovieVector3 = V.of(x, body.acromialHeight, depth);
  const radialeY: number = body.acromialHeight - arm.upperArmLength;
  const radiale: IAutoMovieVector3 = V.of(x, radialeY, depth);
  const stylion: IAutoMovieVector3 = V.of(x, radialeY - arm.forearmLength, depth);
  const shoulder: IAutoMovieVector3 = V.of(
    x,
    body.acromialHeight - JOINT_OFFSET.shoulder * arm.upperArmLength,
    depth,
  );
  const elbow: IAutoMovieVector3 = V.of(
    x,
    radialeY + JOINT_OFFSET.elbow * arm.upperArmLength,
    depth,
  );
  const wrist: IAutoMovieVector3 = V.of(
    x,
    stylion.y - JOINT_OFFSET.wrist * arm.forearmLength,
    depth,
  );
  const clavicale: IAutoMovieVector3 = V.of(
    s * CLAVICALE_PER_BIACROMIAL * body.biacromialBreadth,
    suprasternale.y,
    suprasternale.z,
  );
  const hand: placeAutoMovieHumanHand.IOutput = placeAutoMovieHumanHand(
    arm,
    side,
    wrist,
    stylion,
  );
  // the arm's T-pose axes as they stand before the arm is raised, so the conversion yields them
  const origin: IAutoMovieVector3 = V.of(0, 0, 0);
  const lowered: (d: IAutoMovieVector3) => IAutoMovieVector3 = (
    d: IAutoMovieVector3,
  ): IAutoMovieVector3 => V.rotateZ(d, origin, -s * 90);
  const hangingAxes: IAutoMovieHumanSkeleton.IAxes = {
    flexion: lowered(ARM_AXES.flexion),
    abduction: lowered(ARM_AXES.abduction),
    twist: lowered(ARM_AXES.twist),
  };
  const joint: (
    bone: IAutoMovieHumanSkeleton.IJoint["bone"],
    parent: IAutoMovieHumanSkeleton.IJoint["bone"],
    position: IAutoMovieVector3,
    tail: IAutoMovieVector3,
  ) => IAutoMovieHumanSkeleton.IJoint = (
    bone: IAutoMovieHumanSkeleton.IJoint["bone"],
    parent: IAutoMovieHumanSkeleton.IJoint["bone"],
    position: IAutoMovieVector3,
    tail: IAutoMovieVector3,
  ): IAutoMovieHumanSkeleton.IJoint => ({
    bone,
    parent,
    position,
    tail,
    axes: bone === `${side}Shoulder` ? ARM_AXES : hangingAxes,
    constraint: null,
  });
  return {
    shoulder,
    joints: [
      joint(`${side}Shoulder`, "upperChest", clavicale, shoulder),
      joint(`${side}UpperArm`, `${side}Shoulder`, shoulder, elbow),
      joint(`${side}LowerArm`, `${side}UpperArm`, elbow, wrist),
      joint(`${side}Hand`, `${side}LowerArm`, wrist, hand.knuckle),
      ...hand.joints,
    ],
    landmarks: {
      clavicale: { bone: `${side}Shoulder`, position: clavicale },
      acromion: { bone: `${side}Shoulder`, position: acromion },
      radiale: { bone: `${side}LowerArm`, position: radiale },
      stylion: { bone: `${side}LowerArm`, position: stylion },
      ...hand.landmarks,
    },
  };
}
/** Output type of {@link placeAutoMovieHumanArm}. */
export namespace placeAutoMovieHumanArm {
  /**
   * One placed arm.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Shoulder joint centre, the pivot of the T-pose conversion. */
    shoulder: IAutoMovieVector3;

    /** Clavicle, arm, hand, thumb and fingers, parents first. */
    joints: IAutoMovieHumanSkeleton.IJoint[];

    /** The arm's landmarks. */
    landmarks: Pick<
      IAutoMovieHumanLandmarks.ISide,
      | "clavicale"
      | "acromion"
      | "radiale"
      | "stylion"
      | "dactylion"
      | "metacarpaleII"
      | "metacarpaleV"
      | "middleFingerCrease"
      | "thumbCrease"
      | "thumbTip"
    >;
  }
}
