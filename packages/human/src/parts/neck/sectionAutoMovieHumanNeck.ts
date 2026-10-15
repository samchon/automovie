import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanCageBuilder } from "../../junction/AutoMovieHumanCageBuilder";
import { IAutoMovieHumanRingLayout } from "../../junction/IAutoMovieHumanRingLayout";
import { IAutoMovieHumanLandmarks } from "../../measure/IAutoMovieHumanLandmarks";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";

/**
 * Perimeter of the neck's base over the neck circumference: the neck flares into the trapezius and the sternocleidomastoid heads at its root. Conventional, the trunk's value for the same ring, since ANSUR II measures a neck base circumference this identity does not carry.
 */
const BASE_FLARE: number = 1.08;

/**
 * Proportions of the mid section, half-width to front and back depth from the bone axis. Conventional: the neck is close to round, flattened in front over the trachea, whose prominence is added separately.
 */
const MID_SHAPE = { across: 1, front: 0.9, back: 1 };

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
 * The neck's three defining sections, each as twelve points in build order, and the rule that places each junction ring.
 *
 * - Base: the trunk's rule for the same ring, an ellipse in the oblique plane through the jugular notch and cervicale, its lateral semi-axis solved so its perimeter is the neck circumference widened to the base.
 * - Mid: perpendicular to the neck bone at cervicale's level, where the circumference is measured just below the thyroid cartilage; an egg of exactly the neck circumference, with the sternocleidomastoids at its anterolateral corners and the laryngeal prominence in front. The prominence is the forward reach of the thyroid notch, `w cos(θ/2)` for laminae of width `w` meeting at angle `θ` (Rawal et al. 2014), beyond the reach at the angle where it lies flush.
 * - Top: the mandibular plane's outline, the union of the mandible's lower border, a parabola from menton to both gonia, and the neck's column under the skull, smoothly joined.
 *
 * @param props Skeleton, body and head measurements and the neck's two ring layouts
 * @returns The sections and the ring rule
 */
