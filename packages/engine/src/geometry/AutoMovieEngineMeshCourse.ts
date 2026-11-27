import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieMeshCourse,
  IAutoMovieMeshSectionChain,
  IAutoMovieMeshSectionCut,
  IAutoMovieMillimeterMesh,
} from "@automovie/interface";

import { AutoMovieEngineMeshExtract } from "./AutoMovieEngineMeshExtract";

/**
 * Sections of a dense mesh on the planes of a course: one exact plane cut per
 * station (`AutoMovieEngineMeshExtract.outline` on that station's own plane, so a
 * turned family needs no common axis), the outer piece holding the course
 * point, that loop's own plane readings and the family's neighbour jumps.
 *
 * Each section reports the loop's Newell vector direction and area centroid
 * read in its own plane, its four chart extents and four conic quarter
 * shoulders ({@link read}), each support direction's crests and notches (the
 * loop's points whose tangent is square to that direction, from a persistence
 * walk) and its reach from the course point. A caller that follows guides from
 * section to section climbs to each one's hill ({@link ascend}) and reads the
 * quarters between them split at their shoulder bars ({@link pieces}). A
 * course's turn regularity is a property of the course itself and belongs to
 * its owner (the axis and its analytic jet), not to these sampled planes.
 *
 * The jump check reads the holding loop's own values: an extent, or a quarter's
 * shoulder point (rho times its corner reach, millimetres), that leaves the
 * station-linear interpolation of its two neighbours by more than the tolerance
 * is flagged as a jump, so a neighbouring body in the same cut (a hand beside
 * the hip) does not flag the part.
 */
export namespace AutoMovieEngineMeshCourse {
  /**
   * Cut a mesh on every course plane and read each holding loop.
   *
   * @param mesh The mesh, millimetres.
   * @param planes The course planes by increasing station.
   * @param tolerance Jump tolerance, millimetres, the features' persistence and
   *   the extraction's own flag tolerance (0.5 by default).
   * @param bridge The extraction's outer-boundary bridge, millimetres (25 by
   *   default, `AutoMovieEngineMeshExtract.outline`).
   * @returns One section per plane, in order.
   */
  export function cut(
    mesh: IAutoMovieMillimeterMesh,
    planes: readonly IAutoMovieMeshCourse.IPlane[],
    tolerance: number = 0.5,
    bridge: number = 25,
  ): IAutoMovieMeshCourse.ISection[] {
    const sections: IAutoMovieMeshCourse.ISection[] = planes.map(
      (plane: IAutoMovieMeshCourse.IPlane): IAutoMovieMeshCourse.ISection => {
        const n: AutoMovieVector3Tuple = cross(plane.v, plane.u);
        const cut: IAutoMovieMeshSectionCut = AutoMovieEngineMeshExtract.outline(
          mesh,
          { origin: plane.origin, axes: [n, plane.u, plane.v] },
          [0],
          0,
          tolerance,
          bridge,
        )[0]!;
        const held: IAutoMovieMeshSectionChain | undefined = cut.outer.find(
          (l: IAutoMovieMeshSectionChain): boolean => contains(l.points, 0, 0),
        );
        if (held === undefined)
          return {
            plane,
            pieces: cut.outer.length,
            loop: null,
            reading: null,
            normal: null,
            centroid: null,
            area: null,
            reach: null,
            flags: cut.flags,
            checks: [],
          };
        const world: AutoMovieVector3Tuple[] = held.points.map(
          ([a, b]: [number, number]): AutoMovieVector3Tuple =>
            add(plane.origin, add(scale(plane.u, a), scale(plane.v, b))),
        );
        const vector: AutoMovieVector3Tuple = newell(world);
        const length: number = Math.hypot(...vector);
        return {
          plane,
          pieces: cut.outer.length,
          loop: held.points,
          reading: read(held.points, tolerance),
          normal: length === 0 ? null : scale(vector, 1 / length),
          centroid: centroid(world),
          area: length / 2,
          reach: Math.max(
            ...held.points.map(([a, b]: [number, number]): number =>
              Math.hypot(a, b),
            ),
          ),
          flags: cut.flags,
          checks: [],
        };
      },
    );

    // Jumps on the holding loop's own values.
    const names: string[] = ["+u", "-u", "+v", "-v", "q0", "q1", "q2", "q3"];
    const value = (
      s: IAutoMovieMeshCourse.ISection,
      k: number,
    ): number | null => {
      if (s.reading === null) return null;
      if (k < 4) return s.reading.extents[k]!;
      const q: IAutoMovieMeshCourse.IQuarter = s.reading.quarters[k - 4]!;
      return q.rho === null ? null : q.rho * q.reach;
    };
    for (let i: number = 1; i + 1 < sections.length; ++i)
      for (let k: number = 0; k < names.length; ++k) {
        const [p, c, q] = [
          value(sections[i - 1]!, k),
          value(sections[i]!, k),
          value(sections[i + 1]!, k),
        ];
        if (p === null || c === null || q === null) continue;
        const s0: number = planes[i - 1]!.station;
        const s1: number = planes[i]!.station;
        const s2: number = planes[i + 1]!.station;
        const deviation: number = c - (p + ((q - p) * (s1 - s0)) / (s2 - s0));
        if (Math.abs(deviation) > tolerance)
          sections[i]!.checks.push(
            `jump ${names[k]}: ${deviation.toFixed(3)} mm`,
          );
      }
    return sections;
  }

