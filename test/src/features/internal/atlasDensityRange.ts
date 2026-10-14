import { type IAutoMovieMesh } from "@automovie/interface";

import { type IAtlasDensityRange } from "./IAtlasDensityRange";

/**
 * Measure the unsigned UV determinant area over the XYZ cross-product area of each emitted indexed triangle, independently of the builder's atlas construction. A ratio of one preserves area in ideal arithmetic; it does not establish directional shear, filtering or the appearance of a rendered finish.
 *
 * The loft and revolve entries share this observer and supply indexed meshes with matching position/UV buffers. Surface area at or below 1e-12 is counted and excluded from extrema, which callers require to be zero; an empty retained population leaves infinite extrema, while malformed or overflowing arithmetic can propagate NaN. The helper performs no mesh admission or coordinate repair.
 *
 * O(triangle count) work uses constant live corner/edge scratch records, with ordinary binary64 determinant error. The caller owns the returned range; all input buffers are borrowed read-only and no measurement, host or cache survives this call.
 */
export const atlasDensityRange: (mesh: IAutoMovieMesh) => IAtlasDensityRange = (
  mesh: IAutoMovieMesh,
): IAtlasDensityRange => {
  const indices: number[] = mesh.indices!;
  const range: IAtlasDensityRange = {
    least: Number.POSITIVE_INFINITY,
    most: Number.NEGATIVE_INFINITY,
    degenerate: 0,
  };
  for (let at: number = 0; at < indices.length; at += 3) {
    const cornerAt: (offset: number) => {
      position: readonly number[];
      atlas: readonly number[];
    } = (
      offset: number,
    ): { position: readonly number[]; atlas: readonly number[] } => {
      const index: number = indices[at + offset]!;
      return {
        position: [
          mesh.positions[index * 3]!,
          mesh.positions[index * 3 + 1]!,
          mesh.positions[index * 3 + 2]!,
        ],
        atlas: [mesh.uvs![index * 2]!, mesh.uvs![index * 2 + 1]!],
      };
    };
    const origin: { position: readonly number[]; atlas: readonly number[] } =
      cornerAt(0);
    const alpha: { position: readonly number[]; atlas: readonly number[] } =
      cornerAt(1);
    const beta: { position: readonly number[]; atlas: readonly number[] } =
      cornerAt(2);
    const first: number[] = alpha.position.map(
      (value: number, axis: number): number => value - origin.position[axis]!,
    );
    const second: number[] = beta.position.map(
      (value: number, axis: number): number => value - origin.position[axis]!,
    );
    const surface: number =
      Math.hypot(
        first[1]! * second[2]! - first[2]! * second[1]!,
        first[2]! * second[0]! - first[0]! * second[2]!,
        first[0]! * second[1]! - first[1]! * second[0]!,
      ) / 2;
    if (surface <= 1e-12) {
      range.degenerate += 1;
      continue;
    }
    const atlas: number =
      Math.abs(
        (alpha.atlas[0]! - origin.atlas[0]!) *
          (beta.atlas[1]! - origin.atlas[1]!) -
          (alpha.atlas[1]! - origin.atlas[1]!) *
            (beta.atlas[0]! - origin.atlas[0]!),
      ) / 2;
    const ratio: number = atlas / surface;
    range.least = Math.min(range.least, ratio);
    range.most = Math.max(range.most, ratio);
  }
  return range;
};
