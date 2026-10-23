import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanAppearanceBody } from "./IAutoMovieHumanAppearanceBody";

/**
 * Star-shaped chart of the generated head skin about a centre inside the
 * vault: for every direction from the centre, the distance to the
 * outermost head-skin crossing.
 *
 * Representation: a regular grid over azimuth `alpha` (from +X toward +Z,
 * 128 cells) and elevation `beta` (from -90 to +90 degrees, 64 cells),
 * each cell holding the outermost ray crossing at its centre, read back by
 * bilinear interpolation. The scalp, forehead, temples and nape are
 * star-shaped about a centre at the vault's middle, so one crossing per
 * direction describes them; the face (nose, lips) and ears are not, but
 * hair never attaches there and the outermost crossing is the conservative
 * one for keeping strands outside. Directions that hit no head skin (the
 * open neck end) hold zero, which imposes no clearance.
 *
 * The chart is a measurement of the rendered skin, so roots and strands
 * follow any head-shape change of the body generator. Grid cells are
 * angular, so their physical size grows with the radius (about 4.5 mm at a
 * 95 mm scalp radius); scalp features below that size are not resolved by
 * this chart. Root addresses are directions, independent of the skin's
 * tessellation and part split.
 *
 * Frame: head-local millimetres, axes parallel to the model's registered
 * axes, origin at {@link IField.centre}.
 */
export namespace AutoMovieHumanHeadField {
  /** Azimuth cells. */
  export const azimuthCells: number = 128;

  /** Elevation cells. */
  export const elevationCells: number = 64;

  /** Evaluated head chart. */
  export interface IField {
    /** Chart centre in model millimetres. */
    centre: [number, number, number];

    /** Model height of the eyes' centres, millimetres. */
    eyeLevel: number;

    /** Highest head-skin point (vertex) in model millimetres. */
    top: number;

    /** Head height parameter (menton to vertex), millimetres. */
    height: number;

    /** Outermost crossing distance per cell, millimetres; zero where none. */
    radii: Float64Array;
  }

  /**
   * Measure the head chart of a generated body.
   *
   * The centre lies at the eye level plus a tenth of the head height,
   * horizontally at the middle of the head skin's extent at that level,
   * which keeps it inside the vault for adult proportions (eye level is
   * about half the head height below the vertex).
   *
   * @param params Human parameters; `head.height` is read
   * @param body Body facts: eye frames and generated parts
   * @returns The head chart
   * @throws {Error} When the body has no head skin (see {@link owns})
   */
  export function create(
    params: IAutoMovieHumanParameters,
    body: IAutoMovieHumanAppearanceBody,
  ): IField {
    const triangles: number[] = collect(body.parts);
    if (triangles.length === 0)
      throw new Error("Human head field needs head skin parts");

    const height: number = params.head.height;
    const eyeLevel: number =
      ((body.eyePair.left.centre[1] + body.eyePair.right.centre[1]) / 2) * 1000;

    // Vertex height, and the horizontal extent of the skin in a 20 mm slab
    // at the centre's height.
    const level: number = eyeLevel + 0.1 * height;
    let top: number = -Infinity;
    const box: number[] = [Infinity, -Infinity, Infinity, -Infinity];
    for (let i: number = 0; i < triangles.length; i += 3) {
      const y: number = triangles[i + 1]!;
      top = Math.max(top, y);
      if (Math.abs(y - level) > 10) continue;
      box[0] = Math.min(box[0]!, triangles[i]!);
      box[1] = Math.max(box[1]!, triangles[i]!);
      box[2] = Math.min(box[2]!, triangles[i + 2]!);
      box[3] = Math.max(box[3]!, triangles[i + 2]!);
    }
    const centre: [number, number, number] = [
      (box[0]! + box[1]!) / 2,
      level,
      (box[2]! + box[3]!) / 2,
    ];

    // Head-local triangles, then the outermost crossing per cell.
    for (let i: number = 0; i < triangles.length; i += 3)
      for (let a: number = 0; a < 3; ++a) triangles[i + a]! -= centre[a]!;
    return {
      centre,
      eyeLevel,
      top,
      height,
      radii: cast(triangles),
    };
  }

