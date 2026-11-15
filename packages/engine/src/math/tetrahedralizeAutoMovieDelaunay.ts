import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "./Vector3";

/**
 * The Delaunay tetrahedralization of points by Bowyer-Watson insertion
 * in their given order.
 *
 * @param points The points.
 * @returns The mesh, each tetrahedron positively oriented.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, the order and the orientation.
 * @evidence contracts/development/implementation.md#principled-implementation Each point removes the tetrahedra whose circumsphere strictly contains it and fans the cavity's boundary faces to it; the enclosing tetrahedron's corners are dropped at the end.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Enclose, insert, drop.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A point on a circumsphere is left outside it by the strict test, so cospherical points resolve the same way every time.
 * @evidence contracts/development/implementation.md#efficient-algorithms Quadratic in the points at worst: each insertion scans the current tetrahedra.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of the points.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function tetrahedralizeAutoMovieDelaunay(
  points: readonly IAutoMovieVector3[],
): tetrahedralizeAutoMovieDelaunay.IMesh {
  const n: number = points.length;
  const centre: IAutoMovieVector3 = Vector3.scale(
    points.reduce(
      (s: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(s, p),
      { x: 0, y: 0, z: 0 },
    ),
    1 / n,
  );
  const radius: number = Math.max(
    ...points.map((p: IAutoMovieVector3): number =>
      Vector3.length(Vector3.subtract(p, centre)),
    ),
    Number.MIN_VALUE,
  );

  // A regular tetrahedron whose inscribed sphere, a third of its
  // circumradius, holds every point with room: circumradius 9 r gives an
  // insphere of 3 r.
  const far: number = 9 * radius;
  const all: IAutoMovieVector3[] = [
    ...points,
    ...[
      { x: 1, y: 1, z: 1 },
      { x: 1, y: -1, z: -1 },
      { x: -1, y: 1, z: -1 },
      { x: -1, y: -1, z: 1 },
    ].map(
      (c: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(centre, Vector3.scale(c, far / Math.sqrt(3))),
    ),
  ];
  let tetrahedra: [number, number, number, number][] = [
    tetrahedralizeAutoMovieDelaunay.oriented(all, [n, n + 1, n + 2, n + 3]),
  ];
  for (let i: number = 0; i < n; i++) {
    const p: IAutoMovieVector3 = all[i]!;
    const bad: [number, number, number, number][] = [];
    const kept: [number, number, number, number][] = [];
    for (const t of tetrahedra)
      (tetrahedralizeAutoMovieDelaunay.circumscribes(all, t, p)
        ? bad
        : kept
      ).push(t);
    const faces: Map<string, [number, number, number]> = new Map();
    const counts: Map<string, number> = new Map();
    for (const t of bad)
      for (const face of [
        [t[0], t[1], t[2]],
        [t[0], t[1], t[3]],
        [t[0], t[2], t[3]],
        [t[1], t[2], t[3]],
      ] as [number, number, number][]) {
        const key: string = [...face]
          .sort((a: number, b: number): number => a - b)
          .join(",");
        counts.set(key, (counts.get(key) ?? 0) + 1);
        faces.set(key, face);
      }
    for (const [key, face] of faces)
      if (counts.get(key) === 1)
        kept.push(
          tetrahedralizeAutoMovieDelaunay.oriented(all, [
            face[0],
            face[1],
            face[2],
            i,
          ]),
        );
    tetrahedra = kept;
  }
  return {
    tetrahedra: tetrahedra.filter((t: readonly number[]): boolean =>
      t.every((v: number): boolean => v < n),
    ),
  };
}

/**
 * Companion types and predicates of {@link tetrahedralizeAutoMovieDelaunay}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and convention.
 * @evidence contracts/development/design.md#principled-representation A mesh as its tetrahedra by point index, positively oriented.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The mesh, its neighbourhoods, the signed volume and the two predicates the insertion uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Indices into the caller's points, never copies of them.
 */
