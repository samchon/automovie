import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_FOOT_FORM } from "./AUTOMOVIE_HUMAN_FOOT_FORM";
import { AUTOMOVIE_HUMAN_TOE_FORM } from "./AUTOMOVIE_HUMAN_TOE_FORM";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";

/**
 * Heel breadth over foot length: ANSUR II means 0.273 in women and 0.268 in men (Gordon et al. 2014, NATICK/TR-15/007), pooled. Grade: measured.
 */
const HEEL_BREADTH: number = 0.27;

/** Shared heel reach and border-start fraction: the arc's posterior point is the actual pternion, independent of sampling. */
const HEEL_AT: number = AUTOMOVIE_HUMAN_FOOT_FORM.heel.reach;

/**
 * Plan one foot from the leg's measurements and the skeleton's landmarks.
 *
 * Independent length, breadth and arch height come from the identity. The heel follows pternion and the envelope centre flows to the metatarsal boundary. Toe roots follow the shared Toes fulcrum with common reference-fitted offsets, and their free breadths, directions and lengths belong to the same fan family; those modelled-joint offsets are not clinical MTP measurements. The longest projected tip follows acropodion. The old outline ratios are normalized to the independent breadth rather than letting length define width.
 *
 * Heights shape the form Gray describes ("Surface Anatomy of the Lower Extremity", Anatomy of the Human Body, 1918): the dorsum is convex, highest along a crest over the head of the talus, the navicular, the second cuneiform and the second metatarsal, "falling slowly to the lateral border and steeply to the medial"; the lateral border is lower and rests on the ground, while the medial border rises into the longitudinal arch, whose height is the identity's navicular height. Every profile is a fraction of foot length or of navicular height, so a child's foot keeps its own measured breadth and arch rather than a scaled adult's. The profile values are the coefficients of `AUTOMOVIE_HUMAN_FOOT_FORM`, fitted against reference feet across sex and age.
 *
 * @param props.leg The leg's measurements
 * @param props.landmarks The side's landmarks
 * @param props.toLocal Conversion of a model point into the foot's local frame
 * @param props.ankle The ankle ring's shared shape in the local frame
 * @param props.joint The shared toes-bone fulcrum in the local frame
 * @returns The plan
 */
