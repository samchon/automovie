import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type { IAutoMovieImage } from "@automovie/interface";

import type { IAutoMovieHumanSkinAppearance } from "../structures/appearance/IAutoMovieHumanSkinAppearance";
import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinPigment } from "./AutoMovieHumanSkinPigment";
import type { AutoMovieHumanSkinTone } from "./AutoMovieHumanSkinTone";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * Seeded skin marks (freckles, moles and acne spots) drawn into one image
 * over the packed chart layout of `AutoMovieHumanSkinChart`, which the skin
 * material multiplies onto its colour as an overlay.
 *
 * Marks are sampled on the rest surface: each triangle expects its area
 * times the requested density times a regional weight, and a hash of the
 * skin seed, the mark kind and the triangle's quantized rest centroid
 * decides the count and the barycentric positions. Sampling is therefore
 * independent of vertex order but follows re-meshing. Regional weights are
 * conventions on chain names and normals:
 *
 * - freckles: full in the nose and cheek band and on the shoulders and
 *   neck, 0.25 elsewhere on the face, 0.6 on the upper chest and back and
 *   on the arms, 0.35 on hands, 0.15 to 0.3 elsewhere;
 * - moles: uniform, `count` in expectation over the whole body;
 * - acne: the face, and 0.3 on the upper chest and back.
 *
 * Lips, palms, soles and eyelids, recognised by their relief weight below
 * 0.7, take no marks, nor do triangles whose chart map changes area by more
 * than 2.5 times or is more than about 5 times anisotropic. Each mark is a
 * circle on the surface, drawn into the layout through its triangle's
 * local map, so chart distortion does not stretch it. Freckles cluster
 * under a 45 mm solid noise, and on the face they concentrate in a band
 * across the nose and cheeks located from the eyes.
 *
 * A mark's colour is the ratio of a darker chromophore set to the person's
 * own albedo: freckles add 0.07 melanin, moles 0.3 mostly eumelanin, acne
 * multiplies haemoglobin by 8; so marks stay proportionate on every skin
 * tone. Freckles have lobed outlines, moles are
 * round and darker at the centre, acne is a soft disc. Diameters spread from
 * a third of the requested largest one up to it.
 *
 * The image is RGB, 2048 pixels on the layout's longer side (about 0.8 mm
 * per pixel on f1, 12 MiB raw), white where unmarked, and is only produced
 * when some mark is requested; its id includes a digest of the inputs,
 * because two persons' marks differ.
 */
export namespace AutoMovieHumanSkinMarks {
  /** The drawn marks and where they sit. */
  export interface IOutput {
    /** RGB multiplier image. */
    image: IAutoMovieImage;

    /** Layout size the image covers, in mm from the origin, on both axes. */
    extent: number;
  }

  /** Inputs of the mark drawing. */
  export interface IInput {
    /** Charted, packed skin pieces in mm. */
    pieces: readonly AutoMovieHumanSkinChart.IOutput[];

    /** Relief weights per piece and vertex, marking glabrous and lip skin. */
    reliefWeights: readonly (readonly number[])[];

    /** Stature of the body in mm. */
    stature: number;

    /** Eye globes in mm, locating the freckle band across the nose and cheeks. */
    eyes: readonly AutoMovieHumanSkinTone.IEye[];

    /** Skin appearance with the mark requests. */
    skin: IAutoMovieHumanSkinAppearance | undefined;

    /** The person's chromophores. */
    pigmentation: AutoMovieHumanSkinPigment.IChromophores;
  }

  /** Pixels on the layout's longer side. */
  export const size: number = 2048;