export function sectionAutoMovieHumanNeck(props: {
  skeleton: IAutoMovieHumanSkeleton;
  body: IAutoMovieHumanIdentity.IBody;
  head: IAutoMovieHumanIdentity.IHead;
  base: IAutoMovieHumanRingLayout;
  top: IAutoMovieHumanRingLayout;
}): sectionAutoMovieHumanNeck.IOutput {
  const landmarks: IAutoMovieHumanLandmarks = props.skeleton.landmarks;
  const joint = (bone: string): IAutoMovieVector3 =>
    props.skeleton.joints.find((j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone)!.position;
  const lower: IAutoMovieVector3 = joint("neck");
  const upper: IAutoMovieVector3 = joint("head");
  const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(AutoMovieHumanVector.offset(upper, [lower, -1]));
  const girth: number = props.body.neckCircumference;
  const mean: number = girth / (2 * Math.PI);

  // base: the trunk's ellipse through the notch and cervicale
  const bo: IAutoMovieVector3 = props.base.frame.origin;
  const anterior: number = AutoMovieHumanVector.distance(landmarks.suprasternale.position, bo);
  const posterior: number = AutoMovieHumanVector.distance(landmarks.cervicale.position, bo);
  const sagittal: number = (anterior + posterior) / 2;
  const lateral: number = solve(
    (b: number): number => ramanujan(sagittal, b) - BASE_FLARE * girth,
    1,
    10 * sagittal,
  );

  // top: the jaw's parabola and the neck column in the mandibular plane
  const to: IAutoMovieVector3 = props.top.frame.origin;
  const ref: IAutoMovieVector3 = props.top.frame.reference;
  const inPlane = (p: IAutoMovieVector3): [number, number] => {
    const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [to, -1]);
    const w: number = AutoMovieHumanVector.dot(d, ref);
    const off: IAutoMovieVector3 = AutoMovieHumanVector.offset(d, [ref, -w], [props.top.frame.normal, -AutoMovieHumanVector.dot(d, props.top.frame.normal)]);
    return [Math.hypot(off.x, off.y, off.z), w];
  };
  const [, chin] = inPlane(landmarks.menton.position);
  const [jawU, jawW] = inPlane(landmarks.left.gonion.position);
  const tilt: number = Math.abs(AutoMovieHumanVector.dot(props.top.frame.normal, axis));
  const column = { across: 0.9 * mean, front: 0.76 * mean, back: (0.95 * mean) / Math.max(0.5, tilt) };

  const radius = (layout: IAutoMovieHumanRingLayout, d: IAutoMovieVector3): number => {
    const c: number = AutoMovieHumanVector.dot(d, layout.frame.reference);
    const s: number = Math.sqrt(Math.max(0, 1 - c * c));
    if (layout.site === "neckBase") {
      const a: number = c >= 0 ? anterior : posterior;
      return 1 / Math.sqrt((c * c) / (a * a) + (s * s) / (lateral * lateral));
    }
    const k: number = (chin - jawW) / (jawU * jawU);
    const jaw: number =
      s < 1e-9
        ? c > 0
          ? chin / c
          : 0
        : (-c + Math.sqrt(c * c + 4 * s * s * k * chin)) / (2 * s * s * k);
    const reach: number = jaw * c >= jawW ? jaw : 0;
    const neck: number = 1 / Math.sqrt((c * c) / (c >= 0 ? column.front : column.back) ** 2 + (s * s) / column.across ** 2);
    return smoothMax(reach, neck, 0.15 * mean);
  };

  // mid section, perpendicular to the neck bone at cervicale's level
  const reference: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 1), [axis, -axis.z]),
  );
  const directions: IAutoMovieVector3[] = AutoMovieHumanCageBuilder.turn(axis, reference, props.base.count);
  const egg = (scale: number, angle: number): number => {
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    const depth: number = scale * (c >= 0 ? MID_SHAPE.front : MID_SHAPE.back);
    return 1 / Math.sqrt((c * c) / (depth * depth) + (s * s) / (scale * MID_SHAPE.across) ** 2);
  };
  const perimeter = (scale: number): number => {
    let sum: number = 0;
    const steps: number = 360;
    let prev: [number, number] = [egg(scale, 0), 0];
    for (let i: number = 1; i <= steps; ++i) {
      const angle: number = (2 * Math.PI * i) / steps;
      const r: number = egg(scale, angle);
      const point: [number, number] = [r * Math.cos(angle), r * Math.sin(angle)];
      sum += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
      prev = point;
    }
    return sum;
  };
  const scale: number = solve((x: number): number => perimeter(x) - girth, 1, 4 * mean);
  const lamina: number = LAMINA_PER_NECK * girth;
  const half = (deg: number): number => Math.cos((deg * Math.PI) / 360);
  const prominence: number = Math.max(0, lamina * (half(props.body.thyroidAngle) - half(FLUSH_ANGLE)));
  const mid: IAutoMovieVector3[] = directions.map((d: IAutoMovieVector3, k: number): IAutoMovieVector3 => {
    const angle: number = (2 * Math.PI * k) / directions.length;
    // the sternocleidomastoids cross the mid section at its anterolateral corners, a sixth of a turn from the front
    const scm: number =
      Math.abs(Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) - Math.PI / 3) < 1e-6
        ? STERNOCLEIDOMASTOID * mean
        : 0;
    const r: number = egg(scale, angle) + scm + (k === 0 ? prominence : 0);
    return AutoMovieHumanVector.offset(lower, [d, r]);
  });
  const ring = (layout: IAutoMovieHumanRingLayout): IAutoMovieVector3[] =>
    AutoMovieHumanCageBuilder.buildDirections(layout).map((d: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieHumanVector.offset(layout.frame.origin, [d, radius(layout, d)]),
    );
  return { axis, base: ring(props.base), mid, top: ring(props.top), radius };
}
export namespace sectionAutoMovieHumanNeck {
  /**
   * The neck's sections.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Unit direction of the neck bone, from the neck joint to the head joint. */
    axis: IAutoMovieVector3;

    /** The base ring's points in build order. */
    base: IAutoMovieVector3[];

    /** The mid section's points in build order. */
    mid: IAutoMovieVector3[];

    /** The top ring's points in build order. */
    top: IAutoMovieVector3[];

    /** Distance of a ring vertex from its ring's origin along its direction. */
    radius: (layout: IAutoMovieHumanRingLayout, direction: IAutoMovieVector3) => number;
  }
}

const ramanujan = (a: number, b: number): number =>
  Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

/** Polynomial smooth maximum (Quilez). */
const smoothMax = (a: number, b: number, k: number): number => {
  const h: number = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + (h * h * k) / 4;
};

const solve = (f: (x: number) => number, lo: number, hi: number): number => {
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