  /**
   * Read a closed chart loop's extents, touch offsets, features and conic
   * quarters about the chart origin.
   *
   * @param loop Closed loop, chart millimetres, last point not repeated,
   *   holding the origin.
   * @param tolerance The features' persistence, millimetres (0.5 by default).
   * @returns The reading.
   */
  export function read(
    loop: readonly (readonly [number, number])[],
    tolerance: number = 0.5,
  ): IAutoMovieMeshCourse.IReading {
    let iu: [number, number] = [0, 0];
    let iv: [number, number] = [0, 0];
    for (let i: number = 1; i < loop.length; ++i) {
      if (loop[i]![0] > loop[iu[0]]![0]) iu = [i, iu[1]];
      if (loop[i]![0] < loop[iu[1]]![0]) iu = [iu[0], i];
      if (loop[i]![1] > loop[iv[0]]![1]) iv = [i, iv[1]];
      if (loop[i]![1] < loop[iv[1]]![1]) iv = [iv[0], i];
    }
    const extents: [number, number, number, number] = [
      loop[iu[0]]![0],
      loop[iu[1]]![0],
      loop[iv[0]]![1],
      loop[iv[1]]![1],
    ];
    const touch: [number, number, number, number] = [
      loop[iu[0]]![1],
      loop[iu[1]]![1],
      loop[iv[0]]![0],
      loop[iv[1]]![0],
    ];
    const found: IAutoMovieMeshCourse.IFeature[][] = DIRECTIONS.map(
      (d: AutoMovieVector2Tuple): IAutoMovieMeshCourse.IFeature[] =>
        features(loop, d, tolerance),
    );

    // Guides on the axis lines, in quarter order +u, +v, -u, -v.
    const guides: AutoMovieVector2Tuple[] = [
      [extents[0], 0],
      [0, extents[2]],
      [extents[1], 0],
      [0, extents[3]],
    ];
    const all: Segment[] = loop.map(
      (p: readonly [number, number], i: number): Segment => [
        [p[0], p[1]],
        [loop[(i + 1) % loop.length]![0], loop[(i + 1) % loop.length]![1]],
      ],
    );
    const quarters: IAutoMovieMeshCourse.IQuarter[] = [0, 1, 2, 3].map(
      (q: number): IAutoMovieMeshCourse.IQuarter => {
        const g0: AutoMovieVector2Tuple = guides[q]!;
        const g1: AutoMovieVector2Tuple = guides[(q + 1) % 4]!;
        const M: AutoMovieVector2Tuple = [
          (g0[0] + g1[0]) / 2,
          (g0[1] + g1[1]) / 2,
        ];
        const A: AutoMovieVector2Tuple = [g0[0] + g1[0], g0[1] + g1[1]];
        return {
          rho: crossing(all, M, A)?.t ?? null,
          reach: Math.hypot(A[0] - M[0], A[1] - M[1]),
        };
      },
    );
    return {
      extents,
      touch,
      features: found as IAutoMovieMeshCourse.IReading["features"],
      quarters: quarters as IAutoMovieMeshCourse.IReading["quarters"],
    };
  }

