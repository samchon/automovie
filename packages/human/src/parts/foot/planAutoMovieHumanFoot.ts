import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_FOOT_GRID } from "./AUTOMOVIE_HUMAN_FOOT_GRID";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";

/**
 * Back of the heel behind the ankle joint centre, of foot length: the skeleton's placement of pternion, which this part keeps so the heel ends where the skeleton's foot bone starts. Grade: conventional, the skeleton's.
 */
const HEEL_BEHIND_ANKLE: number = 0.22;

/**
 * Heel breadth over foot length: ANSUR II means 0.273 in women and 0.268 in men (Gordon et al. 2014, NATICK/TR-15/007), pooled. Grade: measured.
 */
const HEEL_BREADTH: number = 0.27;

/**
 * Metatarsophalangeal joints from the back of the heel, of foot length, hallux to fifth toe. The first is ANSUR II's ball-of-foot length, 0.739 of foot length in women and 0.741 in men (Gordon et al. 2014). The others keep the first's ratio to the metatarsal head positions measured along the foot's axis on footprints of 36 older adults, 69.3, 69.9, 67.7, 64.0 and 59.7% of insole length (Forghany et al. 2018, J Foot Ankle Res 11:31), which carries the oblique line of the heads, the fifth well behind the first, onto foot length. Grade: measured for the first, derived for the rest.
 */
const JOINT_ALONG: readonly number[] = [0.74, 0.746, 0.723, 0.683, 0.637];

/**
 * Toe tips from the back of the heel, of foot length, hallux to fifth. The hallux is the longest toe, so it reaches the full foot length, as in the skeleton's acropodion; the lesser tips recede along the toe line. Grade: conventional, set against renders.
 */
const TIP_ALONG: readonly number[] = [1, 0.965, 0.92, 0.868, 0.815];

/**
 * Toe breadths over foot breadth, hallux to fifth, and the web between two toes. They span 0.95 of the breadth across the toe roots, a little less than across the metatarsal heads behind them. Grade: conventional, set against renders.
 */
const TOE_BREADTH: readonly number[] = [0.275, 0.17, 0.162, 0.152, 0.146];

/** Interdigital web over foot breadth. Grade: conventional. */
const WEB_BREADTH: number = 0.012;

/**
 * Toe axes in plan, degrees from the foot's axis toward the lateral side, hallux to fifth. The hallux leans laterally and the outer toes curve medially, converging on the second toe; the hallux angle stays well inside the 15 degrees beyond which hallux valgus is diagnosed. Grade: conventional.
 */
const TOE_ANGLE: readonly number[] = [6, 2, 0, -3, -7];

/** Dorsal height of each toe over foot length, hallux to fifth. Grade: conventional, set against renders. */
const TOE_HEIGHT: readonly number[] = [0.095, 0.076, 0.073, 0.069, 0.065];

/**
 * Height of the metatarsophalangeal joint centres, of lateral malleolus height: the skeleton's height of its toes joint. Grade: conventional, the skeleton's.
 */
const JOINT_HEIGHT: number = 0.35;

/**
 * Plan one foot from the leg's measurements and the skeleton's landmarks.
 *
 * Lengths come from the identity: foot length and breadth, lateral malleolus height and navicular height. The heel ends where the skeleton puts it, the first metatarsophalangeal joint at ANSUR II's ball-of-foot length, and the malleoli at the skeleton's landmarks, so the skin and the skeleton never disagree. The outline narrows from the forefoot, whose breadth is measured, to the heel, whose breadth is ANSUR II's fraction of foot length.
 *
 * Heights shape the form Gray describes ("Surface Anatomy of the Lower Extremity", Anatomy of the Human Body, 1918): the dorsum is convex, highest along a crest over the head of the talus, the navicular, the second cuneiform and the second metatarsal, "falling slowly to the lateral border and steeply to the medial"; the lateral border is lower and rests on the ground, while the medial border rises into the longitudinal arch, whose height is the identity's navicular height. Every profile is a fraction of foot length or of navicular height, so a child's foot keeps its own measured breadth and arch rather than a scaled adult's. Profile values are conventional, set by comparing renders with anatomical plates and photographs.
 *
 * @param props.leg The leg's measurements
 * @param props.landmarks The side's landmarks
 * @param props.toLocal Conversion of a model point into the foot's local frame
 * @param props.ankle The ankle ring's shared shape in the local frame
 * @returns The plan
 */
