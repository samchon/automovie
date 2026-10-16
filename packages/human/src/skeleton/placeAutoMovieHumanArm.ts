import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";
import { placeAutoMovieHumanHand } from "./placeAutoMovieHumanHand";
import { tiltAutoMovieHumanForearmAxes } from "./tiltAutoMovieHumanForearmAxes";

/**
 * Joint centres from their landmarks along the hanging arm, fractions of the segment the offset was measured on: shoulder centre below the acromion (33.7 mm women, 34.5 mm men) and elbow centre above radiale (13.9 and 14.3 mm), both from acromion-radiale, over its pooled ANSUR II mean of 323.2 mm; wrist centre below stylion (1.5 mm) over the pooled radiale-stylion mean of 254.6 mm (de Leva 1996, J Biomech 29(9):1223-1230, Table 2; Gordon et al. 2014, NATICK/TR-15/007). Grade: derived.
 */
const JOINT_OFFSET: Record<"shoulder" | "elbow" | "wrist", number> = {
  shoulder: 0.1055,
  elbow: 0.0436,
  wrist: 0.0059,
};

/**
 * Shoulder joint centre medial of the acromion's lateral edge, as a fraction of biacromial breadth. On BodyParts3D's adult male (Mitsuhashi et al. 2009, Nucleic Acids Res 37:D782-D785; one man, TARO MRI, arms hanging) a sphere fitted to the humeral head's articular surface centres 3 to 9 mm (6 mm mean over both sides and the fit's choices) medial of the most lateral point of the acromion, against a bony biacromial breadth of 333 mm: our measurement. Radiographs agree that the acromion overhangs the humeral head only partly: the glenoid plane to the acromion's lateral border is 0.64 of the glenoid plane to the humeral head's lateral edge in 70 normal shoulders (Nyffeler et al. 2006, J Bone Joint Surg Am 88(4):800-805), and the head's centre lies about midway along that line. Grade: measured on one anatomy, corroborated.
 */
const SHOULDER_MEDIAL_PER_BIACROMIAL: number = 0.018;

/**
 * Sternoclavicular joint from the midline as a fraction of biacromial breadth. No measured source was read. Grade: conventional.
 */
const CLAVICALE_PER_BIACROMIAL: number = 0.06;

/**
 * Retraction of the clavicle at rest, arms hanging, degrees: the angle between the clavicle and the trunk's frontal plane seen from above, 19.2 (SD 2) in relaxed standing on bone-pin tracking of twelve healthy adults (Ludewig et al. 2009, J Bone Joint Surg Am 91(2):378-389, Table I). The acromion and the hanging arm therefore stand behind the sternoclavicular joint by the clavicle's lateral run times its tangent. Grade: measured.
 */
const CLAVICLE_RETRACTION: number = 19.2;

/**
 * The engine's arm axes for the canonical T-pose, which its `HUMANOID_REST_FRAME` calibrates per side: flexion about +Y, abduction about +Z, twist about +X, the same vectors on both arms because the rest frame mirrors the sign. Human keeps them for the shoulder girdle and arm so arm motion authored for any humanoid means the same on the person.
 */
const ARM_AXES: IAutoMovieHumanSkeleton.IAxes = {
  flexion: { x: 0, y: 1, z: 0 },
  abduction: { x: 0, y: 0, z: 1 },
  twist: { x: 1, y: 0, z: 0 },
};

/**
 * The engine's hand basis for the canonical T-pose (`HUMANOID_JOINT_AXES`): flexion about +Z carries the fingertips toward the −Y palm, abduction about +Y toward the thumb, twist about +X; `HUMANOID_REST_FRAME` reverses the left hand's flexion and abduction.
 */
const HAND_AXES: IAutoMovieHumanSkeleton.IAxes = {
  flexion: { x: 0, y: 0, z: 1 },
  abduction: { x: 0, y: 1, z: 0 },
  twist: { x: 1, y: 0, z: 0 },
};

