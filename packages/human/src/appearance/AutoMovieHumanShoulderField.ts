import type { IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * Height of the body's upper surface around and below the head: for each
 * horizontal position, the highest crossing of a vertical line with the
 * non-head skin (neck base, shoulders, upper back and chest).
 *
 * Hanging hair falls from above, so the first body surface it meets is the
 * highest one under it; a strand that would pass below that height has
 * reached the shoulders and ends there. This realises the bob definition's
 * "at most to the shoulders" for any authored length.
 *
 * Representation: a 2 mm grid over a 520 x 360 mm window (lateral by
 * fore-aft) centred under the head chart, each cell holding the highest
 * crossing at its centre or minus infinity where no skin lies below; read
 * by nearest cell. Triangles are binned by their horizontal bounding box,
 * so each vertical ray tests only the triangles above its cell. The head
 * and ear skin is excluded (the head chart owns it, see
 * `AutoMovieHumanHeadField.owns`).
 */
export namespace AutoMovieHumanShoulderField {
  /** Cell size, millimetres. */
  export const cell: number = 2;

  /** Evaluated height field. */
  export interface IField {
    /** Model x of the window's first cell edge, millimetres. */
    x0: number;

    /** Model z of the window's first cell edge, millimetres. */
    z0: number;

    /** Cells along x. */
    nx: number;

    /** Cells along z. */
    nz: number;

    /** Highest crossing per cell, model millimetres; -Infinity where none. */
    heights: Float64Array;
  }

  /**
   * Measure the field under a head.
   *
   * @param parts Generated body parts in metres
   * @param head Head chart, for the window centre
   * @returns Height field
   */
  export function create(
    parts: IAutoMovieModelPart[],
    head: AutoMovieHumanHeadField.IField,
  ): IField {
    const nx: number = 360 / cell;
    const nz: number = 520 / cell;
    const x0: number = head.centre[0] - 180;
    const z0: number = head.centre[2] - 260;
    const bottom: number = head.top - 600;
    const bins: number[][][] = Array.from(
      { length: nx * nz },
      (): number[][] => [],
    );

    for (const part of parts) {
      if (!part.id.startsWith("human.skin.")) continue;
      if (AutoMovieHumanHeadField.owns(part.id)) continue;
      if (part.geometry.type !== "mesh") continue;
      const p: number[] = part.geometry.mesh.positions;
      const index: number[] | null = part.geometry.mesh.indices;
      const count: number = index === null ? p.length / 3 : index.length;
      for (let i: number = 0; i < count; i += 3) {
        const t: number[] = [];
        for (let k: number = 0; k < 3; ++k) {
          const v: number = index === null ? i + k : index[i + k]!;
          t.push(p[v * 3]! * 1000, p[v * 3 + 1]! * 1000, p[v * 3 + 2]! * 1000);
        }
        if (Math.max(t[1]!, t[4]!, t[7]!) < bottom) continue;

        // Bin by horizontal bounding box.
        const i0: number = Math.max(
          0,
          Math.floor((Math.min(t[0]!, t[3]!, t[6]!) - x0) / cell),
        );
        const i1: number = Math.min(
          nx - 1,
          Math.floor((Math.max(t[0]!, t[3]!, t[6]!) - x0) / cell),
        );
        const k0: number = Math.max(
          0,
          Math.floor((Math.min(t[2]!, t[5]!, t[8]!) - z0) / cell),
        );
        const k1: number = Math.min(
          nz - 1,
          Math.floor((Math.max(t[2]!, t[5]!, t[8]!) - z0) / cell),
        );
        for (let a: number = i0; a <= i1; ++a)
          for (let b: number = k0; b <= k1; ++b) bins[b * nx + a]!.push(t);
      }
    }

    // Highest crossing of each cell-centre vertical line: barycentric
    // coordinates of the point in the triangle's x-z projection.
    const heights: Float64Array = new Float64Array(nx * nz).fill(-Infinity);
    for (let b: number = 0; b < nz; ++b)
      for (let a: number = 0; a < nx; ++a) {
        const x: number = x0 + (a + 0.5) * cell;
        const z: number = z0 + (b + 0.5) * cell;
        let best: number = -Infinity;
        for (const t of bins[b * nx + a]!) {
          const ex: number = t[3]! - t[0]!;
          const ez: number = t[5]! - t[2]!;
          const fx: number = t[6]! - t[0]!;
          const fz: number = t[8]! - t[2]!;
          const det: number = ex * fz - ez * fx;
          if (Math.abs(det) < 1e-12) continue;
          const px: number = x - t[0]!;
          const pz: number = z - t[2]!;
          const u: number = (px * fz - pz * fx) / det;
          const v: number = (ex * pz - ez * px) / det;
          if (u < 0 || v < 0 || u + v > 1) continue;
          const y: number = t[1]! + u * (t[4]! - t[1]!) + v * (t[7]! - t[1]!);
          if (y > best) best = y;
        }
        heights[b * nx + a] = best;
      }
    return { x0, z0, nx, nz, heights };
  }

  /**
   * Body surface height under a model point.
   *
   * @param field Height field
   * @param x Model x, millimetres
   * @param z Model z, millimetres
   * @returns Highest skin height there, or -Infinity outside the window or where no skin lies below
   */
  export function height(field: IField, x: number, z: number): number {
    const a: number = Math.floor((x - field.x0) / cell);
    const b: number = Math.floor((z - field.z0) / cell);
    if (a < 0 || b < 0 || a >= field.nx || b >= field.nz) return -Infinity;
    return field.heights[b * field.nx + a]!;
  }
}
