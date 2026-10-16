import {
  IAutoMovieMesh,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieHumanRingLayout } from "../junction/IAutoMovieHumanRingLayout";
import { IAutoMovieHumanRingShape } from "../junction/IAutoMovieHumanRingShape";
import { layoutAutoMovieHumanRing } from "../junction/layoutAutoMovieHumanRing";
import { shapeAutoMovieHumanRing } from "../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { pigmentAutoMovieHumanSkin } from "./pigmentAutoMovieHumanSkin";
import { AUTOMOVIE_HUMAN_LIP_FORM } from "../junction/AUTOMOVIE_HUMAN_LIP_FORM";
import { frameAutoMovieHumanHead } from "../junction/frameAutoMovieHumanHead";
import { curveAutoMovieHumanLips } from "../junction/curveAutoMovieHumanLips";

/**
 * Give the skin regional linear albedo from its physical rest position and limit normal, independently of the published UV atlas.
 *
 * Regional weights use position and normal in the skeleton's model frame, so UV aliases with the same physical position and limit normal receive one color even when their UVs use different charts, wrap beyond a chart's rectangle, or are absent. The palmar, plantar and auricular fields are continuous across the former part and wrap cuts. The same fields tint the joined person and each part alone; no attribute averaging, neighborhood diffusion, or chart classification repairs their output. An intentional hard normal edge can change a normal-based field; the current joined skin has no normal discontinuity at its physical aliases.
 *
 * Palmar weight follows the outward normal toward each wrist frame's palmar reference. It is zero at and proximal to the wrist plane through stylion and grows over the wrist's mean radius, the identity's circumference divided by 2 pi. This makes the transition a physical distance that follows the local wrist size, rather than a chart fraction or a number of mesh edges. This width is a construction convention, not a measured pigment-boundary width. The wrist plane and palmar reference are the same ones the geometry uses through {@link layoutAutoMovieHumanRing}. Plantar weight follows the downward normal below half the smaller ankle height, with the existing 6 mm height transition. Auricular flush grows laterally from the shared attachment plane over the identity's ear protrusion and fades within the ear's length and breadth about that plane's center. These field shapes are conventional; no spatial pigment measurements were read.
 *
 * Regional albedos change the chromophores consumed by {@link pigmentAutoMovieHumanSkin}: palms and soles use one quarter of the body's melanin, lips seven tenths of its melanin and five times its haemoglobin, cheeks twice its haemoglobin and ears 1.6 times. These factors remain conventional. The fivefold difference in palmoplantar melanocyte density reported by Yamaguchi et al. (2004, J Cell Biol 165(2):275-285, DOI 10.1083/jcb.200311122) measures cells, not melanin fraction, and does not calibrate the quarter factor or any transition width.
 *
 * Lip pigmentation follows the same head-frame vermilion border as the generated mouth loops, rather than a separate fixed-size ellipse. Cheeks retain their physical landmark fields. Vertex colors are absolute linear albedo over the skin material's white base color; posed geometry carries the rest albedo with it.
 *
 * @param props.parts The generated skin parts in metres, with limit normals
 * @param props.measurements Resolved measurements, for pigmentation and regional scales
 * @param props.skeleton The skeleton at rest, for landmarks and shared junction frames
 * @returns The parts with per-vertex colors; other parts are returned unchanged
 */
