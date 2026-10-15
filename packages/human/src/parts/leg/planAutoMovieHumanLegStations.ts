import { IAutoMovieVector3 } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_THIGH_GIRTH } from "../../junction/AUTOMOVIE_HUMAN_THIGH_GIRTH";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_LEG_SECTIONS } from "./AUTOMOVIE_HUMAN_LEG_SECTIONS";
import { IAutoMovieHumanLegStation } from "./IAutoMovieHumanLegStation";

/**
 * Calf maximum as a fraction of the way from the lateral malleolus to tibiale: about 0.72 in girls and 0.76 in boys of 15 to 18 years in the 1977 US child survey (Snyder et al. 1977), pooled. Grade: derived, from adolescents.
 */
const CALF_LEVEL: number = 0.74;

/**
 * Girths at levels no survey measures, as fractions of the measured ones: our fit of the section perimeters of the MakeHuman CC0 base mesh with its CC0 macro targets (hm08, released CC0 in September 2020) at the same fractions of thigh and shank length, aligned on our skeleton by the shared calibration harness, over eight people of both sexes, every build, 11, 30 and 80 years; means 0.981 (SD 0.012), 1.001 (SD 0.024) and 0.988 (SD 0.011). Grade: population-fitted to a synthetic reference.
 */
const GIRTH: Record<"knee" | "belowKnee" | "upperCalf", number> = {
  /** Midpatella over suprapatella girth: the knee narrows below the vastus medialis. */
  knee: 0.981,
  /** Below the patella over the smaller of knee and calf: the infrapatellar fat pads fill the patellar tendon level, so it is no narrower than the knee. */
  belowKnee: 1.0,
  /** Upper calf over calf maximum. */
  upperCalf: 0.988,
};

/**
 * Leg %fat over whole-body %fat: the reciprocal of the trunk-to-leg %fat ratio, whose NHANES medians at 20 to 30 years run from 0.76 to 0.81 in women and 0.88 to 0.98 in men (Kelly et al. 2009, PLoS ONE 4(9):e7038), pooled to 0.85. The body fat percentage already carries the sex difference. Grade: derived.
 */
const LEG_FAT_PER_BODY_FAT: number = 1 / 0.85;

/**
 * Fat at each girth site relative to the lower thigh: each site's ANSUR II girth gain per BMI unit over its mean girth, pooled over both sexes (thigh at the furrow 0.0220, lower thigh 0.0182, calf 0.0160, ankle 0.0109; Gordon et al. 2014, our regressions), over the lower thigh's. Fat goes to the thigh first and hardly reaches the ankle. Grade: derived.
 */
const SITE_FAT: Record<"furrow" | "lowerThigh" | "calf" | "ankle", number> = {
  furrow: 1.205,
  lowerThigh: 1,
  calf: 0.879,
  ankle: 0.597,
};

/** Stations whose limit girth is fitted: the levels the identity measures. The rings are never moved; they lie on the shared ring shape. */
const FITTED: ReadonlySet<string> = new Set(["suprapatella", "calf maximum"]);

/**
 * The thigh collar below the mid thigh ring, as a fraction of the way from the ring to suprapatella: close enough that the thigh tapers from it, far enough that its loop is a span of its own. Grade: conventional.
 */
const COLLAR: number = 0.12;

/** Stations that continue a junction ring straight; the station just above the ankle is the ankle's collar. */
const COLLARS: Readonly<Record<string, "thigh" | "ankle">> = {
  "thigh collar": "thigh",
  "above the ankle": "ankle",
};

/** Section of a station with no fitted entry: a collar, whose shape comes from its ring, and a ring itself. */
const ROUND: (typeof AUTOMOVIE_HUMAN_LEG_SECTIONS)[string] = {
  aspect: [1, 0],
  posterior: [0, 0],
  lateral: [0, 0],
};

/** One station before its frame: level, girth, base shape and fat site weight. */
interface ILevel {
  name: string;
  height: number;
  girth: number;
  site: number;
  count: number;
}

/**
 * Plan the leg's stations from mid thigh to the ankle for one person and side.
 *
 * Twelve stations carry the cage. The top one is the mid thigh ring of the junction contract and the bottom one its ankle ring, both on the shared shape `shapeAutoMovieHumanRing` resolves, so the trunk and the foot meet them vertex for vertex. Between them stations sit at named levels: two through the lower thigh, where vastus medialis rises; four around the knee (suprapatella, midpatella, the patellar tendon and the tibial tuberosity), denser than elsewhere so the cage has edge loops to fold on in flexion; the calf maximum; and three that follow the calf's taper into the calcaneal tendon. The last two have eight vertices, the ankle ring's count.
 *
 * Girths come from the identity where it measures them: the thigh at the gluteal furrow, the lower thigh at suprapatella, the calf maximum and the ankle minimum. The mid thigh, which no survey read measures, lies on the curve from suprapatella to the furrow; the knee and the levels below the calf are fractions of their neighbours. Each section's base is an ellipse whose breadth over depth and offset behind the bone axis come from `AUTOMOVIE_HUMAN_LEG_SECTIONS` for its fat: small offsets in the thigh, where the femur is central, and large at the calf, where the tibia sits at the front and the triceps surae behind. The thigh's centre also lies lateral to the hip-to-knee axis by the femoral shaft's slope: the shaft runs from between the hip centre and the greater trochanter down to the knee, so the thighs converge on the knees. That slope grows with hip breadth relative to leg length, which is what makes the knee bend "convex toward its fellow" (Bridgman 1920) and more so in a broad-hipped person.
 *
 * Fat thickness at each station spreads the leg's fat share over the cross-section: the leg's fat fraction, weighted by the site, is taken as the area fraction of a subcutaneous shell, whose thickness is then `R(1 - √(1 - a))` for the section's mean radius `R`.
 *
 * @param props.measurements The person's measurements
 * @param props.skeleton The person's skeleton at rest
 * @param props.side Which leg
 * @returns Stations from the mid thigh ring to the ankle ring and the two ring layouts
 */