/**
 * Place one arm, in the anthropometric posture with the arm hanging.
 *
 * The acromion sits at acromial height, half the biacromial breadth from the midline. The shoulder joint centre, the humeral head's, lies a little medial of the acromion's lateral edge ({@link SHOULDER_MEDIAL_PER_BIACROMIAL}) and de Leva's offset below it, and the arm hangs straight below that centre: radiale the acromion-radiale length from the acromion, stylion a forearm length lower, the middle fingertip a hand length below stylion, so measuring the hanging arm returns the identity's lengths exactly. The elbow and wrist centres sit at de Leva's offsets from those landmarks, scaled with the segment. The clavicle runs from the sternoclavicular joint beside the jugular notch, on the front of the neck, out to the acromion and back by its resting retraction ({@link CLAVICLE_RETRACTION}), and the arm hangs in the coronal plane at the acromion's depth; the clavicle bone ends at the shoulder joint centre; the scapula has no bone, so the shoulder bone carries the acromion.
 *
 * The forearm hangs straight on the arm, so the canonical T-pose rest has it straight and horizontal with the palm down, as every humanoid's does, and a pose retargeted from another humanoid lands the same. The identity's carrying angle, measured with the forearm supinated, lives in the forearm's declared axes instead ({@link tiltAutoMovieHumanForearmAxes}): supinating the forearm into the anatomical position, palm forward, opens the angle, and pronating it back closes it, as the oblique pronation-supination axis of the radius does.
 *
 * The skeleton generator then raises the arm into the T-pose (`abductAutoMovieHumanArms`): the girdle carries the acromion and the shoulder centre together, and the upper arm and everything below it turn about the moved shoulder centre.
 *
 * @param body The body measurements
 * @param side Which arm
 * @param suprasternale The jugular notch
 * @returns Joints from the clavicle to the fingertips, the shoulder centre, and the arm's landmarks
 */
export function placeAutoMovieHumanArm(
  body: IAutoMovieHumanIdentity.IBody,
  side: "left" | "right",
  suprasternale: IAutoMovieVector3,
): placeAutoMovieHumanArm.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const s: number = side === "left" ? 1 : -1;
  const arm: IAutoMovieHumanIdentity.IArm =
    side === "left" ? body.leftArm : body.rightArm;
  // the clavicle runs back from the sternoclavicular joint at its resting retraction
  const depth: number =
    suprasternale.z -
    (0.5 - CLAVICALE_PER_BIACROMIAL) *
      body.biacromialBreadth *
      Math.tan((CLAVICLE_RETRACTION * Math.PI) / 180);
  const acromion: IAutoMovieVector3 = V.of(
    (s * body.biacromialBreadth) / 2,
    body.acromialHeight,
    depth,
  );
  // the arm hangs below the humeral head, a little medial of the acromion's lateral edge
  const x: number =
    s * (0.5 - SHOULDER_MEDIAL_PER_BIACROMIAL) * body.biacromialBreadth;
  // acromion-radiale is a straight length, so radiale drops the length's vertical share below the acromion
  const radialeY: number =
    body.acromialHeight -
    Math.sqrt(
      arm.upperArmLength ** 2 - (acromion.x - x) ** 2,
    );
  const radiale: IAutoMovieVector3 = V.of(x, radialeY, depth);
  const stylion: IAutoMovieVector3 = V.of(
    x,
    radialeY - arm.forearmLength,
    depth,
  );
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
  // the forearm carries the carrying angle in its axes, so supination opens it from a straight rest
  const tilted: IAutoMovieHumanSkeleton.IAxes = tiltAutoMovieHumanForearmAxes(
    ARM_AXES,
    side,
    arm.carryingAngle,
  );
  const forearmAxes: IAutoMovieHumanSkeleton.IAxes = {
    flexion: lowered(tilted.flexion),
    abduction: lowered(tilted.abduction),
    twist: lowered(tilted.twist),
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
      {
        ...joint(`${side}LowerArm`, `${side}UpperArm`, elbow, wrist),
        axes: forearmAxes,
      },
      {
        ...joint(`${side}Hand`, `${side}LowerArm`, wrist, hand.knuckle),
        axes: {
          flexion: lowered(HAND_AXES.flexion),
          abduction: lowered(HAND_AXES.abduction),
          twist: lowered(HAND_AXES.twist),
        },
      },
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