export function tintAutoMovieHumanSkin(props: {
  parts: readonly IAutoMovieModelPart[];
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
}): IAutoMovieModelPart[] {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const pigmentation: IAutoMovieHumanIdentity.IPigmentation =
    props.measurements.identity.pigmentation;
  const pigment: (melanin: number, haemoglobin: number) => number[] = (melanin: number, haemoglobin: number): number[] => {
    const c: ReturnType<typeof pigmentAutoMovieHumanSkin> =
      pigmentAutoMovieHumanSkin({
        melanin: Math.min(0.5, melanin),
        eumelaninShare: pigmentation.eumelaninShare,
        haemoglobin: Math.min(0.32, Math.max(0.001, haemoglobin)),
      });
    return [c.r, c.g, c.b];
  };
  const body: number[] = pigment(
    pigmentation.melanin,
    pigmentation.haemoglobin,
  );
  const regions: Record<Region, number[]> = {
    palm: pigment(0.25 * pigmentation.melanin, pigmentation.haemoglobin),
    lips: pigment(0.7 * pigmentation.melanin, 5 * pigmentation.haemoglobin),
    flush: pigment(pigmentation.melanin, 2 * pigmentation.haemoglobin),
    ear: pigment(pigmentation.melanin, 1.6 * pigmentation.haemoglobin),
  };
  const hands: Array<{ frame: IAutoMovieHumanRingLayout["frame"]; radius: number }> =
    [];
  const ears: Array<{
    ring: IAutoMovieHumanRingShape;
    ear: IAutoMovieHumanIdentity.IEar;
    across: IAutoMovieVector3;
  }> = [];
  for (const side of ["left", "right"] as const) {
    const wrist: IAutoMovieHumanRingLayout = layoutAutoMovieHumanRing({
      skeleton: props.skeleton,
      site: "wrist",
      side,
      part: "arm",
    });
    const arm: IAutoMovieHumanIdentity.IArm =
      side === "left"
        ? props.measurements.identity.body.leftArm
        : props.measurements.identity.body.rightArm;
    hands.push({ frame: wrist.frame, radius: arm.wristCircumference / (2 * Math.PI) });
    const ring: IAutoMovieHumanRingShape = shapeAutoMovieHumanRing({
      measurements: props.measurements,
      skeleton: props.skeleton,
      site: "ear",
      side,
      part: "head",
    });
    ears.push({
      ring,
      ear:
        side === "left"
          ? props.measurements.identity.head.leftEar
          : props.measurements.identity.head.rightEar,
      across: V.cross(ring.frame.normal, ring.frame.reference),
    });
  }
  const head: IAutoMovieHumanIdentity.IHead = props.measurements.identity.head;
  const k: number = head.faceHeight / 120;
  const stomion: IAutoMovieVector3 = props.skeleton.landmarks.stomion.position;
  const headFrame: frameAutoMovieHumanHead.IFrame = frameAutoMovieHumanHead(props.skeleton);
  const lips: curveAutoMovieHumanLips.ICurve = curveAutoMovieHumanLips({
    head, stomion: headFrame.stomion.y, form: AUTOMOVIE_HUMAN_LIP_FORM,
  });
  const ankle: number =
    0.5 * Math.min(
      props.measurements.identity.body.leftLeg.ankleHeight,
      props.measurements.identity.body.rightLeg.ankleHeight,
    );
  const cheeks: IAutoMovieVector3[] = (["left", "right"] as const).map(
    (side: "left" | "right"): IAutoMovieVector3 => {
      const z: IAutoMovieVector3 = props.skeleton.landmarks[side].zygion.position;
      return V.of(z.x * 0.72, z.y - 8 * k, z.z + 0.5 * (stomion.z - z.z));
    },
  );
  return props.parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
    if (part.geometry.type !== "mesh" || !part.id.startsWith("skin")) return part;
    const mesh: IAutoMovieMesh = part.geometry.mesh;
    const colors: number[] = [];
    for (let i: number = 0; i < mesh.positions.length / 3; ++i) {
      const position: IAutoMovieVector3 = V.of(
        mesh.positions[3 * i]! * 1000,
        mesh.positions[3 * i + 1]! * 1000,
        mesh.positions[3 * i + 2]! * 1000,
      );
      const normal: IAutoMovieVector3 =
        mesh.normals === null
          ? V.of(0, 0, 0)
          : V.of(mesh.normals[3 * i]!, mesh.normals[3 * i + 1]!, mesh.normals[3 * i + 2]!);
      const w: Record<Region, number> = {
        palm: smooth((-normal.y - 0.3) / 0.4) * smooth((ankle - position.y) / 6),
        lips: 0,
        flush: 0,
        ear: 0,
      };
      for (const hand of hands) {
        const d: IAutoMovieVector3 = V.offset(position, [hand.frame.origin, -1]);
        const along: number = V.dot(d, hand.frame.normal);
        const facing: number = V.dot(normal, hand.frame.reference);
        w.palm = Math.max(
          w.palm,
          smooth((facing - 0.05) / 0.6) * smooth(along / hand.radius),
        );
      }
      const face: IAutoMovieVector3 = frameAutoMovieHumanHead.toLocal(headFrame, position);
      // The same physical border as the lip loops, in the same head frame.
      // Its finite commissure allowance supplies the pigment-edge transition;
      // this is a conventional albedo fade, not a measured skin transition.
      if (Math.abs(face.x) < lips.halfWidth && face.z > headFrame.tragion.z) {
        const margin: number = AUTOMOVIE_HUMAN_LIP_FORM.commissure;
        w.lips = smooth((lips.border(face.x, true) - face.y) / margin) *
          smooth((face.y - lips.border(face.x, false)) / margin);
      }
      for (const cheek of cheeks) {
        const distance: number = V.distance(position, cheek) / (24 * k);
        w.flush = Math.max(w.flush, smooth(1.4 * (1 - distance * distance)));
      }
      for (const ear of ears) {
        const d: IAutoMovieVector3 = V.offset(position, [ear.ring.frame.origin, -1]);
        const outward: number = V.dot(d, ear.ring.frame.normal);
        const up: number = V.dot(d, ear.ring.frame.reference) / (ear.ear.earLength / 2);
        const across: number = V.dot(d, ear.across) / (ear.ear.earBreadth / 2);
        w.ear = Math.max(
          w.ear,
          smooth(outward / ear.ear.earProtrusion) * smooth(1 - up * up - across * across),
        );
      }
      for (let c: number = 0; c < 3; ++c) {
        let value: number = body[c]!;
        for (const region of REGIONS) value += w[region] * (regions[region][c]! - body[c]!);
        colors.push(Math.min(1, Math.max(0, value)));
      }
    }
    return { ...part, geometry: { type: "mesh", mesh: { ...mesh, colors } } };
  });
}

/** The pigment fields whose albedo differences are blended. */
type Region = "palm" | "lips" | "flush" | "ear";

/** Regions in their fixed blend order. */
const REGIONS: readonly Region[] = ["palm", "lips", "flush", "ear"];

/** Smoothstep of a value clamped to `[0, 1]`. */
function smooth(value: number): number {
  const t: number = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}