  /**
   * Whether a part is head skin this chart measures: the skin intervals of
   * the `head` chain and of every chain whose name extends it or `ear`
   * (`human.skin.head/<k>`, `human.skin.head.<sub>/<k>`,
   * `human.skin.ear.<sub>/<k>`), read from the id's chain name rather than
   * a fixed list, so new head sub-chains join without a change here.
   *
   * Ears are included because hair hanging past them (a bob) or lying near
   * them (short sides) must clear the auricle rather than pass through it;
   * no root lands on an ear, since the scalp boundary runs above it.
   *
   * @param id Part id
   * @returns True for head, head sub-chain and ear skin
   */
  export function owns(id: string): boolean {
    return /^human\.skin\.(head|ear)(\.[^/]+)?\//.test(id);
  }

  /**
   * Unit direction of chart angles.
   *
   * @param alpha Azimuth from +X toward +Z, radians
   * @param beta Elevation from the horizontal plane, radians
   * @returns Unit vector in the head-local frame
   */
  export function direction(
    alpha: number,
    beta: number,
  ): [number, number, number] {
    const c: number = Math.cos(beta);
    return [c * Math.cos(alpha), Math.sin(beta), c * Math.sin(alpha)];
  }

  /**
   * Skin distance from the centre along a direction, by bilinear
   * interpolation of the cell-centred grid (periodic in azimuth, clamped
   * in elevation).
   *
   * @param field Head chart
   * @param u Direction in the head-local frame; need not be unit
   * @returns Distance in millimetres, zero where the skin is absent
   */
  export function radius(field: IField, u: [number, number, number]): number {
    const length: number = Math.hypot(u[0], u[1], u[2]) || 1;
    const alpha: number = Math.atan2(u[2], u[0]);
    const beta: number = Math.asin(Math.max(-1, Math.min(1, u[1] / length)));

    const fa: number = (alpha / (2 * Math.PI)) * azimuthCells - 0.5;
    const fb: number = ((beta + Math.PI / 2) / Math.PI) * elevationCells - 0.5;
    const ia: number = Math.floor(fa);
    const ib: number = Math.floor(fb);
    const ta: number = fa - ia;
    const tb: number = Math.min(1, Math.max(0, fb - ib));
    const at: (i: number, j: number) => number = (
      i: number,
      j: number,
    ): number =>
      field.radii[
        Math.min(elevationCells - 1, Math.max(0, j)) * azimuthCells +
          (((i % azimuthCells) + azimuthCells) % azimuthCells)
      ]!;
    const lower: number = at(ia, ib) + (at(ia + 1, ib) - at(ia, ib)) * ta;
    const upper: number =
      at(ia, ib + 1) + (at(ia + 1, ib + 1) - at(ia, ib + 1)) * ta;
    return lower + (upper - lower) * tb;
  }
}

/**
 * Flat head-skin triangle soup in model millimetres.
 *
 * @param parts Generated body parts in metres
 * @returns Vertex triples, nine numbers per triangle
 */
function collect(parts: IAutoMovieModelPart[]): number[] {
  const out: number[] = [];
  for (const part of parts) {
    if (!AutoMovieHumanHeadField.owns(part.id)) continue;
    if (part.geometry.type !== "mesh") continue;
    const p: number[] = part.geometry.mesh.positions;
    const index: number[] | null = part.geometry.mesh.indices;
    const count: number = index === null ? p.length / 3 : index.length;
    for (let i: number = 0; i < count; ++i) {
      const v: number = index === null ? i : index[i]!;
      out.push(p[v * 3]! * 1000, p[v * 3 + 1]! * 1000, p[v * 3 + 2]! * 1000);
    }
  }
  return out;
}

/**
 * Outermost crossing of every cell-centre ray from the origin.
 *
 * Each triangle is binned into the cells its angular bounding box covers,
 * widened by one cell because great-circle edges can bulge past their
 * vertices' elevation range; a triangle around a pole direction (one whose
 * vertices' azimuths leave no gap over half a turn) is binned into every
 * azimuth of its elevation band. Each ray then runs the Moller-Trumbore
 * test (1997) against its own cell's triangles only.
 *
 * @param soup Head-local triangle soup, millimetres
 * @returns Distance per cell, row-major by elevation; zero without a crossing
 */
