import { encodeAutoMoviePng } from "@automovie/engine/render/encodeAutoMoviePng";
import type {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieTextureReference,
} from "@automovie/interface";

import { AutoMovieHumanAppearanceNoise } from "./AutoMovieHumanAppearanceNoise";
import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";
import { AutoMovieHumanSkinVector } from "./AutoMovieHumanSkinVector";

/**
 * Finger and toe nails as thin plates laid on the distal dorsal skin of every
 * digit chain.
 *
 * The lofted skin has no nail geometry (the nail's step is below the
 * fitter's event threshold) and its digit vertices are 3 to 5 mm apart, too
 * coarse for vertex colours to draw a nail outline, while one shared image
 * cannot address each digit through the skin coordinates. A separate part
 * per nail, `human.nail.<side>.<digit>`, therefore carries its own
 * coordinates, an alpha-masked nail image and a glossy material, and sits
 * 0.45 mm above the skin, about the thickness of a nail plate.
 *
 * Placement is a rule on each chain `finger.<side>.<name>`, `thumb.<side>` or
 * `toe.<side>.<n>`:
 *
 * - the digit axis runs from the chain's band centroid nearer the hand or
 *   foot to the one farther from it, and the tip is the vertex farthest along
 *   it;
 * - the nail faces dorsally: away from the palm for fingers (the palmar
 *   direction derived from the hand, thumb and finger centroids), between
 *   that and the hand's radial side for the thumb, and up for toes;
 * - with `r` the digit's mean radius over the distal part of the chain, the
 *   plate spans 1.6 r (fingers) or 1.25 r (toes) along the axis, ending
 *   0.35 r (0.45 r) short of the tip, and plus or minus 0.7 (0.68) rad around
 *   it;
 * - 14 rows of 11 rays leave a straight local axis fitted through the
 *   digit's cross-section centroids at the row stations and meet the
 *   digit's own triangles; each row's hit distances (ignoring hits more than
 *   35 percent off the row median, as at a spiky tip) are fitted with a
 *   quadratic across the nail and lifted by the largest positive residual,
 *   so the plate is smooth yet never below a facet, and stands 0.45 mm
 *   higher along the rays; normals come from the smooth plate.
 *
 * The plate is a curved rectangle; the image's alpha cuts the nail outline
 * (a cuticle arc, straight lateral folds and a rounded free edge) out of it.
 * Proportions, thickness and colours are conventions, not measurements.
 */
export namespace AutoMovieHumanNail {
  /** Nail parts, material and images. */
  export interface IOutput {
    /** `human.nail.<side>.<digit>` parts in model metres. */
    parts: IAutoMovieModelPart[];

    /** The `human.nail` material, or null without digits. */
    material: IAutoMovieMaterial | null;

    /** Images the material samples. */
    images: IAutoMovieImage[];
  }

  /** Id of the nail colour and coverage image. */
  export const colorId: string = "human.nail.color";

  /** Id of the nail normal map. */
  export const normalId: string = "human.nail.normal";

  /** Edge of both nail images in pixels. */
  export const size: number = 256;

