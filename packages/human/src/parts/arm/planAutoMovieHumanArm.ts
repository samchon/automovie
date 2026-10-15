import { IAutoMovieSweepSection } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanSubcutaneousFat } from "../../structures/IAutoMovieHumanSubcutaneousFat";
import { AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT } from "../AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT";
import { IAutoMovieHumanLimbPlan } from "../IAutoMovieHumanLimbPlan";
import { traceAutoMovieHumanLimbRelief } from "../traceAutoMovieHumanLimbRelief";
import { AUTOMOVIE_HUMAN_ARM_RELIEF } from "./AUTOMOVIE_HUMAN_ARM_RELIEF";
import { IAutoMovieHumanArmRelief } from "./IAutoMovieHumanArmRelief";
import { estimateAutoMovieHumanArmTissue } from "./estimateAutoMovieHumanArmTissue";
import { sectionAutoMovieHumanArm } from "./sectionAutoMovieHumanArm";

/**
 * Vertices around each station's row: the rings' eight all along, so the arm is a regular tube with no pole. A band that turns eight vertices into twelve between two rows dents the limit surface at its poles, on the narrow upper arm as much as on the forearm. Grade: conventional.
 */
const COLUMNS: number[] = [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];

/** Rows of faces from each station to the next: one per gap, two across the long gaps of the upper arm and the forearm's bellies, so rows lie about a span apart. Grade: conventional. */
const ROWS: number[] = [1, 1, 2, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1];

/** Arm levels between which the fat over a form turns from the upper arm's to the forearm's, about the elbow. Grade: conventional. */
const ELBOW_FAT: [number, number] = [-0.15, 0.1];

/**
 * Lay one arm out for lofting, from mid upper arm to the wrist.
 *
 * Every section of `sectionAutoMovieHumanArm` becomes one station: above the elbow on the line from the shoulder to the elbow joint centre, below it on the line from the elbow to the wrist joint centre, at the joint on their bisector, so a carrying angle or flexion in the skeleton bends the spine with it. Each station's anterior direction is the rest-pose front projected across its axis, turned by the section's twist toward the medial side, so the chart's `v` spirals down the mid-prone forearm and reaches the wrist on its palmar surface exactly as the wrist ring starts. A section is its eight radii joined round the turn; the first and last two stations are the junctions', the `upperArm` and `wrist` rings of `shapeAutoMovieHumanRing` and their collars.
 *
 * Relief is `AUTOMOVIE_HUMAN_ARM_RELIEF`, each form's height its amplitude times the section's mean deep radius, times the arm's muscularity for a muscle, rising and falling by a cosine along its levels: the belly's size follows the lean mass. How sharply it shows follows the regional subcutaneous fat over it (`IAutoMovieHumanSubcutaneousFat`), which `traceAutoMovieHumanLimbRelief` lays over it as a smoothing layer in place of the average adult's (`AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT`) the table describes: on the upper arm the fat over the biceps in front and over the triceps behind, blended round the limb by the cosine of the form's angle, and below the elbow the fat over the forearm's bellies.
 *
 * @param props.measurements The person
 * @param props.skeleton The person's skeleton at rest
 * @param props.side Which arm
 * @returns The arm's loft plan, its `upperArm` ring proximal and its `wrist` ring distal
 */