  /**
   * Draw the requested marks.
   *
   * @param input Pieces, relief weights, stature, requests and chromophores
   * @returns The image and its extent, or null when nothing is requested
   */
  export function generate(input: IInput): IOutput | null {
    const kinds: IKind[] = requested(input);
    if (kinds.length === 0) return null;

    let extent: number = 0;
    for (const piece of input.pieces)
      for (const c of piece.uvs) extent = Math.max(extent, c);
    extent += 12;
    const N: number = size;
    const texel: number = extent / N;
    const multiplier: Float64Array = new Float64Array(N * N * 3).fill(1);
    const seed: number = (input.skin?.seed ?? 0) >>> 0;

    // Normalisation of the mole count over the weighted body area.
    let moleArea: number = 0;
    eachTriangle(input, (t: ITriangle): void => {
      if (t.glabrous) return;
      moleArea += t.area;
    });

    for (const kind of kinds)
      eachTriangle(input, (t: ITriangle): void => {
        if (t.glabrous) return;
        // Charts compressed or stretched beyond 2.5 times in area, or more
        // than about 5 times anisotropic (junction annuli, poles), take no
        // marks: they would smear there and spill into neighbouring charts.
        if (t.ratio < 0.4 || t.ratio > 2.5) return;
        if ((t.reach * t.reach) / (2 * t.ratio) > 2.6) return;
        const weight: number = kind.weight(t);
        if (weight <= 0) return;

        // Freckles cluster: a 45 mm solid noise thins them to a quarter
        // between patches and doubles them inside.
        const cluster: number =
          kind.name === "freckle"
            ? 0.25 +
              1.75 *
                AutoMovieHumanAppearanceNoise.smoothstep(
                  0.4,
                  0.7,
                  AutoMovieHumanAppearanceNoise.fractal3(
                    (seed % 1000003) + 77,
                    t.centre[0] / 45,
                    t.centre[1] / 45,
                    t.centre[2] / 45,
                    3,
                  ),
                )
            : 1;
        const expected: number =
          kind.name === "mole"
            ? (kind.amount * t.area) / moleArea
            : (kind.amount * weight * cluster * t.area) / 100;
        const key: number[] = [
          seed,
          kind.stream,
          Math.round(t.centre[0] * 10),
          Math.round(t.centre[1] * 10),
          Math.round(t.centre[2] * 10),
        ];
        const h: (k: number) => number = (k: number): number =>
          AutoMovieHumanAppearanceNoise.hash(...key, k);
        const count: number =
          Math.floor(expected) +
          (h(0) < expected - Math.floor(expected) ? 1 : 0);
        for (let m: number = 0; m < count; ++m) {
          let a: number = h(1 + 4 * m);
          let b: number = h(2 + 4 * m);
          if (a + b > 1) {
            a = 1 - a;
            b = 1 - b;
          }
          const u: number =
            t.uv[0][0] +
            a * (t.uv[1][0] - t.uv[0][0]) +
            b * (t.uv[2][0] - t.uv[0][0]);
          const v: number =
            t.uv[0][1] +
            a * (t.uv[1][1] - t.uv[0][1]) +
            b * (t.uv[2][1] - t.uv[0][1]);
          const spread: number = h(3 + 4 * m);
          const diameter: number =
            kind.diameter * (1 / 3 + (2 / 3) * spread * spread);
          splat(
            multiplier,
            N,
            texel,
            u,
            v,
            diameter / 2,
            t,
            kind,
            h(4 + 4 * m),
          );
        }
      });

    const pixels: Uint8Array = new Uint8Array(N * N * 3);
    for (let i: number = 0; i < N * N * 3; ++i)
      pixels[i] = srgb(multiplier[i]!);
    return {
      image: {
        id: `human.skin.marks.${digest(input, kinds)}`,
        mimeType: "image/png",
        data: encodeAutoMoviePng({ width: N, height: N, channels: 3, pixels }),
      },
      extent,
    };
  }
}

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Vector arithmetic. */
const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

/** One requested mark kind. */
interface IKind {
  /** Kind name. */
  name: "freckle" | "mole" | "acne";

  /** Hash stream of the kind. */
  stream: number;

  /** Density per square centimetre, or the whole-body count for moles. */
  amount: number;

  /** Largest diameter in mm. */
  diameter: number;

  /** Peak coverage in `[0, 1]`. */
  strength: number;

  /** Colour multiplier at full coverage, linear RGB. */
  ratio: [number, number, number];

  /** Regional weight of a triangle in `[0, 1]`. */
  weight(t: ITriangle): number;
}

/** One skin triangle as the sampler sees it. */
interface ITriangle {
  /** Chain name. */
  chain: string;

  /** Rest centroid in mm. */
  centre: Vec3;

  /** Unit face normal. */
  normal: Vec3;

  /** Area in square millimetres. */
  area: number;