  /**
   * Lay nails on the digits of charted skin pieces.
   *
   * @param pieces Skin pieces in mm
   * @param scale Millimetre-to-model factor
   * @param albedo The person's base skin albedo, tinting the nail bed
   * @returns Parts, material and images
   */
  export function generate(
    pieces: readonly AutoMovieHumanSkinChart.IOutput[],
    scale: number,
    albedo: readonly [number, number, number],
  ): IOutput {
    const chains: Map<string, AutoMovieHumanSkinChart.IOutput[]> = new Map();
    for (const piece of pieces) {
      const chain: string = piece.name.slice(0, piece.name.lastIndexOf("/"));
      const list: AutoMovieHumanSkinChart.IOutput[] | undefined =
        chains.get(chain);
      if (list === undefined) chains.set(chain, [piece]);
      else list.push(piece);
    }

    const parts: IAutoMovieModelPart[] = [];
    for (const [name, list] of chains) {
      const match: RegExpExecArray | null =
        /^(finger|thumb|toe)\.(left|right)(?:\.(\w+))?$/.exec(name);
      if (match === null) continue;
      const kind: "finger" | "thumb" | "toe" = match[1] as
        | "finger"
        | "thumb"
        | "toe";
      const side: "left" | "right" = match[2] as "left" | "right";
      const digit: IDigit | null = frame(chains, list, kind, side);
      if (digit === null) continue;
      const mesh: IPlate = plate(list, digit, kind);
      const id: string = `human.nail.${side}.${
        kind === "thumb"
          ? "thumb"
          : kind === "toe"
            ? `toe${match[3]}`
            : match[3]
      }`;
      parts.push({
        id,
        name: id,
        geometry: {
          type: "mesh",
          mesh: {
            positions: mesh.positions.map((v: number): number => v * scale),
            normals: mesh.normals,
            uvs: mesh.uvs,
            indices: mesh.indices,
            skin: null,
          },
        },
        material: "human.nail",
        attachedBone: null,
        transform: null,
      });
    }
    if (parts.length === 0) return { parts, material: null, images: [] };

    // The bed image is drawn for fair skin; a darker person darkens it by the
    // square root of their albedo relative to the image's reference.
    const tint: number[] = albedo.map((c: number, i: number): number =>
      Math.min(1, Math.sqrt(c / REFERENCE[i]!)),
    );
    const binding: (
      asset: string,
      colorSpace: "srgb" | "linear",
    ) => IAutoMovieTextureReference = (
      asset: string,
      colorSpace: "srgb" | "linear",
    ): IAutoMovieTextureReference => ({
      asset,
      texCoord: 0,
      coordinateSource: "normalized",
      colorSpace,
      sampler: {
        wrapS: "clamp",
        wrapT: "clamp",
        minFilter: "linearMipmapLinear",
        magFilter: "linear",
      },
    });
    return {
      parts,
      material: {
        id: "human.nail",
        name: "nail",
        baseColor: { r: tint[0]!, g: tint[1]!, b: tint[2]!, a: 1, hex: null },
        metallic: 0,
        roughness: 0.3,
        emissive: null,
        opacity: 1,
        alphaMode: "mask",
        alphaCutoff: 0.5,
        baseColorTexture: binding(colorId, "srgb"),
        normalTexture: binding(normalId, "linear"),
        normalScale: 1,
        ior: 1.5,
        specularIntensity: 1,
        clearcoat: 0.2,
        doubleSided: false,
      },
      images: images(),
    };
  }
}

/** Point or direction in mm. */
type Vec3 = AutoMovieHumanSkinVector.Vec3;

/** Vector arithmetic. */
const V: typeof AutoMovieHumanSkinVector = AutoMovieHumanSkinVector;

/** Linear skin albedo the nail image is drawn for. */
const REFERENCE: readonly number[] = [0.72, 0.53, 0.44];

/** Plate height above the skin in mm. */
const THICKNESS: number = 0.45;

/** Grid of one plate: samples along the digit and around it. */
const ALONG: number = 14;

/** Samples around the digit. */
const AROUND: number = 11;

/** Frame of one digit. */
interface IDigit {
  /** A point on the digit axis. */
  origin: Vec3;

  /** Unit axis toward the tip. */
  axis: Vec3;

  /** Unit dorsal direction perpendicular to the axis. */
  dorsal: Vec3;

  /** Station of the tip along the axis from the origin, in mm. */
  tip: number;

  /** Mean radius of the distal digit in mm. */
  radius: number;
}

/** Plate mesh in mm. */
interface IPlate {
  /** Flat positions in mm. */
  positions: number[];

  /** Flat unit normals. */
  normals: number[];

  /** Flat normalized coordinates: u across, v from cuticle to free edge. */
  uvs: number[];

  /** Triangle indices. */
  indices: number[];
}

/**
 * Frame of one digit chain.
 *
 * @param chains Pieces by chain
 * @param list The digit chain's pieces
 * @param kind Finger, thumb or toe
 * @param side Anatomical side
 * @returns The frame, or null when the hand or foot it hangs from is missing
 */