export function planAutoMovieHumanFoot(props: {
  leg: IAutoMovieHumanIdentity.ILeg;
  landmarks: IAutoMovieHumanLandmarks.ISide;
  toLocal: (point: IAutoMovieVector3) => IAutoMovieVector3;
  ankle: IAutoMovieHumanFootPlan.IAnkle;
}): IAutoMovieHumanFootPlan {
  const L: number = props.leg.footLength;
  const B: number = props.leg.footBreadth;
  const A: number = props.leg.ankleHeight;
  const arch: number = props.leg.navicularHeight / L;
  const heel: number = -HEEL_BEHIND_ANKLE * L;
  const along = (f: number): number => heel + f * L;


  // toes from the medial border across, touching at their roots
  const total: number =
    TOE_BREADTH.reduce((a: number, b: number): number => a + b, 0) +
    (TOE_BREADTH.length - 1) * WEB_BREADTH;
  let x: number = (-0.5 * total + 0.01) * B;
  const toes: IAutoMovieHumanFootPlan.IToe[] = TOE_BREADTH.map(
    (share: number, t: number): IAutoMovieHumanFootPlan.IToe => {
      const width: number = share * B;
      const angle: number = (TOE_ANGLE[t]! * Math.PI) / 180;
      const toe: IAutoMovieHumanFootPlan.IToe = {
        joint: AutoMovieHumanVector.of(
          x + width / 2,
          JOINT_HEIGHT * A,
          along(JOINT_ALONG[t]!),
        ),
        direction: AutoMovieHumanVector.of(
          Math.sin(angle),
          0,
          Math.cos(angle),
        ),
        length: ((TIP_ALONG[t]! - JOINT_ALONG[t]!) * L) / Math.cos(angle),
        width,
        height: TOE_HEIGHT[t]! * L,
        hallux: t === 0,
      };
      x += width + WEB_BREADTH * B;
      return toe;
    },
  );
  const heelWidth: number = 0.49 * HEEL_BREADTH * L;
  const heelAt: number = 0.075;
  const rows: number = AUTOMOVIE_HUMAN_FOOT_GRID.rows;
  if (rows !== 11) throw new Error("foot border stations assume 11 rows");
  return {
    length: L,
    breadth: B,
    ankleHeight: A,
    navicularHeight: props.leg.navicularHeight,
    heel,
    ankle: props.ankle,
    medial: {
      stations: [heelAt, 0.12, 0.17, 0.23, 0.3, 0.38, 0.47, 0.56, 0.65, 0.74],
      offset: [
        [heelAt, heelWidth / L],
        [0.2, 0.128],
        [0.35, 0.135],
        [0.55, 0.155],
        [0.66, 0.18],
        [0.74, 0.198],
      ],
      rim: [
        [heelAt, 0.12],
        [0.2, 0.13],
        [0.32, 0.16],
        [0.45, 0.15],
        [0.6, 0.11],
        [0.74, 0.09],
      ],
      sole: [
        [heelAt, 0.02],
        [0.22, 0.03],
        [0.32, 0.55 * arch],
        [0.48, 0.5 * arch],
        [0.62, 0.03],
        [0.74, 0.015],
      ],
      inset: 0.022 * L,
    },
    lateral: {
      stations: [heelAt, 0.12, 0.17, 0.23, 0.29, 0.36, 0.43, 0.5, 0.57, 0.635],
      offset: [
        [heelAt, heelWidth / L],
        [0.2, 0.135],
        [0.3, 0.142],
        [0.45, 0.165],
        [0.56, 0.185],
        [0.635, 0.198],
      ],
      rim: [
        [heelAt, 0.11],
        [0.25, 0.095],
        [0.45, 0.08],
        [0.635, 0.075],
      ],
      sole: [
        [heelAt, 0.02],
        [0.3, 0.012],
        [0.635, 0.012],
      ],
      inset: 0.02 * L,
    },
    ridge: {
      x: [
        [0.1, 0],
        [0.3, -0.01],
        [0.6, -0.05],
        [0.8, -0.07],
      ],
      height: [
        [0, 0.17],
        [0.12, 0.2],
        [0.22, 0.34],
        [0.3, 0.33],
        [0.36, 0.305],
        [0.45, 0.27],
        [0.55, 0.23],
        [0.65, 0.18],
        [0.74, 0.14],
        [0.82, 0.125],
        [0.9, 0.11],
      ],
      lift: 1,
    },
    heelArc: {
      at: heelAt,
      x: 0.005 * L,
      width: heelWidth,
      reach: 0.08 * L,
      rim: [0.15 * L, 0.13 * L],
      sole: 0.022 * L,
    },
    toes,
    lateralMalleolus: props.toLocal(props.landmarks.lateralMalleolus.position),
    medialMalleolus: props.toLocal(props.landmarks.sphyrion.position),
  };
}
