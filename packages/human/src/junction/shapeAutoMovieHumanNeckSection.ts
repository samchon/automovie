import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanCageBuilder } from "./AutoMovieHumanCageBuilder";

/**
 * Breadth over depth of the mid section: 1.155, the median of reference mesh variants (young, old and child, three populations, both sexes; 1.00 to 1.49) sliced horizontally 0.08 head heights below menton. Grade: calibrated against those references, which only bound the shape; the depth itself follows cervicale and the circumference.
 */
const MID_BREADTH: number = 1.155;

/**
 * The mid section's back over the distance from the neck bone to cervicale: the nape above the seventh cervical spine lies in front of its prominence, in the nuchal hollow between the semispinalis masses. Calibrated against adult reference meshes' mid-neck sections with the shared harness. Grade: calibrated.
 */
const NAPE: number = 0.8;

/**
 * Thyroid lamina width over neck circumference: 37.0 mm in men and 31.9 mm in women (Rawal et al. 2014, Natl J Integr Res Med 5(3), cadaver larynges) over the converter's adult neck circumferences of 398 and 330 mm. Grade: derived.
 */
const LAMINA_PER_NECK: number = 0.095;

/**
 * Thyroid angle at which the laryngeal notch lies flush with the front of the neck: the female mean of Glikson et al. (2017, Laryngoscope 127(10):E354-E358), whose prominence does not show. Grade: derived, the stated assumption being that the female notch does not project beyond the neck's front.
 */
const FLUSH_ANGLE: number = 94.25;

/** Relief of each sternocleidomastoid at the anterolateral corners of the mid section, over its mean radius. Conventional. */
const STERNOCLEIDOMASTOID: number = 0.04;

/**
 * The existing cervicale-height circumference section, shared by its owner.
 *
 * Its egg shape and relief retain the original neck source coefficients.
 * Moving an ownership cut does not move this plane. Cervicale height remains
 * a geometric proxy, without clinical infrathyroid registration.
 *
 * @param props Shared skeleton, identity body and section sample count
 * @returns Physical section points and plane, model millimetres
 */
export function shapeAutoMovieHumanNeckSection(props: {
  skeleton: IAutoMovieHumanSkeleton;
  body: IAutoMovieHumanIdentity.IBody;
  count: number;
}): { axis: IAutoMovieVector3; centre: IAutoMovieVector3; points: IAutoMovieVector3[] } {
  const joint: (bone: string) => IAutoMovieVector3 = (bone: string): IAutoMovieVector3 =>
    props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
    )!.position;
  const lower: IAutoMovieVector3 = joint("neck");
  const upper: IAutoMovieVector3 = joint("head");
  const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(upper, [lower, -1]),
  );
  const girth: number = props.body.neckCircumference;
  const mean: number = girth / (2 * Math.PI);

  // mid section, perpendicular to the neck bone at cervicale's level
  const reference: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 1), [
      axis,
      -axis.z,
    ]),
  );
  const directions: IAutoMovieVector3[] = AutoMovieHumanCageBuilder.turn(
    axis,
    reference,
    props.count,
  );
  // the back reaches toward cervicale, which lies in this section; the front and the breadth follow from the circumference
  const nape: IAutoMovieVector3 = AutoMovieHumanVector.offset(
    props.skeleton.landmarks.cervicale.position,
    [lower, -1],
  );
  const back: number =
    NAPE *
    Math.hypot(
      ...((): [number, number, number] => {
        const along: number = AutoMovieHumanVector.dot(nape, axis);
        return [
          nape.x - along * axis.x,
          nape.y - along * axis.y,
          nape.z - along * axis.z,
        ];
      })(),
    );
  const egg: (front: number, angle: number) => number = (front: number, angle: number): number => {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    const depth: number = c >= 0 ? front : back;
    const across: number = (MID_BREADTH * (front + back)) / 2;
    return (
      1 / Math.sqrt((c * c) / (depth * depth) + (s * s) / (across * across))
    );
  };
  const perimeter: (scale: number) => number = (scale: number): number => {
    let sum: number = 0;
    const steps: number = 360;
    let prev: [number, number] = [egg(scale, 0), 0];
    for (let i: number = 1; i <= steps; ++i) {
      const angle: number = (2 * Math.PI * i) / steps;
      const r: number = egg(scale, angle);
      const point: [number, number] = [
        r * Math.cos(angle),
        r * Math.sin(angle),
      ];
      sum += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
      prev = point;
    }
    return sum;
  };
  const front: number = solve(
    (x: number): number => perimeter(x) - girth,
    1,
    4 * mean,
  );

  const lamina: number = LAMINA_PER_NECK * girth;
  const half: (deg: number) => number = (deg: number): number => Math.cos((deg * Math.PI) / 360);
  const prominence: number = Math.max(
    0,
    lamina * (half(props.body.thyroidAngle) - half(FLUSH_ANGLE)),
  );
  const mid: IAutoMovieVector3[] = directions.map(
    (d: IAutoMovieVector3, k: number): IAutoMovieVector3 => {
      const angle: number = (2 * Math.PI * k) / directions.length;
      // the sternocleidomastoids cross the mid section at its anterolateral corners, a sixth of a turn from the front
      const scm: number =
        Math.abs(
          Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) - Math.PI / 3,
        ) < 1e-6
          ? STERNOCLEIDOMASTOID * mean
          : 0;
      const r: number = egg(front, angle) + scm + (k === 0 ? prominence : 0);
      return AutoMovieHumanVector.offset(lower, [d, r]);
    },
  );
  return {axis, centre: lower, points: mid};
}

const solve: (f: (x: number) => number, lo: number, hi: number) => number = (f: (x: number) => number, lo: number, hi: number): number => {
  let a: number = lo;
  let b: number = hi;
  const fa: number = f(a);
  for (let i: number = 0; i < 60; ++i) {
    const m: number = (a + b) / 2;
    if (f(m) * fa > 0) a = m;
    else b = m;
  }
  return (a + b) / 2;
};
