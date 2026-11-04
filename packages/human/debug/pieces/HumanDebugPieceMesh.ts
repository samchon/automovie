import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";

/**
 * Triangle meshes for pieces that have no skin of their own: grids through rows of points, thin
 * ribbons along a guide, octahedron markers at landmarks, and the part record around them.
 *
 * Coordinates are body millimetres. A closed grid (a tube of rings) is wound to face away from its
 * centroid whatever order its rings were listed in; an open grid keeps the winding its rows give.
 */
export namespace HumanDebugPieceMesh {
  /** Points and triangles, mm. */
  export interface IMesh {
    /** Vertices. */
    points: IHumanDebugDocument.Point[];

    /** Triangle vertex indices. */
    indices: number[];
  }

  /**
   * A surface through rows of equal length.
   *
   * @param rows Rows of points, each as long as the first.
   * @param closed Whether each row closes on itself.
   * @returns The mesh.
   */
  export function grid(
    rows: readonly (readonly IHumanDebugDocument.Point[])[],
    closed: boolean,
  ): IMesh {
    const width: number = rows[0]?.length ?? 0;
    const points: IHumanDebugDocument.Point[] = rows.flatMap(
      (row: readonly IHumanDebugDocument.Point[]): IHumanDebugDocument.Point[] =>
        row.map(
          (p: IHumanDebugDocument.Point): IHumanDebugDocument.Point => [p[0], p[1], p[2]],
        ),
    );
    const indices: number[] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let j: number = 0; j < (closed ? width : width - 1); ++j) {
        const a: number = i * width + j;
        const b: number = i * width + ((j + 1) % width);
        const c: number = (i + 1) * width + j;
        const d: number = (i + 1) * width + ((j + 1) % width);
        indices.push(a, c, b, b, c, d);
      }

    // A closed tube faces out when the flux of its area normals through the offsets from its
    // centroid is positive; a ring listed the other way round is turned over here.
    if (closed && points.length !== 0 && flux(points, indices) < 0)
      for (let t: number = 0; t + 2 < indices.length; t += 3)
        [indices[t + 1], indices[t + 2]] = [indices[t + 2]!, indices[t + 1]!];
    return { points, indices };
  }

  /**
   * A ribbon of a given width along a polyline, so a curve has a surface to show and colour.
   *
   * @param line The polyline, mm.
   * @param side Unit direction the ribbon widens along.
   * @param width Ribbon width, mm.
   * @returns The mesh.
   */
  export function ribbon(
    line: readonly IHumanDebugDocument.Point[],
    side: IHumanDebugDocument.Point,
    width: number,
  ): IMesh {
    const half: number = width / 2;
    return grid(
      line.map((p: IHumanDebugDocument.Point): IHumanDebugDocument.Point[] => [
        [p[0] - side[0] * half, p[1] - side[1] * half, p[2] - side[2] * half],
        [p[0] + side[0] * half, p[1] + side[1] * half, p[2] + side[2] * half],
      ]),
      false,
    );
  }

  /**
   * One octahedron per landmark.
   *
   * @param points Landmarks, mm.
   * @param radius Distance from a landmark to each vertex, mm.
   * @returns The mesh.
   */
  export function markers(
    points: readonly IHumanDebugDocument.Point[],
    radius: number,
  ): IMesh {
    const out: IMesh = { points: [], indices: [] };
    for (const p of points) {
      const base: number = out.points.length;
      out.points.push(
        [p[0] + radius, p[1], p[2]],
        [p[0] - radius, p[1], p[2]],
        [p[0], p[1] + radius, p[2]],
        [p[0], p[1] - radius, p[2]],
        [p[0], p[1], p[2] + radius],
        [p[0], p[1], p[2] - radius],
      );
      out.indices.push(
        ...OCTAHEDRON.map((k: number): number => base + k),
      );
    }
    return out;
  }

  /**
   * The part record of a body-millimetre mesh.
   *
   * @param id Part id `human.skin.<chain>/<k>`; curve ids start with `human.construction.<chain>/`.
   * @param mesh The mesh.
   * @param curves The part's curves.
   * @returns The part.
   */
  export function part(
    id: string,
    mesh: IMesh,
    curves: IHumanDebugDocument.ICurve[] = [],
  ): IHumanDebugDocument.IPart {
    return {
      id,
      space: "body-mm",
      frame: {
        origin: [0, 0, 0],
        forward: [1, 0, 0],
        up: [0, 1, 0],
        left: [0, 0, 1],
      },
      points: mesh.points,
      indices: mesh.indices,
      curves,
    };
  }

  /** Triangles of an octahedron over its vertices +X, -X, +Y, -Y, +Z, -Z, wound outward. */
  const OCTAHEDRON: readonly number[] = [
    0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 4, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0, 3, 5,
  ];

  /** Sum over triangles of (area normal · centroid offset), positive for outward winding. */
  function flux(
    points: readonly IHumanDebugDocument.Point[],
    indices: readonly number[],
  ): number {
    const centre: number[] = [0, 1, 2].map(
      (k: number): number =>
        points.reduce(
          (sum: number, p: IHumanDebugDocument.Point): number => sum + p[k]!,
          0,
        ) / points.length,
    );
    let total: number = 0;
    for (let t: number = 0; t + 2 < indices.length; t += 3) {
      const p: IHumanDebugDocument.Point = points[indices[t]!]!;
      const q: IHumanDebugDocument.Point = points[indices[t + 1]!]!;
      const r: IHumanDebugDocument.Point = points[indices[t + 2]!]!;
      const u: number[] = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      const v: number[] = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      const n: number[] = [
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ];
      for (let k: number = 0; k < 3; ++k)
        total += n[k]! * ((p[k]! + q[k]! + r[k]!) / 3 - centre[k]!);
    }
    return total;
  }
}
