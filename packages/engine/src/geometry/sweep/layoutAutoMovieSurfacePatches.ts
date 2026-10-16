import { IAutoMovieSurfaceCage } from "./IAutoMovieSurfaceCage";
import { IAutoMovieSurfaceCoordinate } from "./IAutoMovieSurfaceCoordinate";
import { IAutoMovieSurfaceLayout } from "./IAutoMovieSurfaceLayout";
import { IAutoMovieSurfaceNetwork } from "./IAutoMovieSurfaceNetwork";

/**
 * Create the face layout of a network's cage.
 *
 * Each emitted patch adds its faces row by row from `t` 0, each row from `s`
 * 0, wound counterclockwise as `(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)`;
 * every face corner carries `(patch, s, t)` and a UV value, the patch's
 * rectangle in texture space or, where it declares none, the band
 * `t in [k / P, (k + 1) / P]` of the unit square for patch `k` of `P`. A
 * patch's UVs are its own, so seams between patches stay seams in texture
 * space. A patch whose faces are no grid, a transition band, gives each
 * corner its own coordinates instead, and corners at the same coordinates
 * share a UV value. `check` then requires every directed edge to appear once.
 *
 * @param network The network, only read.
 * @returns The empty layout.
 *
 * @evidence contracts/common.md#principled-implementation A structured multi-block layout: per-patch grids, face-varying UVs and the shared `(patch, s, t)` chart.
 * @evidence contracts/common.md#clear-and-simple-design Topology and texture layout in one module, separate from evaluation, because they depend only on the declared counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Overlapping or misoriented patches are refused, not repaired.
 * @evidence contracts/common.md#meaningful-documentation States the face order, winding, coordinates, UV default and the check.
 * @evidence contracts/performance.md#efficient-algorithms O(F) for F faces, emitting and checking.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per rig.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains the face, UV and corner arrays, O(F), which the cage record takes over; the edge set of `check` is released on return.
 */
export const layoutAutoMovieSurfacePatches: (
  network: IAutoMovieSurfaceNetwork,
) => IAutoMovieSurfaceLayout = (
  network: IAutoMovieSurfaceNetwork,
): IAutoMovieSurfaceLayout => {
  const faces: number[][] = [];
  const corners: IAutoMovieSurfaceCage["corners"] = [];
  const uvs: number[] = [];
  const uvFaces: number[][] = [];
  const grids: IAutoMovieSurfaceCage.IPatch[] = [];
  const total: number = network.patches.length;
  function emit(
    p: number,
    grid: number[][],
    columns: number,
    rows: number,
    wrap: boolean,
  ): void {
    const patch: IAutoMovieSurfaceNetwork.IPatch = network.patches[p]!;
    const rect: IAutoMovieSurfaceNetwork.IUvRect = patch.uv ?? {
      s: [0, 1],
      t: [p / total, (p + 1) / total],
    };
    const uv: number[][] = Array.from(
      { length: rows + 1 },
      (_: unknown, j: number): number[] =>
        Array.from(
          { length: columns + 1 },
          (__: unknown, i: number): number => {
            uvs.push(
              rect.s[0] + ((rect.s[1] - rect.s[0]) * i) / columns,
              rect.t[0] + ((rect.t[1] - rect.t[0]) * j) / rows,
            );
            return uvs.length / 2 - 1;
          },
        ),
    );
    function at(i: number, j: number): number {
      return grid[j]![wrap ? i % columns : i]!;
    }
    const faceList: number[] = [];
    for (let j: number = 0; j < rows; ++j)
      for (let i: number = 0; i < columns; ++i) {
        const quad: Array<[number, number]> = [
          [i, j],
          [i + 1, j],
          [i + 1, j + 1],
          [i, j + 1],
        ];
        faceList.push(faces.length);
        faces.push(quad.map(([a, b]: [number, number]): number => at(a, b)));
        uvFaces.push(
          quad.map(([a, b]: [number, number]): number => uv[b]![a]!),
        );
        corners.push(
          quad.map(
            ([a, b]: [number, number]): IAutoMovieSurfaceCoordinate => ({
              patch: p,
              s: a / columns,
              t: b / rows,
            }),
          ) as IAutoMovieSurfaceCage["corners"][number],
        );
      }
    grids[p] = { name: patch.name, columns, rows, grid: true, faces: faceList };
  }
  function emitFaces(
    p: number,
    quads: Array<Array<[number, number, number]>>,
    columns: number,
    rows: number,
  ): void {
    const patch: IAutoMovieSurfaceNetwork.IPatch = network.patches[p]!;
    const rect: IAutoMovieSurfaceNetwork.IUvRect = patch.uv ?? {
      s: [0, 1],
      t: [p / total, (p + 1) / total],
    };
    const shared: Map<string, number> = new Map();
    function uv(s: number, t: number): number {
      const key: string = `${s},${t}`;
      let i: number | undefined = shared.get(key);
      if (i === undefined) {
        uvs.push(
          rect.s[0] + (rect.s[1] - rect.s[0]) * s,
          rect.t[0] + (rect.t[1] - rect.t[0]) * t,
        );
        shared.set(key, (i = uvs.length / 2 - 1));
      }
      return i;
    }
    const faceList: number[] = [];
    for (const quad of quads) {
      faceList.push(faces.length);
      faces.push(quad.map(([v]: [number, number, number]): number => v));
      uvFaces.push(
        quad.map(([, s, t]: [number, number, number]): number => uv(s, t)),
      );
      corners.push(
        quad.map(
          ([, s, t]: [
            number,
            number,
            number,
          ]): IAutoMovieSurfaceCoordinate => ({ patch: p, s, t }),
        ) as IAutoMovieSurfaceCage["corners"][number],
      );
    }
    grids[p] = {
      name: patch.name,
      columns,
      rows,
      grid: false,
      faces: faceList,
    };
  }
  function check(): void {
    // every directed edge once: patches neither overlap nor disagree in winding
    const directed: Set<string> = new Set();
    faces.forEach((quad: number[]): void => {
      for (let k: number = 0; k < 4; ++k) {
        const key: string = `${quad[k]},${quad[(k + 1) % 4]}`;
        if (directed.has(key))
          throw new Error(
            `patches overlap or wind inconsistently at edge ${key}`,
          );
        directed.add(key);
      }
    });
  }
  return { faces, uvs, uvFaces, corners, grids, emit, emitFaces, check };
};