export function planAutoMovieHumanArm(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
}): IAutoMovieHumanLimbPlan {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const { measurements, skeleton, side } = props;
  const identity: IAutoMovieHumanIdentity = measurements.identity;
  const arm: IAutoMovieHumanIdentity.IArm =
    side === "left" ? identity.body.leftArm : identity.body.rightArm;
  const tissue: estimateAutoMovieHumanArmTissue.IOutput =
    estimateAutoMovieHumanArmTissue(identity, arm);
  const joint = (bone: string): IAutoMovieVector3 => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined =
      skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
          j.bone === `${side}${bone}`,
      );
    if (found === undefined) throw new Error(`skeleton lacks ${side}${bone}`);
    return found.position;
  };
  const ring = (site: "upperArm" | "wrist"): IAutoMovieHumanRingShape =>
    shapeAutoMovieHumanRing({ skeleton, measurements, site, side, part: "arm" });
  const upper: IAutoMovieHumanRingShape = ring("upperArm");
  const wrist: IAutoMovieHumanRingShape = ring("wrist");
  const elbow: IAutoMovieVector3 = joint("LowerArm");
  const humerus: IAutoMovieVector3 = V.normalize(
    V.offset(elbow, [joint("UpperArm"), -1]),
  );
  const forearm: IAutoMovieVector3 = V.normalize(
    V.offset(joint("Hand"), [elbow, -1]),
  );
  const above: number = V.dot(V.offset(elbow, [upper.frame.origin, -1]), humerus);
  const below: number = V.distance(elbow, wrist.frame.origin);
  // the medial side is counterclockwise about the distal axis on the left arm and clockwise on the right
  const mirror: number = side === "left" ? 1 : -1;
  const sections: sectionAutoMovieHumanArm.ISection[] = sectionAutoMovieHumanArm(
    arm,
    tissue,
  );
  const last: number = sections.length - 1;
  const stations: IAutoMovieHumanLimbPlan.IStation[] = sections.map(
    (section: sectionAutoMovieHumanArm.ISection, i: number): IAutoMovieHumanLimbPlan.IStation => {
      const level: number = section.level;
      const common = {
        name: `arm ${level}`,
        columns: COLUMNS[i]!,
        rows: ROWS[i]!,
      };
      if (i <= 1)
        return {
          ...common,
          centre: V.offset(upper.frame.origin, [humerus, (1 + level) * above]),
          axis: humerus,
          anterior: upper.frame.reference,
          section: null,
          girth: null,
        };
      if (i >= last - 1)
        return {
          ...common,
          centre: V.offset(wrist.frame.origin, [forearm, (level - 1) * below]),
          axis: forearm,
          anterior: wrist.frame.reference,
          section: null,
          girth: null,
        };
      const axis: IAutoMovieVector3 =
        level < 0
          ? humerus
          : level > 0
            ? forearm
            : V.normalize(V.offset(humerus, [forearm, 1]));
      const front: IAutoMovieVector3 = V.normalize(
        V.offset(V.of(0, 0, 1), [axis, -axis.z]),
      );
      const twist: number = (mirror * section.twist * Math.PI) / 180;
      return {
        ...common,
        centre: V.offset(elbow, [axis, level * (level < 0 ? above : below)]),
        axis,
        anterior: V.offset(
          V.of(0, 0, 0),
          [front, Math.cos(twist)],
          [V.cross(axis, front), Math.sin(twist)],
        ),
        section: curveOf(section.radii, mirror),
        girth: section.girth,
      };
    },
  );

  const levels: number[] = sections.map(
    (s: sectionAutoMovieHumanArm.ISection): number => s.level,
  );
  const along = (read: (s: sectionAutoMovieHumanArm.ISection) => number) =>
    (level: number): number =>
      interpolate(
        sections.map((s: sectionAutoMovieHumanArm.ISection): [number, number] => [
          s.level,
          read(s),
        ]),
        level,
      );
  const deep = along((s: sectionAutoMovieHumanArm.ISection): number => s.deep);
  const regional: IAutoMovieHumanSubcutaneousFat =
    identity.composition.subcutaneousFat;
  const girth = along((s: sectionAutoMovieHumanArm.ISection): number => s.girth);
  const relief: IAutoMovieHumanLimbPlan.IRelief[] = AUTOMOVIE_HUMAN_ARM_RELIEF.map(
    (form: IAutoMovieHumanArmRelief): IAutoMovieHumanLimbPlan.IRelief | null =>
      traceAutoMovieHumanLimbRelief({
        name: form.name,
        levels,
        from: form.from,
        peak: form.peak,
        to: form.to,
        angle: (): number => (mirror * form.angle * Math.PI) / 180,
        height: (level: number): number =>
          form.amplitude *
          (form.kind === "muscle" ? tissue.muscularity : 1) *
          bump(level, form.from, form.peak, form.to) *
          deep(level),
        spread:
          ((form.width * Math.PI) / 180) *
          (girth(Math.min(1, Math.max(-1, form.peak))) / (2 * Math.PI)),
        fat: over(regional, form),
        reference: over(AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT, form),
      }),
  ).filter(
    (r: IAutoMovieHumanLimbPlan.IRelief | null): r is IAutoMovieHumanLimbPlan.IRelief =>
      r !== null,
  );
  return { part: "arm", side, proximal: upper, distal: wrist, stations, relief };
}

/** The subcutaneous fat over one form at an arm level, from a record of regional thicknesses. */
const over =
  (
    regional: Pick<
      IAutoMovieHumanSubcutaneousFat,
      "upperArmFront" | "upperArmBack" | "forearm"
    >,
    form: IAutoMovieHumanArmRelief,
  ) =>
  (level: number): number => {
    const front: number = (1 + Math.cos((form.angle * Math.PI) / 180)) / 2;
    const upper: number =
      front * regional.upperArmFront + (1 - front) * regional.upperArmBack;
    const t: number = Math.min(
      1,
      Math.max(0, (level - ELBOW_FAT[0]) / (ELBOW_FAT[1] - ELBOW_FAT[0])),
    );
    return upper + t * (regional.forearm - upper);
  };

/**
 * A section's eight radii as a radial section in the station's plane, joined round the turn by the engine's periodic monotone interpolation, which never overshoots its samples: an interpolating spline does, and at an infant's elbow, where the epicondyles floor the sides far out of the shallow front and back, it would loop. Anatomical direction `k` lies `k` eighths of a turn from anterior toward the medial side, which is counterclockwise about the distal axis on the left arm and clockwise on the right.
 */
const curveOf = (radii: number[], mirror: number): IAutoMovieSweepSection => ({
  type: "radial",
  radii: radii.map(
    (_: number, j: number): number =>
      radii[mirror > 0 ? j : (radii.length - j) % radii.length]!,
  ),
});

/** Smooth bump along the arm: 0 outside `from` to `to`, 1 at `peak`, cosine on each side. */
const bump = (x: number, from: number, peak: number, to: number): number => {
  if (x <= from || x >= to) return 0;
  const t: number =
    x < peak ? (x - from) / (peak - from) : (to - x) / (to - peak);
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
};

/** Piecewise linear interpolation over ascending knots, held beyond the ends. */
const interpolate = (knots: Array<[number, number]>, x: number): number => {
  if (x <= knots[0]![0]) return knots[0]![1];
  for (let i: number = 1; i < knots.length; ++i) {
    const [x1, y1]: [number, number] = knots[i]!;
    if (x <= x1) {
      const [x0, y0]: [number, number] = knots[i - 1]!;
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return knots[knots.length - 1]![1];
};
