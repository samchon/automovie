import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Hip and knee joint centres above their landmarks as fractions of thigh length (trochanterion to tibiale): de Leva's offsets (hip 2.8 mm women, 3.2 mm men above trochanterion; knee 29.4 and 33.5 mm above tibiale; de Leva 1996, J Biomech 29(9):1223-1230, Table 2) over the pooled ANSUR II mean thigh length of 420.2 mm (Gordon et al. 2014, NATICK/TR-15/007). Scaling the offsets with the segment carries them to children by geometric similarity of the joint, an inference no child data checks. Grade: derived.
 */
const ABOVE_LANDMARK: Record<"hip" | "knee" | "patella", number> = {
  hip: 0.0071,
  knee: 0.0748,
  /** Midpatella above tibiale: ANSUR II mean midpatella minus tibiale height, 11.2 mm women and 20.2 mm men, over the same thigh length. Grade: derived. */
  patella: 0.0374,
};

/**
 * Hip joint centre in the pelvis from leg length LL (anterior superior iliac spine to medial malleolus), millimetres, from CT of 157 people aged 5 to 40 of both sexes, one equation for both (Hara et al. 2016, Sci Rep 6:37707): the centre lies 11 − 0.063 LL anterior (negative: posterior), 8 + 0.086 LL lateral and −9 − 0.078 LL superior (negative: inferior) to the midpoint of the anterior superior iliac spines. Younger and older ages are an extrapolation of the published fit. Grade: measured, population-fitted.
 */
const HARA_2016: Record<"anterior" | "lateral" | "superior", [number, number]> = {
  anterior: [11, -0.063],
  lateral: [8, 0.086],
  superior: [-9, -0.078],
};

/**
 * Anterior superior iliac spine from the midline as a fraction of bicristal breadth: Hara's inter-spine relation (hip centre lateral = 10 + 0.329 × inter-spine distance) inverted at the ANSUR II mean leg lengths gives 219 mm (women) and 232 mm (men) between the spines, 0.80 and 0.84 of the mean bicristal breadths, so each spine sits 0.41 of the crest breadth from the midline. Grade: derived.
 */
const ILIOSPINALE_PER_BICRISTAL: number = 0.41;

/**
 * Half the ankle's bimalleolar breadth as a fraction of foot length: ANSUR II bimalleolar breadth over foot length is 0.272 (women) and 0.276 (men), so each malleolus lies 0.136 foot lengths from the ankle centre. Grade: derived.
 */
const MALLEOLUS_HALF_BREADTH: number = 0.136;

/**
 * First metatarsophalangeal joint from the heel as a fraction of foot length: ANSUR II ball-of-foot length over foot length is 0.739 (women) and 0.741 (men). Grade: measured.
 */
const BALL_OF_FOOT: number = 0.74;

/**
 * Placements no source read measures, fractions of the named length. Grade: conventional, each a check on renders.
 */
const CONVENTIONAL: Record<
  | "heelBehindAnkle"
  | "footJointHeight"
  | "toeTipHeight"
  | "trochanterOfHipBreadth"
  | "tibialeMedial"
  | "patellaAnterior"
  | "sphyrionHeight"
  | "sphyrionAnterior",
  number
> = {
  /** Heel behind the ankle centre, of foot length. */
  heelBehindAnkle: 0.22,
  /** Height of the heel point and the metatarsal heads, of ankle height. */
  footJointHeight: 0.35,
  /** Height of the toe tip, of ankle height. */
  toeTipHeight: 0.15,
  /** Trochanterion from the midline, of half the soft-tissue hip breadth. */
  trochanterOfHipBreadth: 0.9,
  /** Tibiale medial to the knee centre, of thigh length. */
  tibialeMedial: 0.09,
  /** Patella in front of the knee centre, of thigh length. */
  patellaAnterior: 0.11,
  /** Medial malleolus tip above the lateral, of ankle height; Gray (1918) states only that it is higher and further forward. */
  sphyrionHeight: 1.2,
  /** Medial malleolus in front of the lateral, of foot length. */
  sphyrionAnterior: 0.04,
};