function frame(
  chains: Map<string, AutoMovieHumanSkinChart.IOutput[]>,
  list: readonly AutoMovieHumanSkinChart.IOutput[],
  kind: "finger" | "thumb" | "toe",
  side: "left" | "right",
): IDigit | null {
  const gather: (prefix: string) => AutoMovieHumanSkinChart.IOutput[] = (
    prefix: string,
  ): AutoMovieHumanSkinChart.IOutput[] =>
    [...chains.entries()]
      .filter(([name]: [string, AutoMovieHumanSkinChart.IOutput[]]): boolean =>
        name.startsWith(prefix),
      )
      .flatMap(
        ([, pieces]: [
          string,
          AutoMovieHumanSkinChart.IOutput[],
        ]): AutoMovieHumanSkinChart.IOutput[] => pieces,
      );
  const base: AutoMovieHumanSkinChart.IOutput[] =
    kind === "toe" ? gather(`foot.${side}`) : gather(`hand.${side}.`);
  if (base.length === 0) return null;
  const anchor: Vec3 = mean(base);

  // Axis from the band centroid nearer the hand or foot to the farther one.
  const ends: [Vec3, Vec3] = extremes(list);
  const nearFirst: boolean =
    V.norm(V.sub(ends[0], anchor)) < V.norm(V.sub(ends[1], anchor));
  const root: Vec3 = nearFirst ? ends[0] : ends[1];
  const far: Vec3 = nearFirst ? ends[1] : ends[0];
  const axis: Vec3 = V.normalize(V.sub(far, root));

  let tip: number = -Infinity;
  for (const piece of list)
    for (let i: number = 0; i < piece.positions.length / 3; ++i)
      tip = Math.max(tip, V.dot(V.sub(V.at(piece.positions, i), root), axis));

  // Dorsal direction by digit kind, made perpendicular to the axis.
  let dorsal: Vec3 = [0, 1, 0];
  if (kind !== "toe") {
    const thumb: AutoMovieHumanSkinChart.IOutput[] = gather(`thumb.${side}`);
    const fingers: AutoMovieHumanSkinChart.IOutput[] = gather(
      `finger.${side}.`,
    );
    if (thumb.length === 0 || fingers.length === 0) return null;
    const handAxis: Vec3 = V.normalize(V.sub(mean(fingers), anchor));
    const toward: Vec3 = V.sub(mean(thumb), anchor);
    const radial: Vec3 = V.normalize(
      V.sub(toward, V.scale(handAxis, V.dot(toward, handAxis))),
    );
    const palmar: Vec3 = V.scale(
      V.normalize(V.cross(radial, handAxis)),
      side === "left" ? 1 : -1,
    );
    dorsal =
      kind === "finger"
        ? V.scale(palmar, -1)
        : V.add(V.scale(palmar, -0.6), V.scale(radial, 0.8));
  }
  dorsal = V.normalize(V.sub(dorsal, V.scale(axis, V.dot(dorsal, axis))));

  // Mean radius over the distal part of the chain, short of the tip cap.
  let lo: number = Infinity;
  for (const piece of list)
    for (let i: number = 0; i < piece.positions.length / 3; ++i)
      lo = Math.min(lo, V.dot(V.sub(V.at(piece.positions, i), root), axis));
  const length: number = tip - lo;
  let sum: number = 0;
  let count: number = 0;
  for (const piece of list)
    for (let i: number = 0; i < piece.positions.length / 3; ++i) {
      const d: Vec3 = V.sub(V.at(piece.positions, i), root);
      const s: number = V.dot(d, axis);
      if (s < tip - 0.45 * length || s > tip - 0.12 * length) continue;
      sum += V.norm(V.sub(d, V.scale(axis, s)));
      count += 1;
    }
  if (count === 0) return null;
  return { origin: root, axis, dorsal, tip, radius: sum / count };
}

/**
 * Plate of one nail: rays from the digit axis meet its triangles.
 *
 * @param list The digit chain's pieces
 * @param digit The digit's frame
 * @param kind Finger, thumb or toe
 * @returns The plate mesh
 */