export function planAutoMovieHumanLegStations(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
}): planAutoMovieHumanLegStations.IOutput {
  const { skeleton, side } = props;
  const identity: IAutoMovieHumanIdentity = props.measurements.identity;
  const leg: IAutoMovieHumanIdentity.ILeg =
    side === "left" ? identity.body.leftLeg : identity.body.rightLeg;
  const landmarks: IAutoMovieHumanLandmarks.ISide =
    side === "left" ? skeleton.landmarks.left : skeleton.landmarks.right;
  const joint = (name: string): IAutoMovieVector3 => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined =
      skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
          j.bone === `${side}${name}`,
      );
    if (found === undefined) throw new Error(`skeleton lacks ${side}${name}`);
    return found.position;
  };
  const hip: IAutoMovieVector3 = joint("UpperLeg");
  const knee: IAutoMovieVector3 = joint("LowerLeg");
  const ankle: IAutoMovieVector3 = joint("Foot");
  const thighRing: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
    skeleton,
    measurements: props.measurements,
    site: "thigh",
    side,
    part: "leg",
  });
  const ankleRing: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
    skeleton,
    measurements: props.measurements,
    site: "ankle",
    side,
    part: "leg",
  });

  // levels along the leg, as heights in the standing rest pose
  const top: number = thighRing.frame.origin.y;
  const bottom: number = ankleRing.frame.origin.y;
  const furrow: number = hip.y - AUTOMOVIE_HUMAN_THIGH_GIRTH.furrow * (hip.y - knee.y);
  const patella: number = landmarks.patella.position.y;
  const tibiale: number = landmarks.tibiale.position.y;
  const supra: number = patella + AUTOMOVIE_HUMAN_THIGH_GIRTH.suprapatella * leg.thighLength;
  const calf: number =
    leg.ankleHeight + CALF_LEVEL * (tibiale - leg.ankleHeight);
  const thighGirth = (height: number): number =>
    leg.lowerThighCircumference +
    (leg.thighCircumference - leg.lowerThighCircumference) *
      Math.pow(Math.max(0, (height - supra) / (furrow - supra)),
        AUTOMOVIE_HUMAN_THIGH_GIRTH.exponent,
      );
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const kneeGirth: number = GIRTH.knee * leg.lowerThighCircumference;
  const calfToAnkle = (share: number): number =>
    lerp(leg.ankleCircumference, leg.calfCircumference, share);
  const levels: ILevel[] = [
    { name: "mid thigh", height: top },
    { name: "thigh collar", height: lerp(top, supra, COLLAR) },
    { name: "lower thigh", height: lerp(top, supra, 0.38) },
    { name: "vastus medialis", height: lerp(top, supra, 0.72) },
    { name: "suprapatella", height: supra },
  ].map(
    (l: Pick<ILevel, "name" | "height">): ILevel => ({
      ...l,
      girth: thighGirth(l.height),
      site: lerp(
        SITE_FAT.lowerThigh,
        SITE_FAT.furrow,
        (l.height - supra) / (furrow - supra),
      ),
      count: 12,
    }),
  );
  levels.push(
    {
      name: "midpatella",
      height: patella,
      girth: kneeGirth,
      site: SITE_FAT.lowerThigh,
      count: 12,
    },
    {
      name: "patellar tendon",
      height: tibiale - 0.06 * leg.shankLength,
      girth:
        GIRTH.belowKnee * Math.min(kneeGirth, leg.calfCircumference),
      site: lerp(SITE_FAT.lowerThigh, SITE_FAT.calf, 0.5),
      count: 12,
    },
    {
      name: "upper calf",
      height: tibiale - 0.15 * leg.shankLength,
      girth: GIRTH.upperCalf * leg.calfCircumference,
      site: SITE_FAT.calf,
      count: 12,
    },
    {
      name: "calf maximum",
      height: calf,
      girth: leg.calfCircumference,
      site: SITE_FAT.calf,
      count: 12,
    },
    // share of the calf-to-ankle girth difference each level keeps, from the same MakeHuman fit:
    // 0.715 (SD 0.050), 0.380 (SD 0.052) and 0.110 (SD 0.020)
    ...(
      [
        ["lower calf", 0.62, 0.715, 12],
        ["calcaneal tendon", 0.36, 0.38, 12],
        ["above the ankle", 0.13, 0.11, 8],
        ["ankle", 0, 0, 8],
      ] as const
    ).map(
      ([name, at, share, count]: readonly [
        string,
        number,
        number,
        number,
      ]): ILevel => ({
        name,
        height: lerp(bottom, calf, at),
        girth: calfToAnkle(share),
        site: lerp(SITE_FAT.ankle, SITE_FAT.calf, at),
        count,
      }),
    ),
  );

  // frames: each station on the bone it crosses, the knee levels on the bisector
  const thighAxis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(knee, [hip, -1]),
  );
  const shankAxis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(ankle, [knee, -1]),
  );
  const lateralOfMidline: IAutoMovieVector3 = AutoMovieHumanVector.of(
    side === "left" ? 1 : -1,
    0,
    0,
  );
  const shaftSlope: number =
    AutoMovieHumanVector.dot(
      AutoMovieHumanVector.offset(landmarks.trochanterion.position, [hip, -1]),
      lateralOfMidline,
    ) /
    2 /
    (landmarks.trochanterion.position.y - knee.y);
  const pointAt = (height: number): IAutoMovieVector3 =>
    height >= knee.y
      ? AutoMovieHumanVector.offset(hip, [
          AutoMovieHumanVector.offset(knee, [hip, -1]),
          (hip.y - height) / (hip.y - knee.y),
        ])
      : AutoMovieHumanVector.offset(knee, [
          AutoMovieHumanVector.offset(ankle, [knee, -1]),
          (knee.y - height) / (knee.y - ankle.y),
        ]);
  const legFat: number = Math.min(
    0.75,
    (identity.composition.bodyFatPercentage / 100) * LEG_FAT_PER_BODY_FAT,
  );
  const origins: IAutoMovieVector3[] = levels.map(
    (l: ILevel, i: number): IAutoMovieVector3 =>
      i === 0
        ? thighRing.frame.origin
        : i === levels.length - 1
          ? ankleRing.frame.origin
          : pointAt(l.height),
  );
  const lengths: number[] = [0];
  for (let i: number = 1; i < origins.length; ++i)
    lengths.push(
      lengths[i - 1]! +
        AutoMovieHumanVector.distance(origins[i - 1]!, origins[i]!),
    );
  const total: number = lengths[lengths.length - 1]!;
  const stations: IAutoMovieHumanLegStation[] = levels.map(
    (l: ILevel, i: number): IAutoMovieHumanLegStation => {
      const axis: IAutoMovieVector3 =
        l.height > supra
          ? thighAxis
          : l.height < tibiale - 0.03 * leg.shankLength
            ? shankAxis
            : AutoMovieHumanVector.normalize(
                AutoMovieHumanVector.offset(thighAxis, [shankAxis, 1]),
              );
      const anterior: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
        AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 1), [
          axis,
          -axis.z,
        ]),
      );
      const around: IAutoMovieVector3 = AutoMovieHumanVector.cross(
        axis,
        anterior,
      );
      const medialRaw: IAutoMovieVector3 = AutoMovieHumanVector.offset(
        AutoMovieHumanVector.of(-lateralOfMidline.x, 0, 0),
        [axis, lateralOfMidline.x * axis.x],
        [anterior, lateralOfMidline.x * anterior.x],
      );
      const radius: number = l.girth / (2 * Math.PI);
      const area: number = Math.min(0.9, legFat * l.site);
      const fat: number = radius * (1 - Math.sqrt(1 - area));
      const section: (typeof AUTOMOVIE_HUMAN_LEG_SECTIONS)[string] =
        AUTOMOVIE_HUMAN_LEG_SECTIONS[l.name] ?? ROUND;
      return {
        name: l.name,
        origin: origins[i]!,
        axis,
        anterior,
        around,
        medial: AutoMovieHumanVector.normalize(medialRaw),
        u: lengths[i]! / total,
        thigh: (l.height - knee.y) / (hip.y - knee.y),
        shank: (l.height - ankle.y) / (knee.y - ankle.y),
        girth: l.girth,
        fitted: FITTED.has(l.name),
        aspect: section.aspect[0] + (section.aspect[1] * fat) / radius,
        posterior: section.posterior[0] + (section.posterior[1] * fat) / radius,
        lateral:
          Math.max(0, shaftSlope * (l.height - knee.y)) +
          (section.lateral[0] + (section.lateral[1] * fat) / radius) * radius,
        fat,
        collar: COLLARS[l.name] ?? null,
        count: l.count,
      };
    },
  );
  return { stations, thighRing, ankleRing };
}
/** Output type of {@link planAutoMovieHumanLegStations}. */
export namespace planAutoMovieHumanLegStations {
  /**
   * The leg's stations and its two ring layouts.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Stations from the mid thigh ring down to the ankle ring. */
    stations: IAutoMovieHumanLegStation[];

    /** The mid thigh ring the leg opens toward the trunk. */
    thighRing: IAutoMovieHumanRingShape;

    /** The ankle ring the leg opens toward the foot. */
    ankleRing: IAutoMovieHumanRingShape;
  }
}