  /**
   * The hill of the support along a direction that holds a loop point: walk the
   * loop both ways from `start` while the support stays within the tolerance of
   * the best reached on that side, and return the higher of the two bests. A
   * dip deeper than the tolerance ends a side, so the walk stays on the hill it
   * began on (dips within the tolerance do not separate hills, as in the
   * features' persistence).
   *
   * @param loop Closed loop, chart millimetres, last point not repeated.
   * @param direction 0 `+u`, 1 `-u`, 2 `+v`, 3 `-v`.
   * @param start The loop index to climb from.
   * @param tolerance The persistence, millimetres (0.5 by default).
   * @returns The index of the hill's highest point.
   */
  export function ascend(
    loop: readonly (readonly [number, number])[],
    direction: number,
    start: number,
    tolerance: number = 0.5,
  ): number {
    const N: number = loop.length;
    const d: AutoMovieVector2Tuple = DIRECTIONS[direction]!;
    const h = (i: number): number => loop[i]![0] * d[0] + loop[i]![1] * d[1];
    let best: number = start;
    for (const step of [1, N - 1]) {
      let top: number = start;
      for (
        let k: number = 1, i: number = (start + step) % N;
        k < N;
        ++k, i = (i + step) % N
      ) {
        if (h(i) < h(top) - tolerance) break;
        if (h(i) > h(top)) top = i;
      }
      if (h(top) > h(best)) best = top;
    }
    return best;
  }

  /**
   * The four quarters between given guides, each split at its shoulder bar.
   *
   * @param loop Closed loop, chart millimetres, last point not repeated,
   *   holding the origin.
   * @param guides The loop indices of the `+u`, `+v`, `-u` and `-v` guides, in
   *   increasing phase.
   * @returns One piece pair per quarter, `+u`/`+v`, `+v`/`-u`, `-u`/`-v`,
   *   `-v`/`+u`.
   */
  export function pieces(
    loop: readonly (readonly [number, number])[],
    guides: readonly [number, number, number, number],
  ): [
    IAutoMovieMeshCourse.IPiece,
    IAutoMovieMeshCourse.IPiece,
    IAutoMovieMeshCourse.IPiece,
    IAutoMovieMeshCourse.IPiece,
  ] {
    const N: number = loop.length;
    let area: number = 0;
    for (let i: number = 0; i < N; ++i) {
      const p: readonly [number, number] = loop[i]!;
      const q: readonly [number, number] = loop[(i + 1) % N]!;
      area += p[0] * q[1] - q[0] * p[1];
    }
    const step: number = area > 0 ? 1 : N - 1;
    const lines: AutoMovieVector2Tuple[] = [
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 0],
    ];
    const at = (i: number): AutoMovieVector2Tuple => [loop[i]![0], loop[i]![1]];
    const g: AutoMovieVector2Tuple[] = guides.map(at);
    const corners: AutoMovieVector2Tuple[] = [
      [g[0]![0], g[1]![1]],
      [g[2]![0], g[1]![1]],
      [g[2]![0], g[3]![1]],
      [g[0]![0], g[3]![1]],
    ];