function plate(
  list: readonly AutoMovieHumanSkinChart.IOutput[],
  digit: IDigit,
  kind: "finger" | "thumb" | "toe",
): IPlate {
  const toe: boolean = kind === "toe";
  const r: number = digit.radius;
  const distal: number = digit.tip - (toe ? 0.45 : 0.35) * r;
  const length: number = (toe ? 1.25 : 1.6) * r;
  const halfAngle: number = toe ? 0.68 : 0.7;
  const side: Vec3 = V.cross(digit.axis, digit.dorsal);
  const out: IPlate = { positions: [], normals: [], uvs: [], indices: [] };

  // A straight local axis fitted through the section centroids of the
  // rows, so the plate does not jump where a window gains or loses vertices.
  const stations: number[] = [];
  const centres: Vec3[] = [];
  for (let i: number = 0; i < ALONG; ++i) {
    stations.push(distal - length * (1 - i / (ALONG - 1)));
    centres.push(section(list, digit, stations[i]!));
  }
  const line: (station: number) => Vec3 = fitLine(stations, centres);

  // Per row: ray hits around the nail, a quadratic across the nail through
  // the trusted hits (within 35 percent of the row median), then the whole
  // row pushed out by its largest positive residual so the smooth plate
  // never dips under a facet.
  const grid: Vec3[] = [];
  const directions: Vec3[] = [];
  for (let i: number = 0; i < ALONG; ++i) {
    const origin: Vec3 = line(stations[i]!);
    const ts: number[] = [];
    const ds: number[] = [];
    const rowDirections: Vec3[] = [];
    for (let j: number = 0; j < AROUND; ++j) {
      const t: number = -1 + (2 * j) / (AROUND - 1);
      const phi: number = t * halfAngle;
      const direction: Vec3 = V.add(
        V.scale(digit.dorsal, Math.cos(phi)),
        V.scale(side, Math.sin(phi)),
      );
      const hit: [Vec3, Vec3] | null = cast(list, origin, direction);
      rowDirections.push(direction);
      ts.push(t);
      ds.push(hit === null ? NaN : V.norm(V.sub(hit[0], origin)));
    }
    const known: number[] = ds
      .filter((d: number): boolean => !Number.isNaN(d))
      .sort((a: number, b: number): number => a - b);
    const median: number =
      known.length === 0 ? r : known[Math.floor(known.length / 2)]!;
    const trusted: boolean[] = ds.map(
      (d: number): boolean =>
        !Number.isNaN(d) && Math.abs(d - median) <= 0.35 * median,
    );
    const fit: (t: number) => number = fitQuadratic(ts, ds, trusted, median);
    let lift: number = 0;
    ds.forEach((d: number, j: number): void => {
      if (trusted[j]) lift = Math.max(lift, d - fit(ts[j]!));
    });
    for (let j: number = 0; j < AROUND; ++j) {
      grid.push(
        V.add(
          origin,
          V.scale(rowDirections[j]!, fit(ts[j]!) + lift + THICKNESS),
        ),
      );
      directions.push(rowDirections[j]!);
    }
  }

  // Normals of the smooth plate, outward along the rays.
  for (let i: number = 0; i < ALONG; ++i)
    for (let j: number = 0; j < AROUND; ++j) {
      const at: (a: number, b: number) => Vec3 = (a: number, b: number): Vec3 =>
        grid[
          Math.min(ALONG - 1, Math.max(0, a)) * AROUND +
            Math.min(AROUND - 1, Math.max(0, b))
        ]!;
      const along: Vec3 = V.sub(at(i + 1, j), at(i - 1, j));
      const around: Vec3 = V.sub(at(i, j + 1), at(i, j - 1));
      let normal: Vec3 = V.normalize(V.cross(along, around));
      if (V.dot(normal, directions[i * AROUND + j]!) < 0)
        normal = V.scale(normal, -1);
      out.positions.push(...grid[i * AROUND + j]!);
      out.normals.push(...normal);
      out.uvs.push(j / (AROUND - 1), i / (ALONG - 1));
    }

  // Counter-clockwise seen from outside: along the axis then around it
  // turns inward, so each quad is wound around-then-along.
  for (let i: number = 0; i + 1 < ALONG; ++i)
    for (let j: number = 0; j + 1 < AROUND; ++j) {
      const a: number = i * AROUND + j;
      const b: number = a + 1;
      const c: number = a + AROUND;
      const d: number = c + 1;
      out.indices.push(a, b, c, c, b, d);
    }
  return out;
}

/**
 * Least-squares line through points given at stations.
 *
 * @param stations Stations in mm
 * @param points Points at the stations
 * @returns Point on the fitted line at a station
 */
