import { AutoMovieHumanHeadSurface } from "./AutoMovieHumanHeadSurface";

/**
 * Geometric normals of the cap's actual queried four-corner topology.
 *
 * Area-weighted incident triangles own this normal field before the cap lift.
 * It avoids importing a contradictory skin shading normal into the cap. The
 * periodic chart seam shares its incident area; no source point is refitted,
 * no head geometry is changed and no small triangle is removed.
 */
export class AutoMovieHumanHairCap {
  /**
   * Derive the cap's normal field from its live periodic query grid.
   *
   * @param grid Rows from low to high and columns around one full turn; null has no source point
   * @param poleRow An explicitly collapsed row whose corners are the same owned source point
   * @returns Unit area-weighted normals, or null where the incident oriented area sum is exactly zero
   */
  public static normals(
    grid: ReadonlyArray<ReadonlyArray<AutoMovieHumanHeadSurface.IPoint | null>>,
    poleRow?: number,
  ): Array<Array<V | null>> {
    const rows: number = grid.length - 1;
    const cols: number = grid[0]!.length - 1;
    const sums: V[][] = grid.map(
      (row: ReadonlyArray<AutoMovieHumanHeadSurface.IPoint | null>): V[] =>
        row.map((): V => [0, 0, 0]),
    );
    for (let i: number = 0; i < rows; ++i)
      for (let j: number = 0; j < cols; ++j) {
        const ids: Array<[number, number]> = [
          [i, j],
          [i, j + 1],
          [i + 1, j],
          [i + 1, j + 1],
        ];
        const points: Array<AutoMovieHumanHeadSurface.IPoint | null> = ids.map(
          ([r, c]: [number, number]): AutoMovieHumanHeadSurface.IPoint | null =>
            grid[r]![c]!,
        );
        if (
          points.some(
            (p: AutoMovieHumanHeadSurface.IPoint | null): boolean => p === null,
          )
        )
          continue;
        for (const tri of [
          [0, 1, 3],
          [0, 3, 2],
        ]) {
          const a: V = points[tri[0]!]!.position;
          const b: V = points[tri[1]!]!.position;
          const c: V = points[tri[2]!]!.position;
          const u: V = sub(b, a);
          const v: V = sub(c, a);
          const normal: V = [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0],
          ];
          for (const k of tri) {
            const [r, col]: [number, number] = ids[k]!;
            for (let axis: number = 0; axis < 3; ++axis)
              sums[r]![col]![axis] += normal[axis]!;
          }
        }
      }
    for (let i: number = 0; i <= rows; ++i) {
      const seam: V = [0, 1, 2].map(
        (axis: number): number => sums[i]![0]![axis]! + sums[i]![cols]![axis]!,
      ) as V;
      sums[i]![0] = seam;
      sums[i]![cols] = seam;
    }
    if (poleRow !== undefined) {
      const pole: AutoMovieHumanHeadSurface.IPoint | null = grid[poleRow]![0]!;
      if (
        pole === null ||
        grid[poleRow]!.some(
          (point: AutoMovieHumanHeadSurface.IPoint | null): boolean =>
            point !== pole,
        )
      )
        throw new Error("Hair cap pole row must share one actual source point");
      const total: V = [0, 0, 0];
      for (let j: number = 0; j < cols; ++j)
        for (let axis: number = 0; axis < 3; ++axis)
          total[axis] += sums[poleRow]![j]![axis]!;
      sums[poleRow] = grid[poleRow]!.map((): V => total);
    }
    return sums.map(
      (row: V[]): Array<V | null> =>
        row.map((v: V): V | null => {
          const length: number = Math.hypot(...v);
          return length === 0
            ? null
            : [v[0] / length, v[1] / length, v[2] / length];
        }),
    );
  }
}
type V = [number, number, number];
function sub(a: V, b: V): V {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
