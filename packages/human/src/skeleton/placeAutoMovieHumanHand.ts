import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * The middle finger from its metacarpophalangeal joint over the same finger from the crease at its base, the length palm length leaves of hand length. De Leva's hand puts the third metacarpophalangeal joint 0.459 of the way from the wrist joint centre to the middle fingertip, 78.0 of 170.1 mm in women and 86.2 of 187.9 mm in men (de Leva 1996, J Biomech 29(9):1223-1230, Table 4), so 0.541 of that reach lies beyond the joint; at the ANSUR II mean hands (hand length 181.1 and 193.3 mm, palm length 108.7 and 116.5 mm; Gordon et al. 2014, NATICK/TR-15/007) the crease leaves 72.4 and 76.8 mm, and the ratio is 1.343 and 1.350. The palmar web reaches the middle of the proximal phalanges (Gray 1918), which is why the crease lies well beyond the joint. Grade: derived across two samples.
 */
const FINGER_PER_CREASE: number = 1.347;

/**
 * Metacarpal lengths over the third, and the third over the distance from the wrist joint centre to its head. Total metacarpal lengths on CT of 50 men and 50 women (Reddy et al. 2024, Indian J Plast Surg 57(4):270-277, Table 4): first 47.5 and 42.8 mm, second 68.8 and 63.1, third 66.6 and 60.4, fourth 59.2 and 52.9, fifth 52.8 and 48.4, men and women; sexes pooled as ratios. The third, 66.6 and 60.4 mm, is 0.773 and 0.774 of de Leva's wrist-centre-to-third-metacarpale distance (86.2 and 78.0 mm), the rest being the carpus. Grade: measured, ratios derived; held at every age, since no child metacarpal series was read.
 */
const METACARPAL: Record<IFinger | "Thumb", number> & { thirdShare: number } = {
  Thumb: 0.711,
  Index: 1.039,
  Middle: 1,
  Ring: 0.883,
  Little: 0.797,
  thirdShare: 0.774,
};

/**
 * Finger lengths beyond the metacarpophalangeal joint relative to the middle finger, from lengths measured from the crease at each finger's base. Index: 0.392 and 0.435 of hand length in boys and 0.399 and 0.439 in girls at 16 to 18 years, so 0.905, and 0.907 to 0.918 at 2 to 4 years (Snyder et al. 1977, UM-HSRI-77-17). Little: 0.74 to 0.75 of the middle finger in every age group from 2 to 13 years, boys and girls (Snyder et al. 1975, UM-HSRI-BI-75-5, little and middle finger length tables), so 0.745. Ring: no measured source was read; 0.95 is conventional. The ratios assume each crease sits alike over its joint. Grade: derived for index and little, conventional for ring.
 */
