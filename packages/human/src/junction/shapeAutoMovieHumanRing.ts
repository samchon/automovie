import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_EAR_ATTACHMENT } from "./AUTOMOVIE_HUMAN_EAR_ATTACHMENT";
import { AUTOMOVIE_HUMAN_NECK_COLUMN } from "./AUTOMOVIE_HUMAN_NECK_COLUMN";
import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";
import { layoutAutoMovieHumanRing } from "./layoutAutoMovieHumanRing";

/**
 * Resolve the boundary one part opens at one junction site: the frame and directions of `layoutAutoMovieHumanRing` and the distance of every ring vertex, from the site's own measurements.
 *
 * Both parts of a site call this with the same person and get the same points, so they meet without either adapting to the other and the junction welds coincident vertices. Each site's section:
 *
 * - `neckBase`: an ellipse in the oblique cut through the jugular notch and cervicale, reaching each in front and behind, its lateral semi-axis solved so its perimeter is the neck circumference widened by {@link NECK_BASE_FLARE}.
 * - `neckTop`: in the mandibular plane, the larger of the jaw and the neck column, blended by a smooth maximum. The jaw is the parabola through menton and both gonia; the column an egg of the neck circumference's mean radius, {@link AUTOMOVIE_HUMAN_NECK_COLUMN} times it across, in front and behind, the back lengthened by the plane's tilt to the neck so it still reaches the nape.
 * - `upperArm`: a circle of the upper arm circumference, which is measured at this cut. Conventional: the mid upper arm is nearly round, and no depth-to-breadth ratio was read.
 * - `wrist`: an ellipse of the wrist circumference measured at this cut, its radio-ulnar breadth and palmar-dorsal depth in the proportions of {@link WRIST}.
 * - `thigh`: a circle of the girth at mid thigh, on the thigh's girth curve between the thigh circumference at the gluteal furrow and the lower thigh circumference at suprapatella ({@link THIGH}).
 * - `ankle`: a circle of the ankle circumference, the minimum girth above the malleoli, measured at this cut. Conventional shape.
 * - `ear`: the attachment of the auricle, an ellipse in the plane of the head's side whose long axis leans back from the vertical by {@link AUTOMOVIE_HUMAN_EAR_ATTACHMENT.inclination}; its centre and semi-axes are fractions of the ear's length and breadth ({@link AUTOMOVIE_HUMAN_EAR_ATTACHMENT}). The origin moves from tragion to the ellipse's centre, so the eight directions spread evenly round the attachment.
 *
 * @param props.skeleton The person's skeleton at rest
 * @param props.measurements The person's resolved measurements
 * @param props.site The junction site
 * @param props.side Side of a bilateral site, null for the neck sites
 * @param props.part The part opening the ring, the site's proximal or distal part
 * @returns The ring's layout with every vertex's radius and position
 * @throws {Error} When `layoutAutoMovieHumanRing` refuses the site, side or part
 */
export const shapeAutoMovieHumanRing = (props: {
  skeleton: IAutoMovieHumanSkeleton;
  measurements: IAutoMovieHumanMeasurements;
  site: AutoMovieHumanJunctionSite;
  side: AutoMovieHumanSide | null;
  part: AutoMovieHumanPart;
}): IAutoMovieHumanRingShape => {
  const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing(props);
  const { origin, radius } = section(props, layout);
  const radii: number[] = layout.directions.map(radius);
  return {
    ...layout,
    frame: { ...layout.frame, origin },
    radii,
    positions: layout.directions.map(
      (d: IAutoMovieVector3, k: number): IAutoMovieVector3 =>
        AutoMovieHumanVector.offset(origin, [d, radii[k]!]),
    ),
  };
};

/**
 * Perimeter of the neck's base over the neck circumference: the neck flares into the trapezius and the sternocleidomastoid heads at its root. Conventional, since ANSUR II measures a neck base circumference the identity does not carry.
 */
const NECK_BASE_FLARE: number = 1.08;

/**
 * The wrist section at the stylion cut: its breadth over the wrist circumference (Greiner 1991, US Army hand anthropometry: 57.0 of 151.4 mm in women and 65.8 of 174.3 in men) and its depth over its breadth, the other axis of the ellipse with that breadth and circumference (0.675 and 0.670). Grade: measured breadth, derived depth.
 */
const WRIST = { breadth: 0.377, depth: 0.673 } as const;

