import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanSide } from "../junction/AutoMovieHumanSide";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT } from "./AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT";
import { erfAutoMovieHuman } from "./erfAutoMovieHuman";

/**
 * Where the deltoid tuberosity lies on the humerus, as a share of the distance from the acromion to the elbow joint centre along the bone: "about the middle of the lateral surface of the body" of the humerus (Gray 1918, Anatomy of the Human Body, "The Humerus"). Grade: conventional reading of a descriptive source.
 */
const INSERTION: number = 0.5;

/**
 * Appendicular lean mass index, kilograms per square metre, at which the deltoid's relief takes its tabulated depth: the midpoint of the NHANES medians at 20 years, 6.81 for women and 8.87 for men (Kelly et al. 2009, PLoS ONE 4(9):e7038), as the limb reliefs use. Depths grow with the index to the power 1.5. Grade: derived.
 */
const LEAN_REFERENCE: number = 7.84;

/** Rounding of a border under the skin with no fat over it, millimetres, and the blur per millimetre of fat over it, as the limb reliefs take them. Grade: conventional. */
const FASCIA: number = 3;
const BLUR_PER_FAT: number = 1.5;

/**
 * The deltoid's forms, each a band along the humerus between two shares of the acromion-to-insertion distance (`from`, `to`; beyond 1 it runs past the insertion), its crest at an angle round the humerus from the anterior side toward the lateral one at either end (degrees), with a deep half-width across (millimetres) and a depth at the average adult's fat (millimetres, outward positive) at neutral lean mass.
 *
 * The deltoid arises from the lateral third of the clavicle, the acromion and the spine of the scapula and inserts on the deltoid tuberosity; its anterior, middle and posterior heads converge on the insertion, the middle one multipennate and the fullest (Gray 1918, "The Deltoideus"). On the surface the borders between the heads show as shallow furrows running down to the insertion, the lower end forms a V whose point dips into the furrow between the biceps and the lateral head of the triceps, and the anterior border meets the clavicular pectoralis at the deltopectoral groove (Gray 1918, "Surface Anatomy of the Upper Extremity"; Bridgman 1920, Constructive Anatomy). In the abducted rest pose the deltoid is shortened, so its bellies stand fullest in their upper halves. Positions, widths and depths are conventional, set for the comparison round against the reference bodies to fit.
 */
const FORMS: ReadonlyArray<{
  name: string;
  from: number;
  to: number;
  angles: [number, number];
  half: number;
  depth: number;
}> = [
  {
    name: "middle head",
    from: 0.08,
    to: 0.85,
    angles: [90, 90],
    half: 16,
    depth: 2.2,
  },
  {
    name: "anterior head",
    from: 0.1,
    to: 0.8,
    angles: [38, 78],
    half: 14,
    depth: 1.6,
  },
  {
    name: "posterior head",
    from: 0.1,
    to: 0.8,
    angles: [142, 102],
    half: 14,
    depth: 1.6,
  },
  {
    name: "furrow between the anterior and middle heads",
    from: 0.18,
    to: 0.75,
    angles: [64, 86],
    half: 4,
    depth: -1.2,
  },
  {
    name: "furrow between the middle and posterior heads",
    from: 0.18,
    to: 0.75,
    angles: [116, 94],
    half: 4,
    depth: -1.2,
  },
  {
    name: "deltopectoral groove",
    from: 0.05,
    to: 0.7,
    angles: [12, 40],
    half: 5,
    depth: -1.5,
  },
  {
    name: "hollow below the insertion",
    from: 0.95,
    to: 1.35,
    angles: [90, 90],
    half: 10,
    depth: -2,
  },
];

/**
 * The deltoid's relief over the shoulder and the top of the arm, one field the trunk's shoulder branch and the arm both evaluate, so the surface is continuous across the mid-upper-arm ring by construction.
 *
 * The field reads a point's rest position in the humerus's frame: its axial distance `a` from the acromion along the bone (the line from the shoulder joint centre to the elbow joint centre), its polar angle round that axis from the anterior side toward the lateral side (in the rest pose the lateral side faces up on both arms), and its radial distance `ρ`, which turns an angle into arc length on the surface. Each of `FORMS` is a band along the bone between its two levels, rising and falling by a smoothstep over a fifth of its length at either end, its crest turning linearly between its two angles; across it the deep form is a box of its half-width whose borders the fascia and the fat over it round by a normal distribution, so the depth's area is kept and a lean shoulder shows sharp head borders and furrows, a fat one a smooth cap. Depths grow with the appendicular lean mass index to the power 1.5; the fat is the mean of the upper arm's front and back thicknesses, the deltoid having no site of its own, with the average adult's as the reference the depths describe.
 *
 * @param props.measurements The person
 * @param props.skeleton The person's skeleton at rest
 * @param props.side Which shoulder
 * @returns Displacement, millimetres, outward positive, at a rest position in the model frame, millimetres; zero outside the deltoid's reach
 */