  /** Layout coordinates of the three corners in mm. */
  uv: [[number, number], [number, number], [number, number]];

  /** Map from layout offsets to surface offsets in the triangle's plane, row-major 2 by 2, both in mm. */
  inverse: [number, number, number, number];

  /** Layout area over surface area. */
  ratio: number;

  /** Largest stretch of the surface-to-layout map. */
  reach: number;

  /** Closeness to the band across the nose and cheeks, `[0, 1]`. */
  malar: number;

  /** Whether the triangle lies on lip, palm, sole or eyelid skin. */
  glabrous: boolean;

  /** Stature of the body in mm. */
  stature: number;
}

/**
 * The kinds the skin appearance requests, with their colours.
 *
 * @param input Mark inputs
 * @returns Requested kinds
 */
function requested(input: AutoMovieHumanSkinMarks.IInput): IKind[] {
  const P: AutoMovieHumanSkinPigment.IChromophores = input.pigmentation;
  const base: [number, number, number] = AutoMovieHumanSkinPigment.albedo(P);
  const ratio: (
    c: AutoMovieHumanSkinPigment.IChromophores,
  ) => [number, number, number] = (
    c: AutoMovieHumanSkinPigment.IChromophores,
  ): [number, number, number] => {
    const a: [number, number, number] = AutoMovieHumanSkinPigment.albedo(c);
    return [0, 1, 2].map((i: number): number =>
      Math.min(1, a[i]! / Math.max(1e-6, base[i]!)),
    ) as [number, number, number];
  };
  const kinds: IKind[] = [];
  const freckles: IAutoMovieHumanSkinAppearance["freckles"] =
    input.skin?.freckles;
  if (freckles !== undefined && freckles.density > 0 && freckles.contrast > 0)
    kinds.push({
      name: "freckle",
      stream: 601,
      amount: freckles.density,
      diameter: freckles.diameterMm,
      strength: freckles.contrast,
      ratio: ratio({ ...P, melanin: P.melanin + 0.07, eumelaninShare: 0.4 }),
      weight: freckleWeight,
    });
  const moles: IAutoMovieHumanSkinAppearance["moles"] = input.skin?.moles;
  if (moles !== undefined && moles.count > 0 && moles.contrast > 0)
    kinds.push({
      name: "mole",
      stream: 602,
      amount: moles.count,
      diameter: moles.diameterMm,
      strength: moles.contrast,
      ratio: ratio({ ...P, melanin: P.melanin + 0.3, eumelaninShare: 0.9 }),
      weight: (): number => 1,
    });
  const acne: IAutoMovieHumanSkinAppearance["acne"] = input.skin?.acne;
  if (acne !== undefined && acne.density > 0 && acne.severity > 0)
    kinds.push({
      name: "acne",
      stream: 603,
      amount: acne.density,
      diameter: acne.diameterMm,
      strength: 0.8 * acne.severity,
      ratio: ratio({ ...P, haemoglobin: Math.min(0.32, P.haemoglobin * 8) }),
      weight: acneWeight,
    });
  return kinds;
}

/**
 * Freckle weight by region.
 *
 * @param t Triangle
 * @returns Weight in `[0, 1]`
 */
function freckleWeight(t: ITriangle): number {
  const c: string = t.chain;
  if (c === "head" || c.startsWith("head."))
    return t.normal[0] > 0.2 ? 0.25 + 0.75 * t.malar : 0.15;
  if (c.startsWith("ear.")) return 0.4;
  if (c === "upper") return 1;
  if (c === "trunk") return t.centre[1] > 0.7 * t.stature ? 0.6 : 0.15;
  if (c.startsWith("arm.")) return 0.6;
  if (
    c.startsWith("hand.") ||
    c.startsWith("finger.") ||
    c.startsWith("thumb.")
  )
    return 0.35;
  if (c.startsWith("leg.")) return 0.3;
  return 0.15;
}

/**
 * Acne weight by region.
 *
 * @param t Triangle
 * @returns Weight in `[0, 1]`
 */
function acneWeight(t: ITriangle): number {
  const c: string = t.chain;
  if (c === "head" || c.startsWith("head.")) return t.normal[0] > 0.2 ? 1 : 0;
  if (c === "upper") return 0.3;
  if (c === "trunk") return t.centre[1] > 0.7 * t.stature ? 0.3 : 0;
  return 0;
}

