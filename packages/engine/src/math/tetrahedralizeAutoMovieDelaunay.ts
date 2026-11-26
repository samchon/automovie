import type {
  IAutoMovieTetrahedralizeDelaunay,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "./Vector3";
import { seededValue } from "./internal/seededValue";

/**
 * The Delaunay tetrahedralization of points by Bowyer-Watson insertion in their
 * given order.
 *
 * Coplanar and cospherical points, which a body's symmetric joints always hold,
 * leave the floating-point predicates undecided and the insertion with flat or
 * non-Delaunay tetrahedra. The input is therefore joggled as Qhull's `QJ`
 * joggles it (Barber, Dobkin and Huhdanpaa 1996, "The quickhull algorithm for
 * convex hulls", ACM TOMS 22(4); Qhull `user.h` `qh_JOGGLEdefault` and
 * `geom2.c` `qh_detjoggle`): each coordinate moves by a deterministic amount
 * within `JOGGLE` machine epsilons of the points' largest coordinate, and the
 * mesh is the Delaunay mesh of the joggled points it returns.
 *
 * @param points The points.
 * @returns The mesh, each tetrahedron positively oriented on the joggled
 *   points.
 */
export function tetrahedralizeAutoMovieDelaunay(
  points: readonly IAutoMovieVector3[],
): IAutoMovieTetrahedralizeDelaunay.IMesh {
  const n: number = points.length;

  // Qhull's joggle: each coordinate within `JOGGLE` epsilons of the
  // largest coordinate, drawn from the point's index and axis.
  const largest: number = Math.max(
    ...points.map((p: IAutoMovieVector3): number =>
      Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)),
    ),
    Number.MIN_VALUE,
  );
  const amount: number =
    tetrahedralizeAutoMovieDelaunay.JOGGLE * Number.EPSILON * largest;
  const jog = (i: number, axis: number): number =>
    amount *
    (2 * seededValue(tetrahedralizeAutoMovieDelaunay.DOMAIN, i, axis) - 1);
  const joggled: IAutoMovieVector3[] = points.map(
    (p: IAutoMovieVector3, i: number): IAutoMovieVector3 => ({
      x: p.x + jog(i, 0),
      y: p.y + jog(i, 1),
      z: p.z + jog(i, 2),
    }),
  );
  const centre: IAutoMovieVector3 = Vector3.scale(
    joggled.reduce(
      (s: IAutoMovieVector3, p: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(s, p),
      { x: 0, y: 0, z: 0 },
    ),
    1 / n,
  );
  const radius: number = Math.max(
    ...joggled.map((p: IAutoMovieVector3): number =>
      Vector3.length(Vector3.subtract(p, centre)),
    ),
    Number.MIN_VALUE,
  );

  // A regular tetrahedron whose inscribed sphere, a third of its
  // circumradius, holds every point with room: circumradius 9 r gives an
  // insphere of 3 r.
  const far: number = 9 * radius;
  const all: IAutoMovieVector3[] = [
    ...joggled,
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
    points: joggled,
  };
}

/** Companion types and predicates of {@link tetrahedralizeAutoMovieDelaunay}. */
export namespace tetrahedralizeAutoMovieDelaunay {
  /**
   * Qhull's default joggle, in machine epsilons of the largest coordinate
   * (`qh_JOGGLEdefault`).
   */
  export const JOGGLE: number = 30000;

  /** The seed domain of the joggle's draws, so no other draw shares them. */
  export const DOMAIN: number = 3438;
  /**
   * Each point's neighbours along the mesh's edges, ascending.
   *
   * @param mesh The mesh.
   * @param n The number of points.
   * @returns The neighbour lists by point.
   */
  export function neighbours(
    mesh: IAutoMovieTetrahedralizeDelaunay.IMesh,
    n: number,
  ): number[][] {
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
   * A tetrahedron's signed volume times six: positive when its fourth point
   * lies on the side the first three's right-hand normal faces.
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
   * @returns The same corners, the first two swapped when the volume is
   *   negative.
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