function fitLine(
  stations: readonly number[],
  points: readonly Vec3[],
): (station: number) => Vec3 {
  const n: number = stations.length;
  const ms: number =
    stations.reduce((a: number, b: number): number => a + b, 0) / n;
  const mp: Vec3 = V.scale(
    points.reduce((a: Vec3, b: Vec3): Vec3 => V.add(a, b), [0, 0, 0]),
    1 / n,
  );
  let ss: number = 0;
  let slope: Vec3 = [0, 0, 0];
  stations.forEach((s: number, i: number): void => {
    ss += (s - ms) ** 2;
    slope = V.add(slope, V.scale(V.sub(points[i]!, mp), s - ms));
  });
  const b: Vec3 = ss > 0 ? V.scale(slope, 1 / ss) : [0, 0, 0];
  return (station: number): Vec3 => V.add(mp, V.scale(b, station - ms));
}

/**
 * Least-squares quadratic through the trusted samples of a row; with fewer
 * than three, a constant.
 *
 * @param ts Sample positions across the nail in `[-1, 1]`
 * @param ds Sample distances, NaN where missing
 * @param trusted Which samples to fit
 * @param fallback Constant used without trusted samples
 * @returns Fitted distance at a position
 */
function fitQuadratic(
  ts: readonly number[],
  ds: readonly number[],
  trusted: readonly boolean[],
  fallback: number,
): (t: number) => number {
  // Normal equations of d = c0 + c1 t + c2 t^2.
  const m: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const y: number[] = [0, 0, 0];
  let count: number = 0;
  ts.forEach((t: number, j: number): void => {
    if (!trusted[j]) return;
    const basis: number[] = [1, t, t * t];
    for (let a: number = 0; a < 3; ++a) {
      y[a]! += basis[a]! * ds[j]!;
      for (let b: number = 0; b < 3; ++b)
        m[a * 3 + b]! += basis[a]! * basis[b]!;
    }
    count += 1;
  });
  if (count < 3) {
    const mean: number = count === 0 ? fallback : y[0]! / m[0]!;
    return (): number => mean;
  }
  const c: number[] = solve3(m, y);
  return (t: number): number => c[0]! + c[1]! * t + c[2]! * t * t;
}

/**
 * Solve a 3 by 3 linear system by Cramer's rule.
 *
 * @param m Row-major matrix
 * @param y Right-hand side
 * @returns Solution
 */
function solve3(m: readonly number[], y: readonly number[]): number[] {
  const det: (a: readonly number[]) => number = (
    a: readonly number[],
  ): number =>
    a[0]! * (a[4]! * a[8]! - a[5]! * a[7]!) -
    a[1]! * (a[3]! * a[8]! - a[5]! * a[6]!) +
    a[2]! * (a[3]! * a[7]! - a[4]! * a[6]!);
  const d: number = det(m);
  return [0, 1, 2].map((k: number): number => {
    const a: number[] = [...m];
    for (let r: number = 0; r < 3; ++r) a[r * 3 + k] = y[r]!;
    return Math.abs(d) < 1e-12
      ? k === 0
        ? y[0]! / Math.max(1, m[0]!)
        : 0
      : det(a) / d;
  });
}

/**
 * Centroid of the digit's cross-section at a station: the mean of its
 * vertices within a third of a radius (at least 1.2 mm) of the station,
 * widening the window until some are found. Rays start there rather than on
 * the straight axis, which leaves a curled toe or a bent fingertip.
 *
 * @param list The digit chain's pieces
 * @param digit The digit's frame
 * @param station Station along the axis in mm
 * @returns Section centroid
 */
function section(
  list: readonly AutoMovieHumanSkinChart.IOutput[],
  digit: IDigit,
  station: number,
): Vec3 {
  for (
    let window: number = Math.max(1.2, digit.radius / 3);
    window < 4 * digit.radius;
    window *= 2
  ) {
    const sum: Vec3 = [0, 0, 0];
    let count: number = 0;
    for (const piece of list)
      for (let i: number = 0; i < piece.positions.length / 3; ++i) {
        const p: Vec3 = V.at(piece.positions, i);
        const s: number = V.dot(V.sub(p, digit.origin), digit.axis);
        if (Math.abs(s - station) > window) continue;
        sum[0] += p[0];
        sum[1] += p[1];
        sum[2] += p[2];
        count += 1;
      }
    if (count >= 3) return V.scale(sum, 1 / count);
  }
  return V.add(digit.origin, V.scale(digit.axis, station));
}