export namespace tetrahedralizeAutoMovieDelaunay {
  /** The tetrahedra over the points, each by four indices in positive orientation. */
  export interface IMesh {
    /** The tetrahedra. */
    tetrahedra: readonly (readonly [number, number, number, number])[];
  }
  /**
   * Each point's neighbours along the mesh's edges, ascending.
   *
   * @param mesh The mesh.
   * @param n The number of points.
   * @returns The neighbour lists by point.
   */
  export function neighbours(mesh: IMesh, n: number): number[][] {
    const sets: Set<number>[] = Array.from(
      { length: n },
      (): Set<number> => new Set(),
    );
    for (const t of mesh.tetrahedra)
      for (let a: number = 0; a < 4; a++)
        for (let b: number = 0; b < 4; b++)
          if (a !== b) sets[t[a]!]!.add(t[b]!);
    return sets.map((s: Set<number>): number[] =>
      [...s].sort((a: number, b: number): number => a - b),
    );
  }

  /**
   * A tetrahedron's signed volume times six: positive when its fourth
   * point lies on the side the first three's right-hand normal faces.
   *
   * @param points The points.
   * @param t The tetrahedron.
   * @returns Cubic metres times six.
   */
  export function volume(
    points: readonly IAutoMovieVector3[],
    t: readonly [number, number, number, number],
  ): number {
    const a: IAutoMovieVector3 = points[t[0]]!;
    return Vector3.dot(
      Vector3.cross(
        Vector3.subtract(points[t[1]]!, a),
        Vector3.subtract(points[t[2]]!, a),
      ),
      Vector3.subtract(points[t[3]]!, a),
    );
  }

  /**
   * A tetrahedron's indices ordered to a positive volume.
   *
   * @param points The points.
   * @param t The tetrahedron.
   * @returns The same corners, the first two swapped when the volume is negative.
   */
  export function oriented(
    points: readonly IAutoMovieVector3[],
    t: [number, number, number, number],
  ): [number, number, number, number] {
    return volume(points, t) >= 0 ? t : [t[1], t[0], t[2], t[3]];
  }

  /**
   * Whether a point lies strictly inside a tetrahedron's circumsphere.
   *
   * @param points The points.
   * @param t The tetrahedron.
   * @param p The point.
   * @returns Whether it lies inside; false for a flat tetrahedron.
   */
  export function circumscribes(
    points: readonly IAutoMovieVector3[],
    t: readonly [number, number, number, number],
    p: IAutoMovieVector3,
  ): boolean {
    // The circumcentre c solves 2 (q_k - a) 夷?c = |q_k|吏?- |a|吏?for the
    // three other corners q_k, by Cramer's rule.
    const a: IAutoMovieVector3 = points[t[0]]!;
    const rows: IAutoMovieVector3[] = [t[1], t[2], t[3]].map(
      (i: number): IAutoMovieVector3 =>
        Vector3.scale(Vector3.subtract(points[i]!, a), 2),
    );
    const rhs: number[] = [t[1], t[2], t[3]].map(
      (i: number): number =>
        Vector3.dot(points[i]!, points[i]!) - Vector3.dot(a, a),
    );
    const det = (
      u: IAutoMovieVector3,
      v: IAutoMovieVector3,
      w: IAutoMovieVector3,
    ): number => Vector3.dot(u, Vector3.cross(v, w));
    const column = (k: number): IAutoMovieVector3[] =>
      rows.map(
        (r: IAutoMovieVector3, i: number): IAutoMovieVector3 =>
          k === 0
            ? { x: rhs[i]!, y: r.y, z: r.z }
            : k === 1
              ? { x: r.x, y: rhs[i]!, z: r.z }
              : { x: r.x, y: r.y, z: rhs[i]! },
      );
    const d: number = det(rows[0]!, rows[1]!, rows[2]!);
    if (d === 0) return false;
    const [cx, cy, cz] = [0, 1, 2].map((k: number): number => {
      const m: IAutoMovieVector3[] = column(k);
      return det(m[0]!, m[1]!, m[2]!) / d;
    }) as [number, number, number];
    const c: IAutoMovieVector3 = { x: cx, y: cy, z: cz };
    return (
      Vector3.length(Vector3.subtract(p, c)) <
      Vector3.length(Vector3.subtract(a, c))
    );
  }
}
