import { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { AutoMovieHumanUvLayout } from "../junction/AutoMovieHumanUvLayout";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { pigmentAutoMovieHumanSkin } from "./pigmentAutoMovieHumanSkin";

/**
 * Give the skin its regional colour as per-vertex albedo: lighter palms and soles, red lips and flushed cheeks and ears over the body's colour from the identity's pigmentation.
 *
 * Each region changes the chromophores, not the colour, and its albedo comes from {@link pigmentAutoMovieHumanSkin} like the body's, so a region keeps its relation to the person's pigmentation at every skin tone: the palms and soles carry a quarter of the body's melanin, the lips seven tenths of it and five times its haemoglobin, the cheeks twice its haemoglobin and the ears 1.6 times. No measured regional melanin or blood fraction was read, so these factors are conventional, chosen from the familiar appearance of each region across skin tones. Vertices blend from the body's albedo toward each region's by a weight that falls smoothly to zero at its edge:
 *
 * - Palms: the hand's chart turns from its palmar mark, so the weight follows the cosine of the vertex's chart `v`.
 * - Soles: foot vertices that face down within the lower half of the ankle's height.
 * - Lips: an ellipse about stomion half the mouth's width across, 37 percent of the face width (derived from adult mouth widths near 50 mm), and 8 mm above and 9 below for an adult.
 * - Cheeks: a disc over each zygomatic prominence; ears: the whole auricle.
 *
 * A vertex's part comes from its texture coordinates, which the published UV layout makes a fixed function of its semantic address, so the tint works on the joined skin and on each part alone. Colours are written as linear albedo with the skin material's base colour then white, because a lighter palm is brighter than the body and a vertex colour can only darken.
 *
 * @param props.parts The skin parts, metres, with texture coordinates
 * @param props.measurements Resolved measurements, for the pigmentation and the face
 * @param props.skeleton The skeleton at rest, for its landmarks
 * @returns The parts with per-vertex colours; other parts are returned unchanged
 */
export function tintAutoMovieHumanSkin(props: {
  parts: readonly IAutoMovieModelPart[];
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
}): IAutoMovieModelPart[] {
  const p = props.measurements.identity.pigmentation;
  const pigment = (melanin: number, haemoglobin: number): number[] => {
    const c = pigmentAutoMovieHumanSkin({
      melanin: Math.min(0.5, melanin),
      eumelaninShare: p.eumelaninShare,
      haemoglobin: Math.min(0.32, Math.max(0.001, haemoglobin)),
    });
    return [c.r, c.g, c.b];
  };
  const body: number[] = pigment(p.melanin, p.haemoglobin);
  const regions: Record<"palm" | "lips" | "flush" | "ear", number[]> = {
    palm: pigment(0.25 * p.melanin, p.haemoglobin),
    lips: pigment(0.7 * p.melanin, 5 * p.haemoglobin),
    flush: pigment(p.melanin, 2 * p.haemoglobin),
    ear: pigment(p.melanin, 1.6 * p.haemoglobin),
  };
  const l = props.skeleton.landmarks;
  const head = props.measurements.identity.head;
  const k: number = head.faceHeight / 120;
  const stomion = l.stomion.position;
  const mouth: number = 0.185 * head.faceWidth;
  const ankle: number =
    0.5 * Math.min(props.measurements.identity.body.leftLeg.ankleHeight, props.measurements.identity.body.rightLeg.ankleHeight);
  const cheeks: number[][] = (["left", "right"] as const).map((side): number[] => {
    const z = l[side].zygion.position;
    return [z.x * 0.72, z.y - 8 * k, z.z + 0.5 * (stomion.z - z.z)];
  });
  return props.parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
    if (part.geometry.type !== "mesh" || part.geometry.mesh.uvs === null || !part.id.startsWith("skin")) return part;
    const mesh: IAutoMovieMesh = part.geometry.mesh;
    const uvs: number[] = mesh.uvs!;
    const colors: number[] = [];
    for (let i: number = 0; i < mesh.positions.length / 3; ++i) {
      const x: number = mesh.positions[3 * i]! * 1000;
      const y: number = mesh.positions[3 * i + 1]! * 1000;
      const z: number = mesh.positions[3 * i + 2]! * 1000;
      const ny: number = mesh.normals === null ? 0 : mesh.normals[3 * i + 1]!;
      const chart: { chart: AutoMovieHumanUvLayout.IChart; v: number } | null = chartOf(uvs[2 * i]!, uvs[2 * i + 1]!);
      const w: Record<"palm" | "lips" | "flush" | "ear", number> = { palm: 0, lips: 0, flush: 0, ear: 0 };
      if (chart !== null)
        switch (chart.chart.part) {
          case "hand":
            w.palm = smooth((Math.cos(2 * Math.PI * chart.v) - 0.05) / 0.6);
            break;
          case "foot":
            w.palm = smooth((-ny - 0.3) / 0.4) * smooth((ankle - y) / 6);
            break;
          case "ear":
            w.ear = 1;
            break;
          case "head": {
            const dx: number = x / mouth;
            const dy: number = (y - stomion.y) / ((y > stomion.y ? 8 : 9) * k);
            w.lips = z > stomion.z - 12 * k ? smooth(2.5 * (1 - dx * dx - dy * dy)) : 0;
            for (const c of cheeks) {
              const d: number = Math.hypot(x - c[0]!, y - c[1]!, z - c[2]!) / (24 * k);
              w.flush = Math.max(w.flush, smooth(1.4 * (1 - d * d)));
            }
            break;
          }
          case "arm":
          case "leg":
          case "neck":
          case "trunk":
            break;
        }
      for (let c: number = 0; c < 3; ++c) {
        let v: number = body[c]!;
        for (const r of ["palm", "lips", "flush", "ear"] as const) v += w[r] * (regions[r][c]! - body[c]!);
        colors.push(Math.min(1, Math.max(0, v)));
      }
    }
    return { ...part, geometry: { type: "mesh", mesh: { ...mesh, colors } } };
  });
}

/** Smoothstep of a value clamped to `[0, 1]`. */
function smooth(t: number): number {
  const c: number = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** The chart a texture coordinate lies in, with the chart `v` it encodes, or null off every chart. */
function chartOf(x: number, y: number): { chart: AutoMovieHumanUvLayout.IChart; v: number } | null {
  for (const chart of AUTOMOVIE_HUMAN_UV_LAYOUT.charts)
    if (x >= chart.x - 1e-9 && x <= chart.x + chart.width + 1e-9 && y >= chart.y - 1e-9 && y <= chart.y + chart.height + 1e-9)
      return { chart, v: ((((x - chart.x) / chart.width + chart.seam) % 1) + 1) % 1 };
  return null;
}