export function fieldAutoMovieHumanDeltoid(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
}): (position: IAutoMovieVector3) => number {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const joint = (bone: string): IAutoMovieVector3 => {
    const found: IAutoMovieHumanSkeleton.IJoint | undefined =
      props.skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
          j.bone === `${props.side}${bone}`,
      );
    if (found === undefined)
      throw new Error(`skeleton lacks ${props.side}${bone}`);
    return found.position;
  };
  const shoulder: IAutoMovieVector3 = joint("UpperArm");
  const elbow: IAutoMovieVector3 = joint("LowerArm");
  const axis: IAutoMovieVector3 = V.normalize(V.offset(elbow, [shoulder, -1]));
  const acromion: IAutoMovieVector3 = (
    props.side === "left"
      ? props.skeleton.landmarks.left
      : props.skeleton.landmarks.right
  ).acromion.position;
  const origin: IAutoMovieVector3 = V.offset(shoulder, [
    axis,
    V.dot(V.offset(acromion, [shoulder, -1]), axis),
  ]);
  const anterior: IAutoMovieVector3 = V.normalize(
    V.offset(V.of(0, 0, 1), [axis, -axis.z]),
  );
  const lateral: IAutoMovieVector3 = V.normalize(
    V.offset(V.of(0, 1, 0), [axis, -axis.y], [anterior, -anterior.y]),
  );
  const insertion: number =
    INSERTION * V.dot(V.offset(elbow, [origin, -1]), axis);
  const composition = props.measurements.identity.composition;
  const muscle: number = Math.pow(
    composition.appendicularLeanMassIndex / LEAN_REFERENCE,
    1.5,
  );
  const fat: number =
    (composition.subcutaneousFat.upperArmFront +
      composition.subcutaneousFat.upperArmBack) /
    2;
  const reference: number =
    (AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT.upperArmFront +
      AUTOMOVIE_HUMAN_REFERENCE_LIMB_FAT.upperArmBack) /
    2;
  const border: number = Math.hypot(FASCIA, BLUR_PER_FAT * fat);
  const tabulated: number = Math.hypot(FASCIA, BLUR_PER_FAT * reference);
  const smooth = (x: number): number => {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  };
  // a box of half-width h with borders rounded by b, across distance y
  const box = (y: number, h: number, b: number): number =>
    (erfAutoMovieHuman((h - y) / (Math.SQRT2 * b)) +
      erfAutoMovieHuman((h + y) / (Math.SQRT2 * b))) /
    2;
  const top: number = Math.min(...FORMS.map((f) => f.from)) * insertion;
  const bottom: number = Math.max(...FORMS.map((f) => f.to)) * insertion;
  return (position: IAutoMovieVector3): number => {
    const d: IAutoMovieVector3 = V.offset(position, [origin, -1]);
    const a: number = V.dot(d, axis);
    if (a < top - 3 * border || a > bottom + 3 * border) return 0;
    const radial: IAutoMovieVector3 = V.offset(d, [axis, -a]);
    const rho: number = Math.hypot(radial.x, radial.y, radial.z);
    if (rho < 1) return 0;
    const angle: number =
      (Math.atan2(V.dot(radial, lateral), V.dot(radial, anterior)) * 180) /
      Math.PI;
    let sum: number = 0;
    for (const f of FORMS) {
      const a0: number = f.from * insertion;
      const a1: number = f.to * insertion;
      const t: number = (a - a0) / (a1 - a0);
      const ramp: number = 0.2;
      const along: number = smooth(t / ramp) * smooth((1 - t) / ramp);
      if (along === 0) continue;
      const crest: number =
        f.angles[0] + (f.angles[1] - f.angles[0]) * Math.min(1, Math.max(0, t));
      let delta: number = angle - crest;
      delta -= 360 * Math.round(delta / 360);
      const y: number = (Math.abs(delta) * Math.PI * rho) / 180;
      // the area across is kept: seen through the reference fat the crest is the tabulated depth
      sum +=
        ((f.depth * muscle) / box(0, f.half, tabulated)) *
        box(y, f.half, border) *
        along;
    }
    return sum;
  };
}
