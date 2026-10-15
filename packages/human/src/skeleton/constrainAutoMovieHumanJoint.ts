import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";

/**
 * AAOS normal ranges as transcribed by Hendriks et al. (2020, Plast Reconstr Surg Glob Open 8(6), Supplementary Digital Content 1), degrees. Shoulder adduction 40 and thumb carpometacarpal abduction 60 were added by those authors, not by AAOS. Grade: conventional (a handbook norm without a stated population).
 */
const AAOS: Record<
  | "shoulderExtension"
  | "shoulderAbduction"
  | "shoulderAdduction"
  | "wristFlexion"
  | "wristExtension"
  | "neckFlexion"
  | "neckExtension"
  | "neckRotation"
  | "neckLateralFlexion"
  | "hipAbduction"
  | "hipAdduction"
  | "toeExtension"
  | "toeFlexion"
  | "fingerMcp"
  | "fingerPip"
  | "fingerDip"
  | "thumbCmcAbduction"
  | "thumbMcp"
  | "thumbIp",
  number
> = {
  shoulderExtension: 60,
  shoulderAbduction: 180,
  shoulderAdduction: 40,
  wristFlexion: 80,
  wristExtension: 70,
  neckFlexion: 45,
  neckExtension: 45,
  neckRotation: 60,
  neckLateralFlexion: 45,
  hipAbduction: 40,
  hipAdduction: 20,
  toeExtension: 70,
  toeFlexion: 45,
  fingerMcp: 80,
  fingerPip: 90,
  fingerDip: 65,
  thumbCmcAbduction: 60,
  thumbMcp: 50,
  thumbIp: 80,
};

/**
 * Passive hip rotation and ankle inversion and eversion of 105 Göteborg men aged 30 to 40 by goniometer (Roaas and Andersson 1982, Acta Orthop Scand 53:205-208), degrees: hip internal 32.6 and external 33.6, inversion 27.7 and eversion 27.6. Grade: measured.
 */
const ROAAS_1982: Record<"hipInternal" | "hipExternal" | "inversion", number> =
  {
    hipInternal: 32.6,
    hipExternal: 33.6,
    inversion: 27.7,
  };

/**
 * Knee flexion where the thigh and calf stop the joint: mean maximum flexion kneeling, 149.4 degrees, falling 1.47 degrees per centimetre of proximal calf girth (McGillivary 2015, MSc thesis, University of Waterloo; 30 young adults, pressure mapping between thigh and calf). The slope is centred on the pooled ANSUR II mean calf girth of 382.8 mm, standing in for the thesis sample's mean, which was not read. Grade: derived.
 */
const KNEE_CONTACT: Record<
  "angle" | "perMillimetre" | "referenceCalf",
  number
> = {
  angle: 149.4,
  perMillimetre: 0.147,
  referenceCalf: 382.8,
};

/**
 * Eye rotation ranges, degrees: the engine's default humanoid eye range, ±30 vertical and ±45 horizontal with no torsion, which matches Human's eye axes. No measured duction norm with absolute angles was read; Schectman et al. (2005, Strabismus 13(1):21-26) report that maximum ductions fall by 21 to 35% from 14-19 to 80-95 years, which a later stage can apply once absolute angles are read. Grade: conventional.
 */
const EYE: Record<"vertical" | "horizontal", number> = {
  vertical: 30,
  horizontal: 45,
};

/**
 * Engine default ranges Human keeps where no source was read, degrees: shoulder rotation ±90 and wrist deviation −30 to 20. Grade: conventional.
 */
const KEPT: Record<
  "shoulderRotation" | "wristDeviation",
  IAutoMovieAngleRange
> = {
  shoulderRotation: { min: -90, max: 90 },
  wristDeviation: { min: -30, max: 20 },
};

/**
 * The range of motion Human declares for one joint of one person, in clinical degrees about the axes the skeleton declares.
 *
 * Ranges come from the person's own mobility measurements where the identity carries them (shoulder flexion, elbow, forearm, hip flexion and extension, knee, ankle, jaw), so age and sex reach them through the converter's CDC norms, and from cited conventions elsewhere. The knee's flexion limit is the smaller of the identity's knee flexion and the angle where this person's calf girth closes the joint, so a heavier calf stops the knee sooner. The jaw turns the identity's mouth opening and laterotrusion, in millimetres at the incisors, into angles about its centre of rotation through this person's own incisor radius. A joint that does not straighten fully keeps its rest pose admissible: extension never starts above zero.
 *
 * Returns null for the bones no source was read for (hips, spine, chest, upper chest, clavicles), which keep the engine's default humanoid range. Every range is clinical on the engine's humanoid convention (`HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`), which Human's declared axes follow: one value means the same motion on either side; wrist and finger flexion carry the fingertips toward the palm, ankle and toe flexion lift the foot and toes, the foot's abduction everts it, and the eyes and the jaw turn sideways about their twist.
 *
 * @param bone The joint's bone
 * @param identity The person
 * @param incisorRadius Distance from the jaw's centre of rotation to the incisal edges, millimetres
 * @returns The constraint, or null to keep the engine's default
 */
