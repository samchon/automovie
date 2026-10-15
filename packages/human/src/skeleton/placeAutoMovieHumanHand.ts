import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Third metacarpophalangeal joint from the wrist joint centre as a fraction of the wrist-centre-to-fingertip length: de Leva's hand lengths to the third metacarpale and to the third dactylion, 78.0 and 170.1 mm in women and 86.2 and 187.9 mm in men, both 0.459 (de Leva 1996, J Biomech 29(9):1223-1230, Table 4). Grade: measured, derived.
 */
const MIDDLE_KNUCKLE: number = 0.459;

/**
 * Finger lengths from the metacarpophalangeal joint relative to the middle finger. Index: the 1977 US child survey's index and middle finger lengths from the crease at the finger base, 0.392 and 0.435 of hand length in boys and 0.399 and 0.439 in girls at 16 to 18 years (Snyder et al. 1977, UM-HSRI-77-17), so 0.905; measured from the crease rather than the joint, so the ratio assumes the crease sits alike on both fingers. Ring and little: no measured source was read; 0.95 and 0.80 are conventional. Grade: derived for the index, conventional for the others.
 */
const FINGER_LENGTH: Record<IFinger, number> = {
  Index: 0.905,
  Middle: 1,
  Ring: 0.95,
  Little: 0.8,
};

/**
 * Knuckle distance from the wrist relative to the middle knuckle, the knuckles forming an arch around the base of the thumb with the third the highest (Bridgman 1920, "Constructive Anatomy"). Grade: conventional.
 */
const KNUCKLE_ARCH: Record<IFinger, number> = {
  Index: 0.97,
  Middle: 1,
  Ring: 0.97,
  Little: 0.9,
};

/**
 * Knuckle positions across the hand toward the thumb, in hand breadths from the middle knuckle: four metacarpal heads of equal width spanning the breadth from the radial side of the second to the ulnar side of the fifth (the US Army hand breadth definition, Greiner 1991, as quoted by Rogers et al. 2008, Ergonomics 51(4):511-526). Grade: derived from the definition.
 */
const KNUCKLE_SPREAD: Record<IFinger, number> = {
  Index: 0.25,
  Middle: 0,
  Ring: -0.25,
  Little: -0.5,
};

/**
 * Phalanx joints along a finger as fractions of its length from the metacarpophalangeal joint: the palmar pads between the creases are of equal length and the crease at the finger base lies midway between the basal and middle joints (Bridgman 1920), so the proximal phalanx spans two pads and the middle and distal one each, 2:1:1. Grade: conventional (an artist's anatomy), checked against nothing measured.
 */
const PHALANGES: [number, number] = [0.5, 0.75];

/**
 * Thumb length from its metacarpophalangeal joint, as a fraction of hand length: the 1977 survey's thumb length from its basal crease, 0.356 (boys) and 0.359 (girls) of hand length at 16 to 18 years, the crease lying over the joint. Its two phalanges split it equally by the same equal-pad rule. Grade: measured, derived.
 */
const THUMB_LENGTH: number = 0.358;

/**
 * Thumb placement at rest. The carpometacarpal joint sits beside the wrist on the radial and palmar side; the thumb points out from the index line by its radial spread and from the palm plane by its palmar spread. Its metacarpal length is solved so that the adducted thumb's tip reaches the middle joint of the index finger, as Gray (1918) and Bridgman state. Grade: conventional placement, derived length.
 */
const THUMB: Record<
  "baseAlong" | "baseRadial" | "basePalmar" | "radialSpread" | "palmarSpread",
  number
> = {
  /** Carpometacarpal joint distal to the wrist centre, of the wrist-to-fingertip length. */
  baseAlong: 0.12,
  /** Carpometacarpal joint toward the thumb, of hand breadth. */
  baseRadial: 0.3,
  /** Carpometacarpal joint palmar to the hand's plane, of hand breadth. */
  basePalmar: 0.15,
  /** Angle from the index line in the palm plane, degrees. */
  radialSpread: 40,
  /** Angle out of the palm plane, degrees. */
  palmarSpread: 20,
};