function cast(soup: number[]): Float64Array {
  const NA: number = AutoMovieHumanHeadField.azimuthCells;
  const NB: number = AutoMovieHumanHeadField.elevationCells;
  const bins: number[][] = Array.from({ length: NA * NB }, (): number[] => []);

  for (let t: number = 0; t < soup.length; t += 9) {
    const alphas: number[] = [];
    let bMin: number = Infinity;
    let bMax: number = -Infinity;
    for (let k: number = 0; k < 3; ++k) {
      const x: number = soup[t + k * 3]!;
      const y: number = soup[t + k * 3 + 1]!;
      const z: number = soup[t + k * 3 + 2]!;
      const b: number = Math.atan2(y, Math.hypot(x, z));
      bMin = Math.min(bMin, b);
      bMax = Math.max(bMax, b);
      alphas.push(Math.atan2(z, x));
    }

    // Smallest azimuth arc covering the three vertices: everything except
    // the largest circular gap between them.
    alphas.sort((a: number, b: number): number => a - b);
    const gaps: number[] = [
      alphas[1]! - alphas[0]!,
      alphas[2]! - alphas[1]!,
      alphas[0]! + 2 * Math.PI - alphas[2]!,
    ];
    const g: number = gaps.indexOf(Math.max(...gaps));
    const polar: boolean = gaps[g]! < Math.PI;
    const from: number = alphas[(g + 1) % 3]!;
    const span: number = polar ? 2 * Math.PI : 2 * Math.PI - gaps[g]!;

    const j0: number = Math.max(
      0,
      Math.floor(((bMin + Math.PI / 2) / Math.PI) * NB) - 1,
    );
    const j1: number = Math.min(
      NB - 1,
      Math.floor(((bMax + Math.PI / 2) / Math.PI) * NB) + 1,
    );
    const i0: number = Math.floor((from / (2 * Math.PI)) * NA) - 1;
    const i1: number = polar
      ? i0 + NA - 1
      : Math.floor(((from + span) / (2 * Math.PI)) * NA) + 1;
    for (let j: number = j0; j <= j1; ++j)
      for (let i: number = i0; i <= Math.min(i1, i0 + NA - 1); ++i)
        bins[j * NA + (((i % NA) + NA) % NA)]!.push(t);
  }

  const radii: Float64Array = new Float64Array(NA * NB);
  for (let j: number = 0; j < NB; ++j)
    for (let i: number = 0; i < NA; ++i) {
      const d: [number, number, number] = AutoMovieHumanHeadField.direction(
        ((i + 0.5) / NA) * 2 * Math.PI,
        ((j + 0.5) / NB) * Math.PI - Math.PI / 2,
      );
      let best: number = 0;
      for (const t of bins[j * NA + i]!) {
        const hit: number = crossing(soup, t, d);
        if (hit > best) best = hit;
      }
      radii[j * NA + i] = best;
    }
  return radii;
}

/**
 * Ray parameter where a ray from the origin crosses one triangle.
 *
 * @param soup Triangle soup
 * @param t Offset of the triangle's first coordinate
 * @param d Unit ray direction
 * @returns Positive distance, or zero without a crossing
 */
function crossing(
  soup: number[],
  t: number,
  d: [number, number, number],
): number {
  const ax: number = soup[t]!;
  const ay: number = soup[t + 1]!;
  const az: number = soup[t + 2]!;
  const e1x: number = soup[t + 3]! - ax;
  const e1y: number = soup[t + 4]! - ay;
  const e1z: number = soup[t + 5]! - az;
  const e2x: number = soup[t + 6]! - ax;
  const e2y: number = soup[t + 7]! - ay;
  const e2z: number = soup[t + 8]! - az;

  // p = d x e2, det = e1 . p
  const px: number = d[1] * e2z - d[2] * e2y;
  const py: number = d[2] * e2x - d[0] * e2z;
  const pz: number = d[0] * e2y - d[1] * e2x;
  const det: number = e1x * px + e1y * py + e1z * pz;
  if (Math.abs(det) < 1e-12) return 0;
  const inv: number = 1 / det;

  // s = origin - a = -a
  const u: number = (-ax * px - ay * py - az * pz) * inv;
  if (u < 0 || u > 1) return 0;
  const qx: number = -ay * e1z + az * e1y;
  const qy: number = -az * e1x + ax * e1z;
  const qz: number = -ax * e1y + ay * e1x;
  const v: number = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
  if (v < 0 || u + v > 1) return 0;
  const distance: number = (e2x * qx + e2y * qy + e2z * qz) * inv;
  return distance > 0 ? distance : 0;
}