/**
 * Levels of the thigh's girth curve. The gluteal furrow, where the thigh circumference is measured, lies `furrow` of the hip-to-knee length below the hip joint centre (the 1977 US child survey's furrow heights, Snyder et al. 1977, UM-HSRI-77-17, against ANSUR II's hip and knee centres, Gordon et al. 2014, NATICK/TR-15/007; derived, from adolescents). Suprapatella, where the lower thigh circumference is measured, lies `suprapatella` of the thigh length above the midpatella (half an adult patella's height and the soft tissue above it; conventional). Between them the girth is the lower thigh girth plus the share `t^exponent` of its difference to the furrow girth, `t` the level's fraction of the way from suprapatella to the furrow, fuller than a cone as the thigh's muscle sits high (conventional).
 */
const THIGH = {
  furrow: 0.21,
  suprapatella: 0.06,
  exponent: 0.8,
} as const;

const section = (
  props: {
    skeleton: IAutoMovieHumanSkeleton;
    measurements: IAutoMovieHumanMeasurements;
    side: AutoMovieHumanSide | null;
  },
  layout: IAutoMovieHumanRingLayout,
): { origin: IAutoMovieVector3; radius: (d: IAutoMovieVector3) => number } => {
  const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
  const landmarks = props.skeleton.landmarks;
  const joint = (bone: string): IAutoMovieVector3 =>
    props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
    )!.position;
  const origin: IAutoMovieVector3 = layout.frame.origin;
  const reference: IAutoMovieVector3 = layout.frame.reference;
  const across = (d: IAutoMovieVector3): [number, number] => {
    const c: number = AutoMovieHumanVector.dot(d, reference);
    return [c, Math.sqrt(Math.max(0, 1 - c * c))];
  };
  const circle = (girth: number) => ({
    origin,
    radius: (): number => girth / (2 * Math.PI),
  });
  const arm: IAutoMovieHumanIdentity.IArm =
    props.side === "right" ? body.rightArm : body.leftArm;
  const leg: IAutoMovieHumanIdentity.ILeg =
    props.side === "right" ? body.rightLeg : body.leftLeg;
  const prefix: string = props.side ?? "";
  switch (layout.site) {
    case "neckBase": {
      const anterior: number = AutoMovieHumanVector.distance(
        landmarks.suprasternale.position,
        origin,
      );
      const posterior: number = AutoMovieHumanVector.distance(
        landmarks.cervicale.position,
        origin,
      );
      const sagittal: number = (anterior + posterior) / 2;
      const lateral: number = solve(
        (b: number): number =>
          ramanujan(sagittal, b) - NECK_BASE_FLARE * body.neckCircumference,
        1,
        10 * sagittal,
      );
      return {
        origin,
        radius: (d: IAutoMovieVector3): number => {
          const [c, s] = across(d);
          const a: number = c >= 0 ? anterior : posterior;
          return (
            1 / Math.sqrt((c * c) / (a * a) + (s * s) / (lateral * lateral))
          );
        },
      };
    }
    case "neckTop": {
      const mean: number = body.neckCircumference / (2 * Math.PI);
      const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
        AutoMovieHumanVector.offset(joint("head"), [joint("neck"), -1]),
      );
      const normal: IAutoMovieVector3 = layout.frame.normal;
      const inPlane = (p: IAutoMovieVector3): [number, number] => {
        const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [
          origin,
          -1,
        ]);
        const w: number = AutoMovieHumanVector.dot(d, reference);
        const off: IAutoMovieVector3 = AutoMovieHumanVector.offset(
          d,
          [reference, -w],
          [normal, -AutoMovieHumanVector.dot(d, normal)],
        );
        return [Math.hypot(off.x, off.y, off.z), w];
      };
      const [, chin] = inPlane(landmarks.menton.position);
      const [jawU, jawW] = inPlane(landmarks.left.gonion.position);
      const tilt: number = Math.abs(AutoMovieHumanVector.dot(normal, axis));
      const column = {
        across: AUTOMOVIE_HUMAN_NECK_COLUMN.across * mean,
        front: AUTOMOVIE_HUMAN_NECK_COLUMN.front * mean,
        back: (AUTOMOVIE_HUMAN_NECK_COLUMN.back * mean) / Math.max(0.5, tilt),
      };
      const k: number = (chin - jawW) / (jawU * jawU);
      return {
        origin,
        radius: (d: IAutoMovieVector3): number => {
          const [c, s] = across(d);
          const jaw: number =
            s < 1e-9
              ? c > 0
                ? chin / c
                : 0
              : (-c + Math.sqrt(c * c + 4 * s * s * k * chin)) /
                (2 * s * s * k);
          const reach: number = jaw * c >= jawW ? jaw : 0;
          const neck: number =
            1 /
            Math.sqrt(
              (c * c) / (c >= 0 ? column.front : column.back) ** 2 +
                (s * s) / column.across ** 2,
            );
          return smoothMax(reach, neck, AUTOMOVIE_HUMAN_NECK_COLUMN.blend * mean);
        },
      };
    }
    case "upperArm":
      return circle(arm.upperArmCircumference);
    case "wrist": {
      const breadth: number = (WRIST.breadth * arm.wristCircumference) / 2;
      const depth: number = breadth * WRIST.depth;
      return {
        origin,
        radius: (d: IAutoMovieVector3): number => {
          const [c, s] = across(d);
          return (breadth * depth) / Math.hypot(breadth * c, depth * s);
        },
      };
    }
    case "thigh": {
      const hip: IAutoMovieVector3 = joint(`${prefix}UpperLeg`);
      const knee: IAutoMovieVector3 = joint(`${prefix}LowerLeg`);
      const length: number = AutoMovieHumanVector.distance(hip, knee);
      const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
        AutoMovieHumanVector.offset(knee, [hip, -1]),
      );
      const along = (p: IAutoMovieVector3): number =>
        AutoMovieHumanVector.dot(
          AutoMovieHumanVector.offset(p, [hip, -1]),
          axis,
        );
      const patella: IAutoMovieVector3 = (
        props.side === "right" ? landmarks.right : landmarks.left
      ).patella.position;
      const furrow: number = THIGH.furrow * length;
      const suprapatella: number =
        along(patella) - THIGH.suprapatella * leg.thighLength;
      const t: number = Math.min(
        1,
        Math.max(0, (suprapatella - along(origin)) / (suprapatella - furrow)),
      );
      return circle(
        leg.lowerThighCircumference +
          (leg.thighCircumference - leg.lowerThighCircumference) *
            Math.pow(t, THIGH.exponent),
      );
    }
    case "ankle":
      return circle(leg.ankleCircumference);
    case "ear": {
      const ear: IAutoMovieHumanIdentity.IEar =
        props.side === "right"
          ? props.measurements.identity.head.rightEar
          : props.measurements.identity.head.leftEar;
      const up: IAutoMovieVector3 = AutoMovieHumanVector.of(
        0,
        Math.cos(AUTOMOVIE_HUMAN_EAR_ATTACHMENT.inclination),
        -Math.sin(AUTOMOVIE_HUMAN_EAR_ATTACHMENT.inclination),
      );
      const back: IAutoMovieVector3 = AutoMovieHumanVector.of(
        0,
        -Math.sin(AUTOMOVIE_HUMAN_EAR_ATTACHMENT.inclination),
        -Math.cos(AUTOMOVIE_HUMAN_EAR_ATTACHMENT.inclination),
      );
      const a: number = AUTOMOVIE_HUMAN_EAR_ATTACHMENT.along * ear.earLength;
      const b: number = AUTOMOVIE_HUMAN_EAR_ATTACHMENT.across * ear.earBreadth;
      return {
        origin: AutoMovieHumanVector.offset(
          origin,
          [back, AUTOMOVIE_HUMAN_EAR_ATTACHMENT.back * ear.earBreadth],
          [up, -AUTOMOVIE_HUMAN_EAR_ATTACHMENT.down * ear.earLength],
        ),
        radius: (d: IAutoMovieVector3): number => {
          const c: number = AutoMovieHumanVector.dot(d, up);
          const s: number = AutoMovieHumanVector.dot(d, back);
          return 1 / Math.sqrt((c * c) / (a * a) + (s * s) / (b * b));
        },
      };
    }
  }
};

/** Ramanujan's perimeter of an ellipse with semi-axes `a` and `b`. */
const ramanujan = (a: number, b: number): number =>
  Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

/** Polynomial smooth maximum (Quilez). */
const smoothMax = (a: number, b: number, k: number): number => {
  const h: number = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + (h * h * k) / 4;
};

/** Root of a monotone function by bisection. */
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
