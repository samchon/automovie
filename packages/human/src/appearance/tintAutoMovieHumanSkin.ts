import { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { AutoMovieHumanUvLayout } from "../junction/AutoMovieHumanUvLayout";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { pigmentAutoMovieHumanSkin } from "./pigmentAutoMovieHumanSkin";

/**
 * Give the skin its regional colour as per-vertex albedo: lighter palms and soles, red lips and flushed cheeks and ears over the body's colour from the identity's pigmentation.
 *
 * Each region changes the chromophores, not the colour, and its albedo comes from {@link pigmentAutoMovieHumanSkin} like the body's, so a region keeps its relation to the person's pigmentation at every skin tone: the palms and soles carry a quarter of the body's melanin (palmoplantar skin holds about a fifth of the melanocytes of other sites; see {@link PALMAR_ONSET}), the lips seven tenths of it and five times its haemoglobin, the cheeks twice its haemoglobin and the ears 1.6 times. No measured regional melanin or blood fraction was read, so these factors are otherwise conventional, chosen from the familiar appearance of each region across skin tones. Vertices blend from the body's albedo toward each region's by a weight that falls smoothly to zero at its edge:
 *
 * - Palms: the hand's chart turns from its palmar mark, so the weight follows the cosine of the vertex's chart `v`, fading in from the wrist ring over {@link PALMAR_ONSET} so the forearm's colour meets the hand's unchanged. A digit's tip is its chart's pole, where `v` is undefined, so over the last 15 percent of a digit the weight turns to one half from both sides.
 * - Soles: foot vertices that face down within the lower half of the ankle's height, over a wide enough turn of the normal and 15 mm of height that the plantar tone blends into the dorsal one along the foot's rim instead of stepping.
 * - Lips: an ellipse about stomion half the mouth's width across, 37 percent of the face width (derived from adult mouth widths near 50 mm), and 8 mm above and 9 below for an adult.
 * - Cheeks: a disc over each zygomatic prominence; ears: the whole auricle.
 *
 * The copies of one surface point that a chart boundary splits take one weight, so no seam changes colour, and the palmar and plantar weight is then spread over the surface by {@link PALMAR_PASSES}, so it ramps where it would step. A vertex's part comes from its texture coordinates, which the published UV layout makes a fixed function of its semantic address, so the tint works on the joined skin and on each part alone. Colours are written as linear albedo with the skin material's base colour then white, because a lighter palm is brighter than the body and a vertex colour can only darken.
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
  const palm: number = Math.min(
    props.measurements.identity.body.leftArm.palmLength,
    props.measurements.identity.body.rightArm.palmLength,
  );
  const ankle: number =
    0.5 *
    Math.min(
      props.measurements.identity.body.leftLeg.ankleHeight,
      props.measurements.identity.body.rightLeg.ankleHeight,
    );
  const cheeks: number[][] = (["left", "right"] as const).map(
    (side): number[] => {
      const z = l[side].zygion.position;
      return [z.x * 0.72, z.y - 8 * k, z.z + 0.5 * (stomion.z - z.z)];
    },
  );
  return props.parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
    if (
      part.geometry.type !== "mesh" ||
      part.geometry.mesh.uvs === null ||
      !part.id.startsWith("skin")
    )
      return part;
    const mesh: IAutoMovieMesh = part.geometry.mesh;
    const uvs: number[] = mesh.uvs!;
    const count: number = mesh.positions.length / 3;
    const weights: Record<"palm" | "lips" | "flush" | "ear", number[]> = {
      palm: [],
      lips: [],
      flush: [],
      ear: [],
    };
    for (let i: number = 0; i < count; ++i) {
      const x: number = mesh.positions[3 * i]! * 1000;
      const y: number = mesh.positions[3 * i + 1]! * 1000;
      const z: number = mesh.positions[3 * i + 2]! * 1000;
      const ny: number = mesh.normals === null ? 0 : mesh.normals[3 * i + 1]!;
      const chart: {
        chart: AutoMovieHumanUvLayout.IChart;
        u: number;
        v: number;
      } | null = chartOf(uvs[2 * i]!, uvs[2 * i + 1]!);
      const w: Record<"palm" | "lips" | "flush" | "ear", number> = {
        palm: 0,
        lips: 0,
        flush: 0,
        ear: 0,
      };
      if (chart !== null)
        switch (chart.chart.part) {
          case "hand": {
            const around: number = smooth(
              (Math.cos(2 * Math.PI * chart.v) - 0.05) / 0.6,
            );
            // a digit's tip is its chart's pole, where `v` cannot tell the pad from the nail
            w.palm =
              chart.chart.branch === null
                ? around * smooth((chart.u * palm) / PALMAR_ONSET)
                : around + smooth((chart.u - 0.85) / 0.15) * (0.5 - around);
            break;
          }
          case "foot":
            w.palm = smooth((-ny - 0.05) / 0.65) * smooth((ankle - y) / 15);
            break;
          case "ear":
            w.ear = 1;
            break;
          case "head": {
            const dx: number = x / mouth;
            const dy: number = (y - stomion.y) / ((y > stomion.y ? 8 : 9) * k);
            w.lips =
              z > stomion.z - 12 * k
                ? smooth(2.5 * (1 - dx * dx - dy * dy))
                : 0;
            for (const c of cheeks) {
              const d: number =
                Math.hypot(x - c[0]!, y - c[1]!, z - c[2]!) / (24 * k);
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
      for (const r of REGIONS) weights[r].push(w[r]);
    }
    // one value per surface point, then the palmar and plantar weight spread over the surface
    const points: { of: number[]; count: number } = surfacePoints(mesh);
    weights.palm = blend(mesh, points, weights.palm);
    for (const r of ["lips", "flush", "ear"] as const)
      weights[r] = weld(points, weights[r]);
    const colors: number[] = [];
    for (let i: number = 0; i < count; ++i)
      for (let c: number = 0; c < 3; ++c) {
        let v: number = body[c]!;
        for (const r of REGIONS)
          v += weights[r][i]! * (regions[r][c]! - body[c]!);
        colors.push(Math.min(1, Math.max(0, v)));
      }
    return { ...part, geometry: { type: "mesh", mesh: { ...mesh, colors } } };
  });
}

/** Smoothstep of a value clamped to `[0, 1]`. */
function smooth(t: number): number {
  const c: number = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/**
 * Millimetres over which the palm's tint fades in from the wrist ring, where the hand's chart meets the forearm's. Palmar skin is lighter because it holds about a fifth of the melanocytes of other sites (Yamaguchi et al. 2004, J Cell Biol 165(2):275-285, abstract read through Europe PMC), which is why the palms and soles carry a quarter of the body's melanin here; it begins at the distal wrist crease, over the wrist joint, so the tint is zero at the ring and the forearm's colour meets the hand's unchanged. No measured width of the change from palmar to forearm tone was read, so 15 mm, about a finger's breadth, is conventional.
 */
const PALMAR_ONSET: number = 15;

/**
 * The chart a texture coordinate lies in, or the nearest one within the layout's gaps, with the chart `u` and `v` it encodes, or null off every chart. Face-varying limit UVs can fall just outside a chart's outline, so containment is read with half the layout's 0.01 gap.
 */
function chartOf(
  x: number,
  y: number,
): { chart: AutoMovieHumanUvLayout.IChart; u: number; v: number } | null {
  let best: AutoMovieHumanUvLayout.IChart | null = null;
  let distance: number = 0.005;
  for (const chart of AUTOMOVIE_HUMAN_UV_LAYOUT.charts) {
    const d: number = Math.hypot(
      Math.max(0, chart.x - x, x - chart.x - chart.width),
      Math.max(0, chart.y - y, y - chart.y - chart.height),
    );
    if (d <= distance) {
      best = chart;
      distance = d;
      if (d === 0) break;
    }
  }
  if (best === null) return null;
  return {
    chart: best,
    u: Math.min(1, Math.max(0, (y - best.y) / best.height)),
    v: ((((x - best.x) / best.width + best.seam) % 1) + 1) % 1,
  };
}

/** The tinted regions, in the order their weights are applied. */
const REGIONS = ["palm", "lips", "flush", "ear"] as const;

/**
 * Jacobi passes that spread the palmar and plantar weight over the surface: each pass moves a point halfway to the mean of its neighbours, so the weight's steps, where a sole's normal turns over a tight rim, between the toes or around a digit's tip, where the chart's `v` meets at a pole, become ramps a few edges wide. On the joined skin at two subdivision levels the hands' and feet's edges are 1 to 3 mm, so the ramp spans several millimetres. Grade: conventional.
 */
const PALMAR_PASSES: number = 24;

/**
 * Each render vertex's surface point: the copies of one point that a chart boundary or wrap seam splits share one, by the mesh's physical source when it names one and by position otherwise.
 */
function surfacePoints(mesh: IAutoMovieMesh): { of: number[]; count: number } {
  const physical: (number | null)[] | undefined =
    mesh.physicalVertices?.vertices;
  const ids: Map<string, number> = new Map();
  const of: number[] = [];
  for (let i: number = 0; i < mesh.positions.length / 3; ++i) {
    const source: number | null | undefined = physical?.[i];
    const key: string =
      source !== null && source !== undefined
        ? `s${source}`
        : `${Math.round(mesh.positions[3 * i]! * 1e6)},${Math.round(mesh.positions[3 * i + 1]! * 1e6)},${Math.round(mesh.positions[3 * i + 2]! * 1e6)}`;
    let id: number | undefined = ids.get(key);
    if (id === undefined) {
      id = ids.size;
      ids.set(key, id);
    }
    of.push(id);
  }
  return { of, count: ids.size };
}

/**
 * Give every copy of one surface point the mean of their values, so a region read differently by two charts, as the palm is by the hand's and a digit's, never changes along the seam between them.
 */
function weld(
  points: { of: number[]; count: number },
  values: number[],
): number[] {
  const sum: number[] = new Array(points.count).fill(0);
  const copies: number[] = new Array(points.count).fill(0);
  points.of.forEach((id: number, i: number): void => {
    sum[id]! += values[i]!;
    copies[id]! += 1;
  });
  return points.of.map((id: number): number => sum[id]! / copies[id]!);
}

/**
 * The palmar and plantar weight welded across seams and spread by {@link PALMAR_PASSES} over the surface's edges.
 */
function blend(
  mesh: IAutoMovieMesh,
  points: { of: number[]; count: number },
  values: number[],
): number[] {
  const welded: number[] = weld(points, values);
  let at: number[] = new Array(points.count).fill(0);
  points.of.forEach((id: number, i: number): void => {
    at[id] = welded[i]!;
  });
  const neighbours: Set<number>[] = Array.from(
    { length: points.count },
    (): Set<number> => new Set(),
  );
  const indices: number[] =
    mesh.indices ?? Array.from({ length: points.of.length }, (_, i) => i);
  for (let t: number = 0; t < indices.length; t += 3)
    for (let k: number = 0; k < 3; ++k) {
      const a: number = points.of[indices[t + k]!]!;
      const b: number = points.of[indices[t + ((k + 1) % 3)]!]!;
      if (a === b) continue;
      neighbours[a]!.add(b);
      neighbours[b]!.add(a);
    }
  for (let pass: number = 0; pass < PALMAR_PASSES; ++pass) {
    const next: number[] = at.slice();
    neighbours.forEach((around: Set<number>, id: number): void => {
      if (around.size === 0) return;
      let mean: number = 0;
      for (const n of around) mean += at[n]!;
      next[id] = 0.5 * at[id]! + (0.5 * mean) / around.size;
    });
    at = next;
  }
  return points.of.map((id: number): number => at[id]!);
}