export function constrainAutoMovieHumanJoint(
  bone: AutoMovieHumanoidBone,
  identity: IAutoMovieHumanIdentity,
  incisorRadius: number,
): IAutoMovieJointConstraint | null {
  const range: (min: number, max: number) => IAutoMovieAngleRange = (
    min: number,
    max: number,
  ): IAutoMovieAngleRange => ({ min, max });
  const hinge: (
    extension: number,
    flexion: number,
  ) => IAutoMovieJointConstraint = (
    extension: number,
    flexion: number,
  ): IAutoMovieJointConstraint => ({
    flexion: range(Math.min(0, -extension), flexion),
    abduction: null,
    twist: null,
  });
  const negate: (value: number) => number = (value: number): number => -value;
  const degrees: (radians: number) => number = (radians: number): number =>
    (radians * 180) / Math.PI;
  const left: boolean = bone.startsWith("left");
  const arm: IAutoMovieHumanIdentity.IArm = left
    ? identity.body.leftArm
    : identity.body.rightArm;
  const leg: IAutoMovieHumanIdentity.ILeg = left
    ? identity.body.leftLeg
    : identity.body.rightLeg;
  const part: string = bone.replace(/^(left|right)/, "");

  if (bone === "neck" || bone === "head")
    // the AAOS cervical ranges, split equally between the two bones that share them
    return {
      flexion: range(-AAOS.neckExtension / 2, AAOS.neckFlexion / 2),
      abduction: range(
        -AAOS.neckLateralFlexion / 2,
        AAOS.neckLateralFlexion / 2,
      ),
      twist: range(-AAOS.neckRotation / 2, AAOS.neckRotation / 2),
    };
  if (bone === "jaw") {
    const opening: number = degrees(
      2 *
        Math.asin(
          Math.min(1, identity.head.mouthOpening / (2 * incisorRadius)),
        ),
    );
    const lateral: number = degrees(
      Math.asin(
        Math.min(1, identity.head.mandibularLaterotrusion / incisorRadius),
      ),
    );
    return {
      flexion: range(0, opening),
      abduction: null,
      twist: range(-lateral, lateral),
    };
  }
  if (part === "Eye")
    return {
      flexion: range(-EYE.vertical, EYE.vertical),
      abduction: null,
      twist: range(-EYE.horizontal, EYE.horizontal),
    };
  switch (part) {
    case "UpperArm":
      return {
        flexion: range(-AAOS.shoulderExtension, arm.shoulderFlexion),
        abduction: range(-AAOS.shoulderAdduction, AAOS.shoulderAbduction),
        twist: KEPT.shoulderRotation,
      };
    case "LowerArm":
      return {
        flexion: range(
          Math.min(0, negate(arm.elbowHyperextension)),
          arm.elbowFlexion,
        ),
        abduction: null,
        // positive twist about the T-pose arm's +X pronates either forearm, the engine's arm basis, so supination is negative
        twist: range(negate(arm.forearmSupination), arm.forearmPronation),
      };
    case "Hand":
      return {
        flexion: range(-AAOS.wristExtension, AAOS.wristFlexion),
        abduction: KEPT.wristDeviation,
        twist: null,
      };
    case "UpperLeg":
      return {
        flexion: range(negate(leg.hipExtension), leg.hipFlexion),
        abduction: range(-AAOS.hipAdduction, AAOS.hipAbduction),
        twist: range(-ROAAS_1982.hipInternal, ROAAS_1982.hipExternal),
      };
    case "LowerLeg":
      return hinge(
        leg.kneeHyperextension,
        Math.min(
          leg.kneeFlexion,
          KNEE_CONTACT.angle -
            KNEE_CONTACT.perMillimetre *
              (leg.calfCircumference - KNEE_CONTACT.referenceCalf),
        ),
      );
    case "Foot":
      return {
        flexion: range(negate(leg.anklePlantarFlexion), leg.ankleDorsiflexion),
        abduction: range(-ROAAS_1982.inversion, ROAAS_1982.inversion),
        twist: null,
      };
    case "Toes":
      // positive toe flexion lifts the toes (dorsiflexion, the engine's sense), so the anatomical curl is negative
      return {
        flexion: range(-AAOS.toeFlexion, AAOS.toeExtension),
        abduction: null,
        twist: null,
      };
    case "ThumbMetacarpal":
      // the rest thumb already spreads 40 degrees of the 60 the carpometacarpal joint abducts
      return {
        flexion: null,
        abduction: range(-40, AAOS.thumbCmcAbduction - 40),
        twist: null,
      };
    case "ThumbProximal":
      return hinge(0, AAOS.thumbMcp);
    case "ThumbDistal":
      return hinge(0, AAOS.thumbIp);
  }
  if (part.endsWith("Proximal")) return hinge(0, AAOS.fingerMcp);
  if (part.endsWith("Intermediate")) return hinge(0, AAOS.fingerPip);
  if (part.endsWith("Distal")) return hinge(0, AAOS.fingerDip);
  return null;
}