    // The segments of the arc from loop index a to loop index b in increasing phase, each oriented along it.
    const arc = (a: number, b: number): Segment[] => {
      const out: Segment[] = [];
      for (let i: number = a; i !== b; i = (i + step) % N)
        out.push([at(i), at((i + step) % N)]);
      return out;
    };
    return [0, 1, 2, 3].map((q: number): IAutoMovieMeshCourse.IPiece => {
      const segments: Segment[] = arc(guides[q]!, guides[(q + 1) % 4]!);
      const g0: AutoMovieVector2Tuple = g[q]!;
      const g1: AutoMovieVector2Tuple = g[(q + 1) % 4]!;
      const M: AutoMovieVector2Tuple = [
        (g0[0] + g1[0]) / 2,
        (g0[1] + g1[1]) / 2,
      ];
      const A: AutoMovieVector2Tuple = corners[q]!;
      const hit: { t: number; index: number } | null = crossing(segments, M, A);
      if (hit === null)
        return {
          split: null,
          angle: null,
          shoulders: [null, null],
          reach: [null, null],
        };
      const S: AutoMovieVector2Tuple = [
        M[0] + hit.t * (A[0] - M[0]),
        M[1] + hit.t * (A[1] - M[1]),
      ];
      const [from, to]: Segment = segments[hit.index]!;
      const T: AutoMovieVector2Tuple = [to[0] - from[0], to[1] - from[1]];
      const first: [number | null, number | null] = piece(g0, lines[q]!, S, T, [
        ...segments.slice(0, hit.index),
        [from, S],
      ]);
      const second: [number | null, number | null] = piece(
        S,
        T,
        g1,
        lines[(q + 1) % 4]!,
        [[S, to], ...segments.slice(hit.index + 1)],
      );
      return {
        split: S,
        angle: Math.atan2(T[1], T[0]),
        shoulders: [first[0], second[0]],
        reach: [first[1], second[1]],
      };
    }) as [
      IAutoMovieMeshCourse.IPiece,
      IAutoMovieMeshCourse.IPiece,
      IAutoMovieMeshCourse.IPiece,
      IAutoMovieMeshCourse.IPiece,
    ];
  }

  /**
   * Read a conic shoulder between two supplied tangents on an ordered source
   * arc.
   *
   * @param arc Actual chart points from the first contact through the last.
   * @param start Tangent at the first contact, oriented along the arc.
   * @param end Tangent at the last contact, oriented along the arc.
   * @returns The signed, dimensionless shoulder and the corner reach in
   *   millimetres. The reach can be known even when the arc misses the
   *   crossing.
   */
  export function shoulder(
    arc: readonly AutoMovieVector2Tuple[],
    start: AutoMovieVector2Tuple,
    end: AutoMovieVector2Tuple,
  ): [number | null, number | null] {
    if (arc.length < 2) return [null, null];
    return piece(
      arc[0]!,
      start,
      arc[arc.length - 1]!,
      end,
      arc
        .slice(1)
        .map(
          (point: AutoMovieVector2Tuple, i: number): Segment => [
            arc[i]!,
            point,
          ],
        ),
    );
  }

  /**
   * The Newell vector of a closed 3D polygon: its vector area, doubled.
   *
   * @param points Closed polygon, last point not repeated.
   * @returns The vector; its components are twice the polygon's projected areas
   *   on the coordinate planes, so for a planar polygon its direction is the
   *   plane normal (by the points' winding) and its length twice the area.
   */
  export function newell(
    points: readonly AutoMovieVector3Tuple[],
  ): AutoMovieVector3Tuple {
    const out: AutoMovieVector3Tuple = [0, 0, 0];
    for (let i: number = 0; i < points.length; ++i) {
      const p: AutoMovieVector3Tuple = points[i]!;
      const q: AutoMovieVector3Tuple = points[(i + 1) % points.length]!;
      out[0] += (p[1] - q[1]) * (p[2] + q[2]);
      out[1] += (p[2] - q[2]) * (p[0] + q[0]);
      out[2] += (p[0] - q[0]) * (p[1] + q[1]);
    }
    return out;
  }

  /**
   * The area centroid of a closed planar 3D polygon, read in its own plane.
   *
   * @param points Closed planar polygon, last point not repeated.
   * @returns The centroid, millimetres, or null when the polygon has no area
   *   (fewer than three points or a zero Newell vector): no area centroid
   *   exists then.
   */
  export function centroid(
    points: readonly AutoMovieVector3Tuple[],
  ): AutoMovieVector3Tuple | null {
    const n: AutoMovieVector3Tuple = newell(points);
    const length: number = Math.hypot(...n);
    if (length === 0 || points.length < 3) return null;
    const unit: AutoMovieVector3Tuple = scale(n, 1 / length);
    const o: AutoMovieVector3Tuple = points[0]!;
    let weight: number = 0;
    let sum: AutoMovieVector3Tuple = [0, 0, 0];
    for (let i: number = 1; i + 1 < points.length; ++i) {
      const a: AutoMovieVector3Tuple = points[i]!;
      const b: AutoMovieVector3Tuple = points[i + 1]!;
      const w: number = dot(cross(sub(a, o), sub(b, o)), unit) / 2;
      weight += w;
      sum = add(sum, scale(add(o, add(a, b)), w / 3));
    }
    return scale(sum, 1 / weight);
  }

  /*
   * The four support directions, `+u`, `-u`, `+v`, `-v`.
   */
  const DIRECTIONS: readonly AutoMovieVector2Tuple[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  /*
   * One conic piece's shoulder and reach on its own sub-arc: the piece from P0
   * (tangent T0) to P2 (tangent T2) has its control point where the tangent
   * lines meet, `P0 + a T0 = P2 - b T2`, which must lie ahead of both ends (a,
   * b > 0); its shoulder is the sub-arc's outermost crossing of the segment
   * from the chord midpoint toward that point. Null with its first cause.
   */
  function piece(
    P0: AutoMovieVector2Tuple,
    T0: AutoMovieVector2Tuple,
    P2: AutoMovieVector2Tuple,
    T2: AutoMovieVector2Tuple,
    segments: readonly Segment[],
  ): [number | null, number | null] {
    const den: number = T0[0] * T2[1] - T0[1] * T2[0];
    if (den === 0) return [null, null];
    const d: AutoMovieVector2Tuple = [P2[0] - P0[0], P2[1] - P0[1]];
    const a: number = (d[0] * T2[1] - d[1] * T2[0]) / den;
    const b: number = (T0[0] * d[1] - T0[1] * d[0]) / den;
    if (!(a > 0 && b > 0)) return [null, null];
    const A: AutoMovieVector2Tuple = [P0[0] + a * T0[0], P0[1] + a * T0[1]];
    const M: AutoMovieVector2Tuple = [(P0[0] + P2[0]) / 2, (P0[1] + P2[1]) / 2];
    const reach: number = Math.hypot(A[0] - M[0], A[1] - M[1]);
    return [crossing(segments, M, A)?.t ?? null, reach];
  }

  /*
   * The crests and notches of a closed loop facing direction d: a hysteresis
   * walk of `h = p . d` once around from the global maximum keeps the
   * alternating extrema differing by at least the tolerance; each keeps its
   * kind when its outward normal (the loop's own winding, the tangent from its
   * two neighbours) faces d. Sorted by phase from `-pi`.
   */
  function features(
    loop: readonly (readonly [number, number])[],
    d: AutoMovieVector2Tuple,
    tolerance: number,
  ): IAutoMovieMeshCourse.IFeature[] {
    const N: number = loop.length;
    if (N < 3) return [];
    const h = (i: number): number => loop[i]![0] * d[0] + loop[i]![1] * d[1];
    let area: number = 0;
    for (let i: number = 0; i < N; ++i) {
      const p: readonly [number, number] = loop[i]!;
      const q: readonly [number, number] = loop[(i + 1) % N]!;
      area += p[0] * q[1] - q[0] * p[1];
    }
    const winding: number = area > 0 ? 1 : -1;
    let start: number = 0;
    for (let i: number = 1; i < N; ++i) if (h(i) > h(start)) start = i;
    const turns: { index: number; kind: "crest" | "notch" }[] = [
      { index: start, kind: "crest" },
    ];
    let seeking: "min" | "max" = "min";
    let candidate: number = start;
    for (let k: number = 1; k <= N; ++k) {
      const i: number = (start + k) % N;
      if (seeking === "min") {
        if (h(i) < h(candidate)) candidate = i;
        else if (h(i) - h(candidate) >= tolerance) {
          turns.push({ index: candidate, kind: "notch" });
          seeking = "max";
          candidate = i;
        }
      } else if (h(i) > h(candidate)) candidate = i;
      else if (h(candidate) - h(i) >= tolerance) {
        turns.push({ index: candidate, kind: "crest" });
        seeking = "min";
        candidate = i;
      }
    }
    const out: IAutoMovieMeshCourse.IFeature[] = [];
    for (const turn of turns) {
      const a: readonly [number, number] = loop[(turn.index + N - 1) % N]!;
      const b: readonly [number, number] = loop[(turn.index + 1) % N]!;
      const t: AutoMovieVector2Tuple = [b[0] - a[0], b[1] - a[1]];
      const normal: AutoMovieVector2Tuple = [winding * t[1], -winding * t[0]];
      if (!(normal[0] * d[0] + normal[1] * d[1] > 0)) continue;
      const p: readonly [number, number] = loop[turn.index]!;
      out.push({ kind: turn.kind, point: [p[0], p[1]], value: h(turn.index) });
    }
    return out.sort(
      (
        x: IAutoMovieMeshCourse.IFeature,
        y: IAutoMovieMeshCourse.IFeature,
      ): number =>
        Math.atan2(x.point[1], x.point[0]) - Math.atan2(y.point[1], y.point[0]),
    );
  }

  /*
   * The outermost crossing share `t` of the given segments with `M + t (A -
   * M)`, t in [-1, 1], and the crossed segment's index, or null. A zero-length
   * segment is never crossed.
   */
  function crossing(
    segments: readonly Segment[],
    M: AutoMovieVector2Tuple,
    A: AutoMovieVector2Tuple,
  ): { t: number; index: number } | null {
    const d: AutoMovieVector2Tuple = [A[0] - M[0], A[1] - M[1]];
    let best: { t: number; index: number } | null = null;
    segments.forEach(([p, q]: Segment, i: number): void => {
      const e: AutoMovieVector2Tuple = [q[0] - p[0], q[1] - p[1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (den === 0) return;
      const w: AutoMovieVector2Tuple = [p[0] - M[0], p[1] - M[1]];
      const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
      const s: number = (w[0] * d[1] - w[1] * d[0]) / den;
      if (
        s >= 0 &&
        s <= 1 &&
        t >= -1 &&
        t <= 1 &&
        (best === null || t > best.t)
      )
        best = { t, index: i };
    });
    return best;
  }

  /*
   * Even-odd point in polygon.
   */
  function contains(
    poly: readonly (readonly [number, number])[],
    x: number,
    y: number,
  ): boolean {
    let c: boolean = false;
    for (
      let i: number = 0, j: number = poly.length - 1;
      i < poly.length;
      j = i++
    ) {
      const [xi, yi] = poly[i]!;
      const [xj, yj] = poly[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        c = !c;
    }
    return c;
  }

  /*
   * A + b.
   */
  function add(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /*
   * A - b.
   */
  function sub(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /*
   * A s.
   */
  function scale(a: AutoMovieVector3Tuple, s: number): AutoMovieVector3Tuple {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /*
   * A . b.
   */
  function dot(a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /*
   * A x b.
   */
  function cross(
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }
}

/*
 * A polyline segment, chart millimetres, start then end.
 */
type Segment = readonly [AutoMovieVector2Tuple, AutoMovieVector2Tuple];