const FINGER_LENGTH: Record<IFinger, number> = {
  Index: 0.905,
  Middle: 1,
  Ring: 0.95,
  Little: 0.745,
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
 * Thumb placement at rest. The carpometacarpal joint of the thumb sits on the trapezium in the distal carpal row, level with the bases of the other metacarpals, on the radial and palmar side of the hand: its metacarpal is never flat with the palm (Bridgman 1920). The thumb points out from the index line by its radial spread and from the palm plane by its palmar spread. Grade: conventional.
 */
const THUMB: Record<"baseRadial" | "basePalmar" | "radialSpread" | "palmarSpread", number> = {
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
 * The hand hangs from the wrist: distal is down, the palm faces the thigh and the thumb points forward. The middle fingertip lands at stylion minus hand length. The middle finger reaches back from it to its metacarpophalangeal joint by the length palm length leaves, lengthened from the crease to the joint, so a child's shorter fingers, which the identity's own palm length carries, give a child's hand rather than a scaled adult's. The metacarpal bases lie level across the distal carpal row, and each metacarpal head sits its measured metacarpal length beyond its base: the knuckles form an arc, the index and middle nearly level and the ring and little stepping back, and the thumb's carpometacarpal joint sits beside them at the base level. Every finger is straight, the rest pose of the T-pose rig, with its joints spaced 2:1:1. The thumb's metacarpal has its measured length and its two phalanges the identity's thumb length, split equally.
 *
 * Each finger joint declares its own axes from the hand frame: flexion turns the finger toward the palm (axis = distal × palmar), abduction turns it away from the middle finger in the palm plane (the middle finger toward the thumb), twist runs along it. The thumb's flexion turns it toward the ulnar side of the palm across its pad, abduction moves it away from the palm. The three are mutually perpendicular, as `IAutoMovieBone.axes` requires; the T-pose conversion turns them with the arm.
 *
 * @param arm The arm's measurements
 * @param side Which hand
 * @param wrist Wrist joint centre, hanging posture
 * @param stylion Radial styloid tip, hanging posture
 * @returns Finger and thumb joints, the middle knuckle, and the hand's landmarks
 */
export function placeAutoMovieHumanHand(
  arm: IAutoMovieHumanIdentity.IArm,
  side: "left" | "right",
  wrist: IAutoMovieVector3,
  stylion: IAutoMovieVector3,
): placeAutoMovieHumanHand.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const s: number = side === "left" ? 1 : -1;
  const origin: IAutoMovieVector3 = V.of(0, 0, 0);
  const distal: IAutoMovieVector3 = V.of(0, -1, 0);
  const palmar: IAutoMovieVector3 = V.of(-s, 0, 0);
  const radial: IAutoMovieVector3 = V.of(0, 0, 1);
  const breadth: number = arm.handBreadth;
  const dactylion: IAutoMovieVector3 = V.offset(stylion, [distal, arm.handLength]);
  const reach: number = wrist.y - dactylion.y;
  const middleFinger: number = FINGER_PER_CREASE * (arm.handLength - arm.palmLength);
  const middleKnuckle: number = reach - middleFinger;
  const third: number = METACARPAL.thirdShare * middleKnuckle;
  const baseAlong: number = middleKnuckle - third;

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

  // thumb
  const radians: (degrees: number) => number = (degrees: number): number =>
    (degrees * Math.PI) / 180;
  const along: IAutoMovieVector3 = V.normalize(
    V.offset(
      origin,
      [distal, Math.cos(radians(THUMB.radialSpread)) * Math.cos(radians(THUMB.palmarSpread))],
      [radial, Math.sin(radians(THUMB.radialSpread)) * Math.cos(radians(THUMB.palmarSpread))],
      [palmar, Math.sin(radians(THUMB.palmarSpread))],
    ),
  );
  const pad0: IAutoMovieVector3 = V.offset(origin, [palmar, 1], [radial, -1]);
  const pad: IAutoMovieVector3 = V.normalize(
    V.offset(pad0, [along, -V.dot(pad0, along)]),
  );
  const thumbBase: IAutoMovieVector3 = V.offset(
    wrist,
    [distal, baseAlong],
    [radial, THUMB.baseRadial * breadth],
    [palmar, THUMB.basePalmar * breadth],
  );
  const thumbKnuckle: IAutoMovieVector3 = V.offset(thumbBase, [
    along,
    METACARPAL.Thumb * third,
  ]);
  const thumbTip: IAutoMovieVector3 = V.offset(thumbKnuckle, [along, arm.thumbLength]);
  chain(
    [`${side}ThumbMetacarpal`, `${side}ThumbProximal`, `${side}ThumbDistal`],
    [
      thumbBase,
      thumbKnuckle,
      V.offset(thumbKnuckle, [along, arm.thumbLength / 2]),
      thumbTip,
    ],
    {
      flexion: V.cross(along, pad),
      // about the pad's own direction, signed so a positive turn carries the tip palmar, out of the palm's plane
      abduction: V.dot(V.cross(pad, along), palmar) >= 0 ? pad : V.offset(origin, [pad, -1]),
      twist: along,
    },
  );

  // fingers: metacarpal heads in an arc from bases level across the carpus
  const knuckles: Record<IFinger, IAutoMovieVector3> = {} as Record<
    IFinger,
    IAutoMovieVector3
  >;
  for (const finger of ["Index", "Middle", "Ring", "Little"] as const) {
    const knuckle: IAutoMovieVector3 = V.offset(
      wrist,
      [distal, baseAlong + METACARPAL[finger] * third],
      [radial, KNUCKLE_SPREAD[finger] * breadth],
    );
    knuckles[finger] = knuckle;
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

  // metacarpal heads at the breadth's edges, level with the mean of the second and fifth heads
  const edgeAlong: number =
    baseAlong + ((METACARPAL.Index + METACARPAL.Little) / 2) * third;
  const edgeCentre: number = -breadth / 8;
  const mark: (
    bone: AutoMovieHumanoidBone,
    position: IAutoMovieVector3,
  ) => IAutoMovieHumanLandmarks.ILandmark = (
    bone: AutoMovieHumanoidBone,
    position: IAutoMovieVector3,
  ): IAutoMovieHumanLandmarks.ILandmark => ({ bone, position });
  return {
    knuckle: knuckles.Middle,
    joints,
    landmarks: {
      dactylion: mark(`${side}MiddleDistal`, dactylion),
      metacarpaleII: mark(
        `${side}Hand`,
        V.offset(wrist, [distal, edgeAlong], [radial, edgeCentre + breadth / 2]),
      ),
      metacarpaleV: mark(
        `${side}Hand`,
        V.offset(wrist, [distal, edgeAlong], [radial, edgeCentre - breadth / 2]),
      ),
      middleFingerCrease: mark(
        `${side}MiddleProximal`,
        V.offset(dactylion, [distal, -(arm.handLength - arm.palmLength)]),
      ),
      thumbCrease: mark(`${side}ThumbProximal`, thumbKnuckle),
      thumbTip: mark(`${side}ThumbDistal`, thumbTip),
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
      | "dactylion"
      | "metacarpaleII"
      | "metacarpaleV"
      | "middleFingerCrease"
      | "thumbCrease"
      | "thumbTip"
    >;
  }
}