/**
 * Visit every skin triangle with its layout map and regional context.
 *
 * @param input Mark inputs
 * @param visit Visitor
 */
function eachTriangle(
  input: AutoMovieHumanSkinMarks.IInput,
  visit: (t: ITriangle) => void,
): void {
  // The freckle band runs across the nose and cheeks, 0.45 interpupillary
  // distances below the eyes and 0.75 to either side.
  const left: AutoMovieHumanSkinTone.IEye | undefined = input.eyes.find(
    (e: AutoMovieHumanSkinTone.IEye): boolean => e.side === "left",
  );
  const right: AutoMovieHumanSkinTone.IEye | undefined = input.eyes.find(
    (e: AutoMovieHumanSkinTone.IEye): boolean => e.side === "right",
  );
  const mid: Vec3 | null =
    left !== undefined && right !== undefined
      ? V.scale(V.add(left.centre, right.centre), 0.5)
      : null;
  const ipd: number =
    left !== undefined && right !== undefined
      ? V.norm(V.sub(left.centre, right.centre))
      : 1;
  const malar: (c: Vec3) => number = (c: Vec3): number => {
    if (mid === null) return 0;
    const dy: number = (c[1] - (mid[1] - 0.45 * ipd)) / (0.35 * ipd);
    const dz: number =
      Math.max(0, Math.abs(c[2] - mid[2]) - 0.75 * ipd) / (0.2 * ipd);
    return Math.exp(-(dy * dy + dz * dz));
  };

  input.pieces.forEach(
    (piece: AutoMovieHumanSkinChart.IOutput, k: number): void => {
      const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
      const relief: readonly number[] = input.reliefWeights[k]!;
      for (let t: number = 0; t < piece.indices.length; t += 3) {
        const ids: number[] = [
          piece.indices[t]!,
          piece.indices[t + 1]!,
          piece.indices[t + 2]!,
        ];
        const p: Vec3[] = ids.map(
          (i: number): Vec3 => V.at(piece.positions, i),
        );
        const uv: [[number, number], [number, number], [number, number]] =
          ids.map((i: number): [number, number] => [
            piece.uvs[2 * i]!,
            piece.uvs[2 * i + 1]!,
          ]) as [[number, number], [number, number], [number, number]];
        const e1: Vec3 = V.sub(p[1]!, p[0]!);
        const e2: Vec3 = V.sub(p[2]!, p[0]!);
        const cross: Vec3 = V.cross(e1, e2);
        const area: number = V.norm(cross) / 2;
        if (area <= 1e-9) continue;

        // Local plane coordinates (x along e1) and the 2 by 2 map J from them
        // to layout coordinates; its inverse maps layout offsets back to the
        // surface.
        const l1: number = V.norm(e1);
        const x: Vec3 = V.scale(e1, 1 / l1);
        const y: Vec3 = V.normalize(V.cross(V.normalize(cross), x));
        const bx: number = V.dot(e2, x);
        const by: number = V.dot(e2, y);
        const du1: number = uv[1][0] - uv[0][0];
        const dv1: number = uv[1][1] - uv[0][1];
        const du2: number = uv[2][0] - uv[0][0];
        const dv2: number = uv[2][1] - uv[0][1];
        const j00: number = du1 / l1;
        const j10: number = dv1 / l1;
        const j01: number = (du2 - j00 * bx) / by;
        const j11: number = (dv2 - j10 * bx) / by;
        const det: number = j00 * j11 - j01 * j10;
        if (Math.abs(det) < 1e-12) continue;
        visit({
          chain,
          centre: V.scale(V.add(p[0]!, V.add(p[1]!, p[2]!)), 1 / 3),
          normal: V.normalize(cross),
          area,
          uv,
          inverse: [j11 / det, -j01 / det, -j10 / det, j00 / det],
          ratio: Math.abs(det),
          reach: Math.hypot(j00, j01, j10, j11),
          malar: malar(V.scale(V.add(p[0]!, V.add(p[1]!, p[2]!)), 1 / 3)),
          glabrous: ids.some((i: number): boolean => relief[i]! < 0.7),
          stature: input.stature,
        });
      }
    },
  );
}