/**
 * Nearest forward intersection of a ray with some pieces' triangles
 * (Moller-Trumbore), with the barycentric interpolation of the vertex
 * normals there.
 *
 * @param list Pieces in mm
 * @param origin Ray origin
 * @param direction Unit ray direction
 * @returns Hit point and unit normal, or null
 */
function cast(
  list: readonly AutoMovieHumanSkinChart.IOutput[],
  origin: Vec3,
  direction: Vec3,
): [Vec3, Vec3] | null {
  let best: number = Infinity;
  let result: [Vec3, Vec3] | null = null;
  for (const piece of list)
    for (let t: number = 0; t < piece.indices.length; t += 3) {
      const ia: number = piece.indices[t]!;
      const ib: number = piece.indices[t + 1]!;
      const ic: number = piece.indices[t + 2]!;
      const a: Vec3 = V.at(piece.positions, ia);
      const e1: Vec3 = V.sub(V.at(piece.positions, ib), a);
      const e2: Vec3 = V.sub(V.at(piece.positions, ic), a);
      const p: Vec3 = V.cross(direction, e2);
      const det: number = V.dot(e1, p);
      if (Math.abs(det) < 1e-12) continue;
      const q: Vec3 = V.sub(origin, a);
      const u: number = V.dot(q, p) / det;
      if (u < 0 || u > 1) continue;
      const w: Vec3 = V.cross(q, e1);
      const v: number = V.dot(direction, w) / det;
      if (v < 0 || u + v > 1) continue;
      const distance: number = V.dot(e2, w) / det;
      if (distance <= 0 || distance >= best) continue;
      best = distance;
      const n: Vec3 = V.normalize(
        V.add(
          V.scale(V.at(piece.normals, ia), 1 - u - v),
          V.add(
            V.scale(V.at(piece.normals, ib), u),
            V.scale(V.at(piece.normals, ic), v),
          ),
        ),
      );
      result = [V.add(origin, V.scale(direction, distance)), n];
    }
  return result;
}

/**
 * Vertex centroid of several pieces.
 *
 * @param pieces Pieces in mm
 * @returns Centroid
 */
function mean(pieces: readonly AutoMovieHumanSkinChart.IOutput[]): Vec3 {
  const all: number[] = pieces.flatMap(
    (piece: AutoMovieHumanSkinChart.IOutput): number[] => piece.positions,
  );
  return V.centroid(all);
}

/**
 * Centroids of a chain's first and last bands.
 *
 * @param pieces One chain's pieces
 * @returns Lowest-band and highest-band centroids
 */
function extremes(
  pieces: readonly AutoMovieHumanSkinChart.IOutput[],
): [Vec3, Vec3] {
  const band: (p: AutoMovieHumanSkinChart.IOutput) => number = (
    p: AutoMovieHumanSkinChart.IOutput,
  ): number => Number(p.name.slice(p.name.lastIndexOf("/") + 1));
  const sorted: AutoMovieHumanSkinChart.IOutput[] = [...pieces].sort(
    (
      a: AutoMovieHumanSkinChart.IOutput,
      b: AutoMovieHumanSkinChart.IOutput,
    ): number => band(a) - band(b),
  );
  return [
    V.centroid(sorted[0]!.positions),
    V.centroid(sorted[sorted.length - 1]!.positions),
  ];
}

/** Images of the first {@link images} call. */
let cache: IAutoMovieImage[] | null = null;

/**
 * The shared nail images: sRGB colour with coverage alpha, and a normal map,
 * both with u across the nail and v from the cuticle (row 0) to the free
 * edge.
 *
 * Coverage is a rounded nail outline: a cuticle arc bowing toward the root
 * at the middle by a fifth of the length, lateral folds at 0.88 of the
 * half-width and a free edge rounded by a sixth of the length. Colour is a
 * pink bed, a faint whiter lunula in the proximal fifth, a slightly darker
 * cuticle band, a pinker onychodermal line and a cream free edge in the
 * distal tenth, with
 * longitudinal streaks of 2 percent. Height rises over the outer 12 percent
 * of the outline and carries very faint longitudinal ridges, so the plate
 * edge reads as rounded. All values are conventions.
 *
 * @returns Colour and normal images
 */