/**
 * Place one leg in the rest pose, which for the leg is the anthropometric standing posture.
 *
 * Heights come straight from the identity: lateral malleolus height is the ankle joint centre (de Leva's shank endpoint), tibiale and trochanterion heights stack the shank and thigh lengths on it, and the knee and hip centres sit above tibiale and trochanterion by de Leva's offsets. The hip centre's lateral position comes from leg length by Hara's CT equation, with leg length solved from the same equation's vertical term so the spine and the hip centre agree. Each ankle stands directly below its hip centre, feet parallel and pointing forward: the canonical rest stance rather than ANSUR's heels-together stance, which changes no measured height.
 *
 * Axes follow clinical signs on each side: hip flexion carries the thigh forward, knee flexion the shank backward, ankle flexion is dorsiflexion, toe flexion curls the toes down; abduction carries a limb away from the midline and twist turns its front outward.
 *
 * @param leg The leg's measurements
 * @param side Which leg
 * @param body The body measurements the pelvis landmarks read
 * @returns Joints from the thigh to the toes, the hip centre and the leg's landmarks
 */
export function placeAutoMovieHumanLeg(
  leg: IAutoMovieHumanIdentity.ILeg,
  side: "left" | "right",
  body: IAutoMovieHumanIdentity.IBody,
): placeAutoMovieHumanLeg.IOutput {
  const v: typeof AutoMovieHumanVector.of = AutoMovieHumanVector.of;
  const s: number = side === "left" ? 1 : -1;
  const prefix: "left" | "right" = side;

  const ankle: number = leg.ankleHeight;
  const tibiale: number = ankle + leg.shankLength;
  const trochanterion: number = tibiale + leg.thighLength;
  const hipHeight: number = trochanterion + ABOVE_LANDMARK.hip * leg.thighLength;
  const kneeHeight: number = tibiale + ABOVE_LANDMARK.knee * leg.thighLength;

  // Hara: hip height = spine height + (-9 - 0.078 LL), and LL = spine height - malleolus height
  const legLength: number =
    (hipHeight - HARA_2016.superior[0] - ankle) / (1 + HARA_2016.superior[1]);
  const lateral: number = HARA_2016.lateral[0] + HARA_2016.lateral[1] * legLength;
  const x: number = s * lateral;
  const hip: IAutoMovieVector3 = v(x, hipHeight, 0);
  const knee: IAutoMovieVector3 = v(x, kneeHeight, 0);
  const ankleCentre: IAutoMovieVector3 = v(x, ankle, 0);
  const footHeight: number = CONVENTIONAL.footJointHeight * ankle;
  const heelZ: number = -CONVENTIONAL.heelBehindAnkle * leg.footLength;
  const ballZ: number = heelZ + BALL_OF_FOOT * leg.footLength;
  const toes: IAutoMovieVector3 = v(x, footHeight, ballZ);
  const toeTip: IAutoMovieVector3 = v(
    x - s * 0.25 * leg.footBreadth,
    CONVENTIONAL.toeTipHeight * ankle,
    heelZ + leg.footLength,
  );

  const axes: (
    flexion: number,
    abduction: IAutoMovieVector3,
    twist: IAutoMovieVector3,
  ) => IAutoMovieHumanSkeleton.IAxes = (
    flexion: number,
    abduction: IAutoMovieVector3,
    twist: IAutoMovieVector3,
  ): IAutoMovieHumanSkeleton.IAxes => ({
    flexion: v(flexion, 0, 0),
    abduction,
    twist,
  });
  const limbAxes: IAutoMovieHumanSkeleton.IAxes = axes(
    -1,
    v(0, 0, s),
    v(0, s, 0),
  );
  const mark: (
    bone: IAutoMovieHumanLandmarks.ILandmark["bone"],
    position: IAutoMovieVector3,
  ) => IAutoMovieHumanLandmarks.ILandmark = (
    bone: IAutoMovieHumanLandmarks.ILandmark["bone"],
    position: IAutoMovieVector3,
  ): IAutoMovieHumanLandmarks.ILandmark => ({ bone, position });

  return {
    hip,
    legLength,
    joints: [
      {
        bone: `${prefix}UpperLeg`,
        parent: "hips",
        position: hip,
        tail: knee,
        axes: limbAxes,
        constraint: null,
      },
      {
        bone: `${prefix}LowerLeg`,
        parent: `${prefix}UpperLeg`,
        position: knee,
        tail: ankleCentre,
        axes: axes(1, v(0, 0, s), v(0, s, 0)),
        constraint: null,
      },
      {
        bone: `${prefix}Foot`,
        parent: `${prefix}LowerLeg`,
        position: ankleCentre,
        tail: toes,
        axes: axes(-1, v(0, s, 0), v(0, 0, s)),
        constraint: null,
      },
      {
        bone: `${prefix}Toes`,
        parent: `${prefix}Foot`,
        position: toes,
        tail: toeTip,
        axes: axes(1, v(0, s, 0), v(0, 0, s)),
        constraint: null,
      },
    ],
    landmarks: {
      iliospinale: mark(
        "hips",
        v(
          s * ILIOSPINALE_PER_BICRISTAL * body.bicristalBreadth,
          hipHeight - (HARA_2016.superior[0] + HARA_2016.superior[1] * legLength),
          -(HARA_2016.anterior[0] + HARA_2016.anterior[1] * legLength),
        ),
      ),
      trochanterion: mark(
        `${prefix}UpperLeg`,
        v(
          (s * CONVENTIONAL.trochanterOfHipBreadth * body.hipBreadth) / 2,
          trochanterion,
          0,
        ),
      ),
      patella: mark(
        `${prefix}LowerLeg`,
        v(
          x,
          tibiale + ABOVE_LANDMARK.patella * leg.thighLength,
          CONVENTIONAL.patellaAnterior * leg.thighLength,
        ),
      ),
      tibiale: mark(
        `${prefix}LowerLeg`,
        v(x - s * CONVENTIONAL.tibialeMedial * leg.thighLength, tibiale, 0),
      ),
      sphyrion: mark(
        `${prefix}LowerLeg`,
        v(
          x - s * MALLEOLUS_HALF_BREADTH * leg.footLength,
          CONVENTIONAL.sphyrionHeight * ankle,
          CONVENTIONAL.sphyrionAnterior * leg.footLength,
        ),
      ),
      lateralMalleolus: mark(
        `${prefix}LowerLeg`,
        v(x + s * MALLEOLUS_HALF_BREADTH * leg.footLength, ankle, 0),
      ),
      pternion: mark(`${prefix}Foot`, v(x, footHeight, heelZ)),
      metatarsaleI: mark(
        `${prefix}Foot`,
        v(x - (s * leg.footBreadth) / 2, footHeight, ballZ),
      ),
      metatarsaleV: mark(
        `${prefix}Foot`,
        v(x + (s * leg.footBreadth) / 2, footHeight, ballZ),
      ),
      acropodion: mark(`${prefix}Toes`, toeTip),
    },
  };
}
export namespace placeAutoMovieHumanLeg {
  /**
   * One placed leg.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Hip joint centre, millimetres. */
    hip: IAutoMovieVector3;

    /** Hara's leg length, anterior superior iliac spine to malleolus, millimetres. */
    legLength: number;

    /** Thigh, shank, foot and toes, parents first. */
    joints: IAutoMovieHumanSkeleton.IJoint[];

    /** The leg's landmarks. */
    landmarks: Pick<
      IAutoMovieHumanLandmarks.ISide,
      | "iliospinale"
      | "trochanterion"
      | "patella"
      | "tibiale"
      | "sphyrion"
      | "lateralMalleolus"
      | "pternion"
      | "metatarsaleI"
      | "metatarsaleV"
      | "acropodion"
    >;
  }
}
