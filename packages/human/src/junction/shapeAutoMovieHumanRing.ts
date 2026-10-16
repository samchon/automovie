import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_ANKLE_SECTION } from "./AUTOMOVIE_HUMAN_ANKLE_SECTION";
import { AUTOMOVIE_HUMAN_EAR_ATTACHMENT } from "./AUTOMOVIE_HUMAN_EAR_ATTACHMENT";
import { AUTOMOVIE_HUMAN_NECK_BASE_FLARE } from "./AUTOMOVIE_HUMAN_NECK_BASE_FLARE";
import { AUTOMOVIE_HUMAN_NECK_COLUMN } from "./AUTOMOVIE_HUMAN_NECK_COLUMN";
import { AUTOMOVIE_HUMAN_THIGH_GIRTH } from "./AUTOMOVIE_HUMAN_THIGH_GIRTH";
import { AUTOMOVIE_HUMAN_UPPER_ARM_SECTION } from "./AUTOMOVIE_HUMAN_UPPER_ARM_SECTION";
import { AUTOMOVIE_HUMAN_WRIST_SECTION } from "./AUTOMOVIE_HUMAN_WRIST_SECTION";
import { AutoMovieHumanJunctionSite } from "./AutoMovieHumanJunctionSite";
import { AutoMovieHumanPart } from "./AutoMovieHumanPart";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";
import { layoutAutoMovieHumanRing } from "./layoutAutoMovieHumanRing";
import { shapeAutoMovieHumanRadialSection } from "./shapeAutoMovieHumanRadialSection";