function images(): IAutoMovieImage[] {
  if (cache !== null)
    return cache.map(
      (image: IAutoMovieImage): IAutoMovieImage => ({
        ...image,
      }),
    );
  const N: number = AutoMovieHumanNail.size;
  const noise: typeof AutoMovieHumanAppearanceNoise =
    AutoMovieHumanAppearanceNoise;
  const color: Uint8Array = new Uint8Array(N * N * 4);
  const height: Float64Array = new Float64Array(N * N);
  const px: number = 1 / N;
  for (let y: number = 0; y < N; ++y)
    for (let x: number = 0; x < N; ++x) {
      const u: number = (x + 0.5) / N;
      const v: number = (y + 0.5) / N;
      const across: number = Math.abs(2 * u - 1);
      const proximal: number = 0.04 + 0.2 * across * across;
      const free: number = 0.99 - 0.16 * across ** 2.5;

      // Signed distance inside the outline, in normalized units.
      const inside: number = Math.min(
        v - proximal,
        free - v,
        (0.88 - across) * 0.5,
      );
      const coverage: number = AutoMovieHumanAppearanceNoise.smoothstep(
        -px,
        px,
        inside,
      );
      const depth: number = (v - proximal) / Math.max(1e-6, free - proximal);

      // Bed, then lunula, cuticle band, onychodermal line and free edge.
      let c: [number, number, number] = [0.82, 0.47, 0.46];
      const lunula: number =
        1 -
        AutoMovieHumanAppearanceNoise.smoothstep(
          0.12,
          0.2,
          depth + 0.08 * across * across,
        );
      c = mix(c, [0.86, 0.72, 0.7], 0.6 * lunula);
      const cuticle: number =
        1 - AutoMovieHumanAppearanceNoise.smoothstep(0.0, 0.035, depth);
      c = mix(c, [0.7, 0.45, 0.43], 0.5 * cuticle);
      const edge: number = AutoMovieHumanAppearanceNoise.smoothstep(
        0.9,
        0.93,
        depth,
      );
      const line: number = Math.exp(-(((depth - 0.91) / 0.015) ** 2));
      c = mix(c, [0.96, 0.9, 0.84], edge);
      c = mix(c, [0.72, 0.42, 0.42], 0.35 * line);
      const streak: number =
        1 + 0.02 * (noise.periodic1(951, u * 48, 48) - 0.5);
      const at: number = (y * N + x) * 4;
      for (let k: number = 0; k < 3; ++k)
        color[at + k] = srgb(Math.min(1, c[k]! * streak));
      color[at + 3] = Math.round(255 * coverage);

      height[y * N + x] =
        0.012 *
          AutoMovieHumanAppearanceNoise.smoothstep(
            0,
            0.1,
            Math.max(0, inside),
          ) +
        0.0002 * noise.periodic1(952, u * 64, 64);
    }

  // Normal map from the height in normalized units over the nail width.
  const normal: Uint8Array = new Uint8Array(N * N * 3);
  for (let y: number = 0; y < N; ++y)
    for (let x: number = 0; x < N; ++x) {
      const dx: number =
        (height[y * N + Math.min(N - 1, x + 1)]! -
          height[y * N + Math.max(0, x - 1)]!) /
        (2 * px);
      const dy: number =
        (height[Math.min(N - 1, y + 1) * N + x]! -
          height[Math.max(0, y - 1) * N + x]!) /
        (2 * px);
      const length: number = Math.hypot(dx, dy, 1);
      const at: number = (y * N + x) * 3;
      normal[at] = Math.round(127.5 * (1 - dx / length));
      normal[at + 1] = Math.round(127.5 * (1 - dy / length));
      normal[at + 2] = Math.round(127.5 * (1 + 1 / length));
    }
  cache = [
    {
      id: AutoMovieHumanNail.colorId,
      mimeType: "image/png",
      data: encodeAutoMoviePng({
        width: N,
        height: N,
        channels: 4,
        pixels: color,
      }),
    },
    {
      id: AutoMovieHumanNail.normalId,
      mimeType: "image/png",
      data: encodeAutoMoviePng({
        width: N,
        height: N,
        channels: 3,
        pixels: normal,
      }),
    },
  ];
  return images();
}

/**
 * Linear blend of two colours.
 *
 * @param a First colour
 * @param b Second colour
 * @param t Weight of the second, `[0, 1]`
 * @returns Blended colour
 */
function mix(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
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