export function planAutoMovieHumanFoot(props: {
  leg: IAutoMovieHumanIdentity.ILeg;
  landmarks: IAutoMovieHumanLandmarks.ISide;
  toLocal: (point: IAutoMovieVector3) => IAutoMovieVector3;
  ankle: IAutoMovieHumanFootPlan.IAnkle;
  joint: IAutoMovieVector3;
}): IAutoMovieHumanFootPlan {
  const FORM: typeof AUTOMOVIE_HUMAN_FOOT_FORM = AUTOMOVIE_HUMAN_FOOT_FORM;
  const L: number = props.leg.footLength;
  const B: number = props.leg.footBreadth;
  const A: number = props.leg.ankleHeight;
  const arch: number = props.leg.navicularHeight / L;
  const heelPoint: IAutoMovieVector3 = props.toLocal(
    props.landmarks.pternion.position,
  );
  const heel: number = heelPoint.z;
  const tip: IAutoMovieVector3 = props.toLocal(
    props.landmarks.acropodion.position,
  );
  const toesForm: typeof AUTOMOVIE_HUMAN_TOE_FORM = AUTOMOVIE_HUMAN_TOE_FORM;

  // A shared transverse band is partitioned by projected free widths and web
  // gaps. Roots lie on its fan rays at their own fore-aft stations, rather
  // than independently placing five intersecting sweeps. All positions follow
  // the metatarsal boundary, actual toes fulcrum and the person's dimensions.
  const angles: number[] = toesForm.angle.map(
    (degrees: number): number => (degrees * Math.PI) / 180,
  );
  const widths: number[] = toesForm.breadth.map(
    (share: number): number => share * B,
  );
  const projected: number[] = widths.map(
    (width: number, i: number): number => width / Math.cos(angles[i]!),
  );
  const gap: number = toesForm.web * B;
  const total: number =
    projected.reduce((sum: number, width: number): number => sum + width, 0) +
    (projected.length - 1) * gap;
  const metatarsalMedial: IAutoMovieVector3 = props.toLocal(
    props.landmarks.metatarsaleI.position,
  );
  const metatarsalLateral: IAutoMovieVector3 = props.toLocal(
    props.landmarks.metatarsaleV.position,
  );
  let x: number = (metatarsalMedial.x + metatarsalLateral.x - total) / 2;
  const planeZ: number =
    props.joint.z +
    (toesForm.rootFromFulcrum + Math.min(...toesForm.rootAlong)) * L;
  const toes: IAutoMovieHumanFootPlan.IToe[] = widths.map(
    (width: number, t: number): IAutoMovieHumanFootPlan.IToe => {
      const angle: number = angles[t]!;
      const z: number =
        props.joint.z + (toesForm.rootFromFulcrum + toesForm.rootAlong[t]!) * L;
      const toe: IAutoMovieHumanFootPlan.IToe = {
        joint: AutoMovieHumanVector.of(
          x + projected[t]! / 2 + Math.tan(angle) * (z - planeZ),
          props.joint.y,
          z,
        ),
        direction: AutoMovieHumanVector.of(Math.sin(angle), 0, Math.cos(angle)),
        length: toesForm.length[t]! * L,
        width,
        height: FORM.toeHeight[t]! * L,
        hallux: t === 0,
      };
      x += projected[t]! + gap;
      return toe;
    },
  );
  // One scale preserves the toe-length ratios while the longest projected tip
  // reaches the shared acropodion instead of extending past the foot length.
  const lengthScale: number = Math.min(
    ...toes.map(
      (toe: IAutoMovieHumanFootPlan.IToe): number =>
        (tip.z - toe.joint.z) / (toe.length * toe.direction.z),
    ),
  );
  for (const toe of toes) toe.length *= lengthScale;
  const heelWidth: number = 0.49 * HEEL_BREADTH * L;
  const heelAt: number = HEEL_AT;
  // The old normalized outline supplies one shape family; independent B sets
  // its physical span, rather than foot length silently defining foot width.
  const transverseScale: number =
    B /
    (L * (Math.max(...FORM.medialOffset) + Math.max(...FORM.lateralOffset)));
  const breadthValues: (values: readonly number[]) => number[] = (
    values: readonly number[],
  ): number[] => values.map((v: number): number => v * transverseScale);
  return {
    length: L,
    breadth: B,
    ankleHeight: A,
    navicularHeight: props.leg.navicularHeight,
    heel,
    axis: {
      heel: heelPoint.x,
      forefoot: (metatarsalMedial.x + metatarsalLateral.x) / 2,
      at: ((metatarsalMedial.z + metatarsalLateral.z) / 2 - heel) / L,
    },
    ankle: props.ankle,
    medial: {
      stations: [heelAt, 0.12, 0.17, 0.23, 0.3, 0.38, 0.47, 0.56, 0.65, 0.74],
      offset: keyed(
        heelWidth / L,
        [0.2, 0.35, 0.55, 0.66, 0.74],
        breadthValues(FORM.medialOffset),
      ),
      rim: keyed(null, [heelAt, 0.2, 0.32, 0.45, 0.6, 0.74], FORM.medialRim),
      sole: [
        [heelAt, FORM.medialSole[0]],
        [0.22, FORM.medialSole[1]],
        [0.32, FORM.medialArch[0] * arch],
        [0.48, FORM.medialArch[1] * arch],
        [0.62, FORM.medialSole[2]],
        [0.74, FORM.medialSole[3]],
      ],
      inset: 0.022 * L,
    },
    lateral: {
      stations: [heelAt, 0.12, 0.17, 0.23, 0.29, 0.36, 0.43, 0.5, 0.57, 0.635],
      offset: keyed(
        heelWidth / L,
        [0.2, 0.3, 0.45, 0.56, 0.635],
        breadthValues(FORM.lateralOffset),
      ),
      rim: keyed(null, [heelAt, 0.25, 0.45, 0.635], FORM.lateralRim),
      sole: keyed(null, [heelAt, 0.3, 0.635], FORM.lateralSole),
      inset: 0.02 * L,
    },
    ridge: {
      x: keyed(null, [0.1, 0.3, 0.6, 0.8], breadthValues(FORM.ridgeX)),
      height: keyed(
        null,
        [0, 0.12, 0.22, 0.3, 0.36, 0.45, 0.55, 0.65, 0.74, 0.82, 0.9],
        FORM.ridgeHeight,
      ),
      lift: FORM.ridgeLift,
    },
    heelArc: {
      at: heelAt,
      x: heelPoint.x,
      width: heelWidth,
      reach: FORM.heel.reach * L,
      rim: [FORM.heel.back * L, FORM.heel.side * L],
      sole: 0.022 * L,
    },
    toes,
    lateralMalleolus: props.toLocal(props.landmarks.lateralMalleolus.position),
    medialMalleolus: props.toLocal(props.landmarks.sphyrion.position),
  };
}

/** A profile from its stations and values, after an optional first key at the heel arc's end. */
const keyed: (
  heel: number | null,
  at: readonly number[],
  values: readonly number[],
) => IAutoMovieHumanFootPlan.IProfile = (
  heel: number | null,
  at: readonly number[],
  values: readonly number[],
): IAutoMovieHumanFootPlan.IProfile => [
  ...(heel === null ? [] : [[HEEL_AT, heel] as const]),
  ...at.map((f: number, k: number): readonly [number, number] => [
    f,
    values[k]!,
  ]),
];