/** The four fingers, by their VRM bone name stem. */
type IFinger = "Index" | "Middle" | "Ring" | "Little";

/**
 * Place one hand, in the anthropometric posture, from the wrist joint centre.
 *
 * The hand hangs from the wrist: distal is down, the palm faces the thigh and the thumb points forward. Wrist-to-fingertip length is the hand length less the wrist centre's offset below stylion, so the middle fingertip lands at stylion minus hand length. Every finger is straight, the rest pose of the T-pose rig, with its joints spaced 2:1:1. The thumb chain leaves the carpometacarpal joint at its rest spread.
 *
 * Each finger joint declares its own axes from the hand frame: flexion turns the finger toward the palm (axis = distal × palmar), abduction turns it away from the middle finger in the palm plane (the middle finger toward the thumb), twist runs along it. The thumb's flexion turns it toward the ulnar side of the palm across its pad, abduction moves it away from the palm. The three are mutually perpendicular, as `IAutoMovieBone.axes` requires; the T-pose conversion turns them with the arm.
 *
 * @param arm The arm's measurements
 * @param side Which hand
 * @param wrist Wrist joint centre, hanging posture
 * @param stylion Radial styloid tip, hanging posture
 * @returns Finger and thumb joints, and the hand's landmarks
 */
export function placeAutoMovieHumanHand(
  arm: IAutoMovieHumanIdentity.IArm,
  side: "left" | "right",
  wrist: IAutoMovieVector3,
  stylion: IAutoMovieVector3,
): placeAutoMovieHumanHand.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const s: number = side === "left" ? 1 : -1;
  const distal: IAutoMovieVector3 = V.of(0, -1, 0);
  const palmar: IAutoMovieVector3 = V.of(-s, 0, 0);
  const radial: IAutoMovieVector3 = V.of(0, 0, 1);
  const breadth: number = arm.handBreadth;
  const dactylion: IAutoMovieVector3 = V.offset(stylion, [distal, arm.handLength]);
  const reach: number = wrist.y - dactylion.y;
  const middleKnuckle: number = MIDDLE_KNUCKLE * reach;
  const middleFinger: number = reach - middleKnuckle;

  const joints: IAutoMovieHumanSkeleton.IJoint[] = [];
  const chain: (
    bones: AutoMovieHumanoidBone[],
    points: IAutoMovieVector3[],
    axes: IAutoMovieHumanSkeleton.IAxes,
  ) => void = (
    bones: AutoMovieHumanoidBone[],
    points: IAutoMovieVector3[],
    axes: IAutoMovieHumanSkeleton.IAxes,
  ): void => {
    bones.forEach((bone: AutoMovieHumanoidBone, i: number): void => {
      joints.push({
        bone,
        parent: i === 0 ? `${side}Hand` : bones[i - 1]!,
        position: points[i]!,
        tail: points[i + 1]!,
        axes,
        constraint: null,
      });
    });
  };

  // thumb: metacarpal length solved so the adducted tip reaches the index middle joint
  const indexMiddleJoint: number =
    KNUCKLE_ARCH.Index * middleKnuckle +
    PHALANGES[0] * FINGER_LENGTH.Index * middleFinger;
  const thumbBaseAlong: number = THUMB.baseAlong * reach;
  const thumbLength: number = THUMB_LENGTH * arm.handLength;
  const thumbMetacarpal: number = indexMiddleJoint - thumbBaseAlong - thumbLength;
  const radians: (degrees: number) => number = (degrees: number): number =>
    (degrees * Math.PI) / 180;
  const along: IAutoMovieVector3 = V.normalize(
    V.offset(
      V.of(0, 0, 0),
      [distal, Math.cos(radians(THUMB.radialSpread)) * Math.cos(radians(THUMB.palmarSpread))],
      [radial, Math.sin(radians(THUMB.radialSpread)) * Math.cos(radians(THUMB.palmarSpread))],
      [palmar, Math.sin(radians(THUMB.palmarSpread))],
    ),
  );
  const pad0: IAutoMovieVector3 = V.offset(V.of(0, 0, 0), [palmar, 1], [radial, -1]);
  const pad: IAutoMovieVector3 = V.normalize(
    V.offset(pad0, [along, -V.dot(pad0, along)]),
  );
  const thumbBase: IAutoMovieVector3 = V.offset(
    wrist,
    [distal, thumbBaseAlong],
    [radial, THUMB.baseRadial * breadth],
    [palmar, THUMB.basePalmar * breadth],
  );
  const thumbKnuckle: IAutoMovieVector3 = V.offset(thumbBase, [along, thumbMetacarpal]);
  chain(
    [`${side}ThumbMetacarpal`, `${side}ThumbProximal`, `${side}ThumbDistal`],
    [
      thumbBase,
      thumbKnuckle,
      V.offset(thumbKnuckle, [along, thumbLength / 2]),
      V.offset(thumbKnuckle, [along, thumbLength]),
    ],
    {
      flexion: V.cross(along, pad),
      // about the pad's own direction, signed so a positive turn carries the tip palmar, out of the palm's plane
      abduction:
        V.dot(V.cross(pad, along), palmar) >= 0 ? pad : V.offset(V.of(0, 0, 0), [pad, -1]),
      twist: along,
    },
  );

  // fingers
  let middle: IAutoMovieVector3 = wrist;
  for (const finger of ["Index", "Middle", "Ring", "Little"] as const) {
    const knuckle: IAutoMovieVector3 = V.offset(
      wrist,
      [distal, KNUCKLE_ARCH[finger] * middleKnuckle],
      [radial, KNUCKLE_SPREAD[finger] * breadth],
    );
    if (finger === "Middle") middle = knuckle;
    const length: number = FINGER_LENGTH[finger] * middleFinger;
    const awayFromMiddle: IAutoMovieVector3 =
      finger === "Ring" || finger === "Little" ? V.of(0, 0, -1) : radial;
    chain(
      [
        `${side}${finger}Proximal`,
        `${side}${finger}Intermediate`,
        `${side}${finger}Distal`,
      ],
      [
        knuckle,
        V.offset(knuckle, [distal, PHALANGES[0] * length]),
        V.offset(knuckle, [distal, PHALANGES[1] * length]),
        V.offset(knuckle, [distal, length]),
      ],
      {
        flexion: V.cross(distal, palmar),
        abduction: V.cross(distal, awayFromMiddle),
        twist: distal,
      },
    );
  }

  // metacarpal heads at the breadth's edges, level with the mean knuckle
  const edgeAlong: number = 0.95 * middleKnuckle;
  const edgeCentre: number = -breadth / 8;
  const mark: (position: IAutoMovieVector3) => IAutoMovieHumanLandmarks.ILandmark = (
    position: IAutoMovieVector3,
  ): IAutoMovieHumanLandmarks.ILandmark => ({ bone: `${side}Hand`, position });
  return {
    knuckle: middle,
    joints,
    landmarks: {
      dactylion: { bone: `${side}MiddleDistal`, position: dactylion },
      metacarpaleII: mark(
        V.offset(wrist, [distal, edgeAlong], [radial, edgeCentre + breadth / 2]),
      ),
      metacarpaleV: mark(
        V.offset(wrist, [distal, edgeAlong], [radial, edgeCentre - breadth / 2]),
      ),
    },
  };
}
/** Output type of {@link placeAutoMovieHumanHand}. */
export namespace placeAutoMovieHumanHand {
  /**
   * One placed hand.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Third metacarpophalangeal joint, the hand bone's tail. */
    knuckle: IAutoMovieVector3;

    /** Thumb and finger joints, parents first. */
    joints: IAutoMovieHumanSkeleton.IJoint[];

    /** The hand's landmarks. */
    landmarks: Pick<
      IAutoMovieHumanLandmarks.ISide,
      "dactylion" | "metacarpaleII" | "metacarpaleV"
    >;
  }
}