/**
 * Multiply one mark into the image. The mark is a circle on the surface, so
 * each pixel's layout offset from the centre is mapped back to the
 * triangle's plane before its distance is measured; a chart that stretches
 * one way draws the mark as the matching ellipse.
 *
 * @param image Linear RGB multipliers
 * @param N Image edge in pixels
 * @param texel Layout millimetres per pixel
 * @param cu Centre in layout mm, horizontal
 * @param cv Centre in layout mm, vertical
 * @param radius Radius on the surface in mm
 * @param t Triangle holding the centre
 * @param kind Mark kind
 * @param salt Per-mark random value in `[0, 1)`
 */
function splat(
  image: Float64Array,
  N: number,
  texel: number,
  cu: number,
  cv: number,
  radius: number,
  t: ITriangle,
  kind: IKind,
  salt: number,
): void {
  const strength: number =
    kind.strength * (kind.name === "freckle" ? 0.5 + 0.5 * salt : 1);
  const reach: number = Math.ceil((radius * 1.6 * t.reach) / texel + 1);
  const cx: number = cu / texel;
  const cy: number = cv / texel;
  const phase: number = salt * 2 * Math.PI;
  const soft: number = 0.6 * texel;
  const M: [number, number, number, number] = t.inverse;
  for (
    let py: number = Math.floor(cy - reach);
    py <= Math.ceil(cy + reach);
    ++py
  ) {
    if (py < 0 || py >= N) continue;
    for (
      let px: number = Math.floor(cx - reach);
      px <= Math.ceil(cx + reach);
      ++px
    ) {
      if (px < 0 || px >= N) continue;
      const du: number = (px + 0.5) * texel - cu;
      const dv: number = (py + 0.5) * texel - cv;
      const sx: number = M[0] * du + M[1] * dv;
      const sy: number = M[2] * du + M[3] * dv;
      const d: number = Math.hypot(sx, sy);
      let cover: number;
      if (kind.name === "acne")
        cover = Math.exp(-((d / Math.max(soft, radius * 0.7)) ** 2));
      else {
        // Freckles take a lobed outline; moles stay round and darken toward
        // the centre.
        const angle: number = Math.atan2(sy, sx);
        const r: number =
          kind.name === "freckle"
            ? radius *
              (1 +
                0.18 * Math.sin(3 * angle + phase) +
                0.1 * Math.sin(5 * angle + 2 * phase))
            : radius;
        cover =
          1 - AutoMovieHumanAppearanceNoise.smoothstep(r - soft, r + soft, d);
        if (kind.name === "mole")
          cover *= 1 + 0.15 * (1 - Math.min(1, d / Math.max(soft, r)));
      }
      const a: number = Math.min(1, strength * cover);
      if (a <= 0) continue;
      const at: number = (py * N + px) * 3;
      for (let c: number = 0; c < 3; ++c)
        image[at + c] = image[at + c]! * (1 + (kind.ratio[c]! - 1) * a);
    }
  }
}

/**
 * Hexadecimal digest of everything that shapes the image.
 *
 * @param input Mark inputs
 * @param kinds Requested kinds
 * @returns Eight hexadecimal digits
 */
function digest(
  input: AutoMovieHumanSkinMarks.IInput,
  kinds: readonly IKind[],
): string {
  const keys: number[] = [input.skin?.seed ?? 0];
  for (const kind of kinds)
    keys.push(
      kind.stream,
      Math.round(kind.amount * 1000),
      Math.round(kind.diameter * 1000),
      Math.round(kind.strength * 1000),
      ...kind.ratio.map((c: number): number => Math.round(c * 1e6)),
    );
  for (const piece of input.pieces)
    keys.push(piece.positions.length, piece.indices.length);
  return Math.floor(AutoMovieHumanAppearanceNoise.hash(...keys) * 4294967296)
    .toString(16)
    .padStart(8, "0");
}

/**
 * sRGB byte of a linear value (IEC 61966-2-1 transfer).
 *
 * @param linear Linear value in `[0, 1]`
 * @returns Encoded byte
 */
function srgb(linear: number): number {
  const c: number = Math.min(1, Math.max(0, linear));
  const e: number =
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(255 * e);
}