/**
 * Resolve the boundary one part opens at one junction site: the frame and directions of `layoutAutoMovieHumanRing` and the distance of every ring vertex, from the site's own measurements.
 *
 * Both parts of a site call this with the same person and get the same points, so they meet without either adapting to the other and the junction welds coincident vertices. The points are control points, not the section itself: the Catmull-Clark limit of a ring lies inside it, about 10% inside for eight vertices, so the control radius of each ray is solved from the ring's limit stencil (`AutoMovieHumanRingCurve.unstencil`) to put the limit curve on the section along that ray, and all radii are then scaled together so the limit curve's length is the site's girth, measured where the site has one and the section's own perimeter where not (`neckTop`, `ear`).
 *
 * Each site's section:
 *
 * - `neckBase`: an ellipse in the oblique cut through the jugular notch and cervicale, reaching each in front and behind, its lateral semi-axis solved so its perimeter is the neck circumference widened by {@link AUTOMOVIE_HUMAN_NECK_BASE_FLARE}.
 * - `neckTop`: a simple neck-column section perpendicular to the neck axis, below the mandible; its dimensions retain {@link AUTOMOVIE_HUMAN_NECK_COLUMN}, without the jaw outline.
 * - `upperArm`: the upper arm circumference, which is measured at this cut with the arm hanging and converted to the abducted rest pose, in four quarter ellipses about the bone axis, deeper than broad over the biceps and triceps and flattest laterally ({@link AUTOMOVIE_HUMAN_UPPER_ARM_SECTION}).
 * - `wrist`: an ellipse of the wrist circumference measured at this cut, its radio-ulnar breadth and palmar-dorsal depth in the proportions of {@link AUTOMOVIE_HUMAN_WRIST_SECTION}.
 * - `thigh`: the girth at mid thigh, on the thigh's girth curve between the thigh circumference at the gluteal furrow and the lower thigh circumference at suprapatella, in four quarter ellipses about the hip-to-knee axis, full in front and medially and flat behind and laterally ({@link AUTOMOVIE_HUMAN_THIGH_GIRTH}).
 * - `ankle`: an ellipse of the ankle circumference, the minimum girth above the malleoli, deeper than broad by {@link AUTOMOVIE_HUMAN_ANKLE_SECTION}; its own limit-curve perimeter sets the girth.
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
export const shapeAutoMovieHumanRing: (props: { skeleton: IAutoMovieHumanSkeleton; measurements: IAutoMovieHumanMeasurements; site: AutoMovieHumanJunctionSite; side: AutoMovieHumanSide | null; part: AutoMovieHumanPart; }) => IAutoMovieHumanRingShape = (props: {
  skeleton: IAutoMovieHumanSkeleton;
  measurements: IAutoMovieHumanMeasurements;
  site: AutoMovieHumanJunctionSite;
  side: AutoMovieHumanSide | null;
  part: AutoMovieHumanPart;
}): IAutoMovieHumanRingShape => {
  const neckBase: IAutoMovieHumanRingShape | undefined = props.site === "neckTop"
    ? shapeAutoMovieHumanRing({...props, site: "neckBase", part: "neck"}) : undefined;
  const layout: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({...props, neckBase});
  const { origin, radius, girth }: { origin: IAutoMovieVector3; radius: (d: IAutoMovieVector3) => number; girth: number | null; } = section(props, layout);
  return shapeAutoMovieHumanRadialSection(layout, { origin, radius, girth });
};

const section: (props: { skeleton: IAutoMovieHumanSkeleton; measurements: IAutoMovieHumanMeasurements; side: AutoMovieHumanSide | null; }, layout: IAutoMovieHumanRingLayout) => { origin: IAutoMovieVector3; radius: (d: IAutoMovieVector3) => number; girth: number | null; } = (
  props: {
    skeleton: IAutoMovieHumanSkeleton;
    measurements: IAutoMovieHumanMeasurements;
    side: AutoMovieHumanSide | null;
  },
  layout: IAutoMovieHumanRingLayout,
): {
  origin: IAutoMovieVector3;
  radius: (d: IAutoMovieVector3) => number;
  girth: number | null;
} => {
  const body: IAutoMovieHumanIdentity.IBody = props.measurements.identity.body;
  const landmarks: IAutoMovieHumanLandmarks = props.skeleton.landmarks;
  const joint: (bone: string) => IAutoMovieVector3 = (bone: string): IAutoMovieVector3 =>
    props.skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
    )!.position;
  const origin: IAutoMovieVector3 = layout.frame.origin;
  const reference: IAutoMovieVector3 = layout.frame.reference;
  const across: (d: IAutoMovieVector3) => [number, number] = (d: IAutoMovieVector3): [number, number] => {
    const c: number = AutoMovieHumanVector.dot(d, reference);
    return [c, Math.sqrt(Math.max(0, 1 - c * c))];
  };
  // four quarter ellipses about the cut origin, half axes in mean radii toward the front, back, medial and lateral sides; the ring is scaled to its girth afterwards
  const quarters: (girth: number, half: { front: number; back: number; medial: number; lateral: number; }, toward: IAutoMovieVector3) => { origin: IAutoMovieVector3; radius: (d: IAutoMovieVector3) => number; girth: number; } = (
    girth: number,
    half: { front: number; back: number; medial: number; lateral: number },
    toward: IAutoMovieVector3,
  ): { origin: IAutoMovieVector3; radius: (d: IAutoMovieVector3) => number; girth: number; } => {
    const medial: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
      AutoMovieHumanVector.offset(toward, [
        layout.frame.normal,
        -AutoMovieHumanVector.dot(toward, layout.frame.normal),
      ]),
    );
    return {
      origin,
      radius: (d: IAutoMovieVector3): number => {
        const c: number = AutoMovieHumanVector.dot(d, reference);
        const s: number = AutoMovieHumanVector.dot(d, medial);
        const a: number = c >= 0 ? half.front : half.back;
        const b: number = s >= 0 ? half.medial : half.lateral;
        return 1 / Math.sqrt((c * c) / (a * a) + (s * s) / (b * b));
      },
      girth,
    };
  };
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
          ramanujan(sagittal, b) -
          AUTOMOVIE_HUMAN_NECK_BASE_FLARE * body.neckCircumference,
        1,
        10 * sagittal,
      );
      return {
        origin,
        radius: (d: IAutoMovieVector3): number => {
          const [c, s]: [number, number] = across(d);
          const a: number = c >= 0 ? anterior : posterior;
          return (
            1 / Math.sqrt((c * c) / (a * a) + (s * s) / (lateral * lateral))
          );
        },
        girth: AUTOMOVIE_HUMAN_NECK_BASE_FLARE * body.neckCircumference,
      };
    }
    case "neckTop": {
      const mean: number = body.neckCircumference / (2 * Math.PI);
      return {
        origin,
        radius: (d: IAutoMovieVector3): number => {
          const [c, s]: [number, number] = across(d);
          const depth: number =
            (c >= 0
              ? AUTOMOVIE_HUMAN_NECK_COLUMN.front
              : AUTOMOVIE_HUMAN_NECK_COLUMN.back) * mean;
          const breadth: number = AUTOMOVIE_HUMAN_NECK_COLUMN.across * mean;
          return (
            1 /
            Math.sqrt((c * c) / (depth * depth) + (s * s) / (breadth * breadth))
          );
        },
        girth: null,
      };
    }
    case "upperArm":
      // anatomically medial is the side toward the trunk, below the abducted arm in the rest pose
      return quarters(
        arm.upperArmCircumference * AUTOMOVIE_HUMAN_UPPER_ARM_SECTION.abducted,
        AUTOMOVIE_HUMAN_UPPER_ARM_SECTION,
        AutoMovieHumanVector.of(0, -1, 0),
      );
    case "wrist": {
      const breadth: number =
        (AUTOMOVIE_HUMAN_WRIST_SECTION.breadth * arm.wristCircumference) / 2;
      const depth: number = breadth * AUTOMOVIE_HUMAN_WRIST_SECTION.depth;
      return {
        origin,
        radius: (d: IAutoMovieVector3): number => {
          const [c, s]: [number, number] = across(d);
          return (breadth * depth) / Math.hypot(breadth * c, depth * s);
        },
        girth: arm.wristCircumference,
      };
    }
    case "thigh": {
      const hip: IAutoMovieVector3 = joint(`${prefix}UpperLeg`);
      const knee: IAutoMovieVector3 = joint(`${prefix}LowerLeg`);
      const length: number = AutoMovieHumanVector.distance(hip, knee);
      const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
        AutoMovieHumanVector.offset(knee, [hip, -1]),
      );
      const along: (p: IAutoMovieVector3) => number = (p: IAutoMovieVector3): number =>
        AutoMovieHumanVector.dot(
          AutoMovieHumanVector.offset(p, [hip, -1]),
          axis,
        );
      const patella: IAutoMovieVector3 = (
        props.side === "right" ? landmarks.right : landmarks.left
      ).patella.position;
      const furrow: number = AUTOMOVIE_HUMAN_THIGH_GIRTH.furrow * length;
      const suprapatella: number =
        along(patella) -
        AUTOMOVIE_HUMAN_THIGH_GIRTH.suprapatella * leg.thighLength;
      const t: number = Math.min(
        1,
        Math.max(0, (suprapatella - along(origin)) / (suprapatella - furrow)),
      );
      return quarters(
        leg.lowerThighCircumference +
          (leg.thighCircumference - leg.lowerThighCircumference) *
            Math.pow(t, AUTOMOVIE_HUMAN_THIGH_GIRTH.exponent),
        AUTOMOVIE_HUMAN_THIGH_GIRTH.section,
        AutoMovieHumanVector.of(props.side === "right" ? 1 : -1, 0, 0),
      );
    }
    case "ankle":
      return quarters(
        leg.ankleCircumference,
        {
          front: AUTOMOVIE_HUMAN_ANKLE_SECTION.depthOverBreadth,
          back: AUTOMOVIE_HUMAN_ANKLE_SECTION.depthOverBreadth,
          medial: 1,
          lateral: 1,
        },
        AutoMovieHumanVector.of(props.side === "right" ? 1 : -1, 0, 0),
      );
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
        girth: null,
      };
    }
  }
};

/** Ramanujan's perimeter of an ellipse with semi-axes `a` and `b`. */
const ramanujan: (a: number, b: number) => number = (a: number, b: number): number =>
  Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));

/** Root of a monotone function by bisection. */
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
