import type {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
  IAutoMovieSurfaceLayout,
  IAutoMovieSurfaceNetwork,
} from "@automovie/interface";

/*
 * Create the face layout of a network's cage.
 *
 * Each emitted patch adds its faces row by row from `t` 0, each row from `s` 0,
 * wound counterclockwise as `(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)`;
 * every face corner carries `(patch, s, t)` and a UV value, the patch's
 * rectangle in texture space or, where it declares none, the band `t in [k / P,
 * (k + 1) / P]` of the unit square for patch `k` of `P`. A patch's UVs are its
 * own, so seams between patches stay seams in texture space. A patch whose
 * faces are no grid, a transition band, gives each corner its own coordinates
 * instead, and corners at the same coordinates share a UV value. `check` then
 * requires every directed edge to appear once.
 * Parameter network: The network, only read.
 * Returns: The empty layout.
 */
export const layoutSurfacePatches: (
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
  function patchAt(index: number): IAutoMovieSurfaceNetwork.IPatch {
    const patch =
      Number.isSafeInteger(index) && index >= 0
        ? network.patches[index]
        : undefined;
    if (!patch) throw new Error(`surface layout lacks patch ${index}`);
    return patch;
  }
  function rectFor(
    patch: IAutoMovieSurfaceNetwork.IPatch,
    index: number,
  ): IAutoMovieSurfaceNetwork.IUvRect {
    const rect = patch.uv ?? {
      s: { atZero: 0, atOne: 1 },
      t: { atZero: index / total, atOne: (index + 1) / total },
    };
    if (
      ![rect.s.atZero, rect.s.atOne, rect.t.atZero, rect.t.atOne].every(
        Number.isFinite,
      )
    )
      throw new Error("surface layout UV endpoints must be finite");
    return rect;
  }
  function emit(
    p: number,
    grid: number[][],
    columns: number,
    rows: number,
    wrap: boolean,
  ): void {
    const patch: IAutoMovieSurfaceNetwork.IPatch = patchAt(p);
    if (
      !Number.isSafeInteger(columns) ||
      columns <= 0 ||
      !Number.isSafeInteger(rows) ||
      rows <= 0 ||
      !Number.isSafeInteger((columns + 1) * (rows + 1))
    )
      throw new Error(
        "surface layout grid counts must be positive safe integers",
      );
    const used: number = wrap ? columns : columns + 1;
    for (let j: number = 0; j <= rows; j++) {
      const row: number[] | undefined = grid[j];
      if (!row || row.length < used)
        throw new Error(`surface layout grid row ${j} is incomplete`);
      for (let i: number = 0; i < used; i++)
        if (!Number.isSafeInteger(row[i]) || row[i]! < 0)
          throw new Error(
            `surface layout grid vertex ${i},${j} is not a safe ordinal`,
          );
    }
    const rect: IAutoMovieSurfaceNetwork.IUvRect = rectFor(patch, p);
    const uv: number[][] = Array.from(
      { length: rows + 1 },
      (_: unknown, j: number): number[] =>
        Array.from(
          { length: columns + 1 },
          (__: unknown, i: number): number => {
            uvs.push(blendUv(rect.s, i, columns), blendUv(rect.t, j, rows));
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
    const patch: IAutoMovieSurfaceNetwork.IPatch = patchAt(p);
    if (
      !Number.isSafeInteger(columns) ||
      columns < 0 ||
      !Number.isSafeInteger(rows) ||
      rows < 0
    )
      throw new Error(
        "surface layout counts must be nonnegative safe integers",
      );
    for (const quad of quads) {
      if (!quad || quad.length !== 4)
        throw new Error("surface layout requires four chart corners per quad");
      for (const corner of quad) {
        if (!corner || corner.length !== 3)
          throw new Error(
            "surface layout requires complete ordinal, s and t triples",
          );
        const [vertex, s, t] = corner;
        if (
          !Number.isSafeInteger(vertex) ||
          vertex < 0 ||
          !Number.isFinite(s) ||
          s < 0 ||
          s > 1 ||
          !Number.isFinite(t) ||
          t < 0 ||
          t > 1
        )
          throw new Error(
            "surface layout requires a safe vertex and finite chart coordinates in 0 to 1",
          );
      }
    }
    const rect: IAutoMovieSurfaceNetwork.IUvRect = rectFor(patch, p);
    const shared: Map<string, number> = new Map();
    function uv(s: number, t: number): number {
      const key: string = `${s},${t}`;
      let i: number | undefined = shared.get(key);
      if (i === undefined) {
        uvs.push(blendUv(rect.s, s, 1), blendUv(rect.t, t, 1));
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

/* Keep the ordinary directed UV interpolation and recover finite convex values. */
function blendUv(
  axis: IAutoMovieSurfaceNetwork.IUvAxisMapping,
  numerator: number,
  denominator: number,
): number {
  if (numerator === 0) return axis.atZero;
  if (numerator === denominator) return axis.atOne;
  const difference: number = axis.atOne - axis.atZero;
  const ordinary: number = axis.atZero + (difference * numerator) / denominator;
  if (Number.isFinite(ordinary)) return ordinary;
  const fraction: number = numerator / denominator;
  const reordered: number = axis.atZero + difference * fraction;
  return Number.isFinite(reordered)
    ? reordered
    : axis.atZero * (1 - fraction) + axis.atOne * fraction;
}
