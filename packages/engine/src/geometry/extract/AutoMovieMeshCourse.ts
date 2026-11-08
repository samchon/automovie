import { AutoMovieMeshExtract } from "./AutoMovieMeshExtract";

/** A point or direction, millimetres. */
type V3 = AutoMovieMeshExtract.V3;

/**
 * Sections of a dense mesh on the planes of a course: one exact plane cut per
 * station (`AutoMovieMeshExtract.outline` on that station's own plane, so a
 * turned family needs no common axis), the outer piece holding the course
 * point, that loop's own plane readings and the family's neighbour jumps.
 *
 * Each section reports the loop's Newell vector direction and area centroid
 * read in its own plane, its four chart extents and four conic quarter
 * shoulders ({@link read}) and its reach from the course point. A course's
 * turn regularity is a property of the course itself and belongs to its
 * owner (the axis and its analytic jet), not to these sampled planes.
 *
 * The jump check reads the holding loop's own values: an extent, or a
 * quarter's shoulder point (rho times its corner reach, millimetres), that
 * leaves the station-linear interpolation of its two neighbours by more than
 * the tolerance is flagged as a jump, so a neighbouring body in the same cut
 * (a hand beside the hip) does not flag the part.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-station plane convention, the readings, their units and null meanings, and the jump rule.
 * @evidence contracts/development/implementation.md#principled-implementation Exact plane cuts per station, Newell's vector area and area-weighted fan centroids of planar polygons, and the conic shoulder as the crossing share on the segment from the course point through the chord midpoint to the corner.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One namespace owns course sections and the loop readings their consumers share; the plane cut stays with `AutoMovieMeshExtract`, the course's own geometry with its axis.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shoulder is clamped or defaulted, no point is filtered from a loop, a degenerate loop gets no invented normal or centroid, and every missing reading stays null.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(S T) for S stations over T triangles, one cut per station because each plane differs; readings are linear in each loop's points.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each station's cut is read once and its loop serves every reading; no work spans calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds no state between calls; per-station cuts are released after their readings, only the returned sections remain.
 */
export namespace AutoMovieMeshCourse {
  /**
   * One station's section plane: origin on the course, chart axes `u` and
   * `v` in the plane, normal `v x u` along the course (the
   * `AutoMovieLoftFrame` and `AutoMovieViewAxis` convention).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units, the orthonormal premise and the normal's orientation.
   * @evidence contracts/development/design.md#principled-representation A course plane is a station with an origin and two chart axes; the normal is derived, so it cannot disagree with them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly what a cut and its chart readings consume; the loft's own frame type stays with the loft.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Orthonormality remains a producer premise, not re-checked; the station is only a label for ordering and interpolation, not assumed to be arclength.
   */
  export interface IPlane {
    /** Station along the course, millimetres (a label; not assumed to be arclength). */
    station: number;

    /** The course point, millimetres. */
    origin: V3;

    /** The chart's first axis, unit. */
    u: V3;

    /** The chart's second axis, unit and square to `u`. */
    v: V3;
  }

  /**
   * One quarter's conic shoulder read off a loop.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States rho's definition, its admissible range and its millimetre scale.
   * @evidence contracts/development/design.md#principled-representation The measured share and the corner reach that turns a share into millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the trace's reduction and its diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Null is kept for a loop that never meets the segment instead of a default value.
   */
  export interface IQuarter {
    /**
     * `|M->S| / |M->A|`, signed along `M->A`: M the chord midpoint between
     * the quarter's two guide points, A the box corner, S the loop's
     * outermost crossing of the segment from the course point (`t = -1`)
     * through M to A (`t = 1`). A conic quarter needs `0 < rho < 1` (0.5 a
     * parabola, `sqrt(2) - 1` the ellipse on a centred symmetric box); a
     * value at or below zero means the loop is concave there. Null when the
     * loop never meets that segment.
     */
    rho: number | null;

    /** `|M->A|`, millimetres: a shoulder error of `d` moves S by `d` times this. */
    reach: number;
  }

  /**
   * A loop's four chart extents and four conic quarters about the course point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the extents' order and signs, the touch offsets' meaning and the quarter order.
   * @evidence contracts/development/design.md#principled-representation The view-loft section's own inputs (four support lines and four shoulders) plus the touch offsets that measure what its axis-line touch premise leaves out.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the trace or its receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the loop's own; nothing is admitted or refused here.
   */
  export interface IReading {
    /** Signed extents `+u`, `-u`, `+v`, `-v`, millimetres about the course point. */
    extents: [number, number, number, number];

    /**
     * Where each extreme touches its support line, measured off the course
     * point's axis line, millimetres: the `v` of the `+u` and `-u` extremes,
     * the `u` of the `+v` and `-v` extremes. The view section touches its
     * box on those axis lines, so a nonzero offset is shape it cannot carry.
     */
    touch: [number, number, number, number];

    /** Quarters q0..q3: between `+u`/`+v`, `+v`/`-u`, `-u`/`-v`, `-v`/`+u`. */
    quarters: [IQuarter, IQuarter, IQuarter, IQuarter];
  }

  /**
   * One station's section.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States every member's unit and frame and exactly when each is null.
   * @evidence contracts/development/design.md#principled-representation The cut's own flags beside the holding loop and its in-plane readings; `loop`, `reading`, `area` and `reach` are null together when no loop holds the course point, and `normal` and `centroid` are also null for a zero-area loop, where neither exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member feeds the trace, its diagnostics or its receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No loop reading is defaulted to zero; the nulls are the producer's guarantee, documented rather than encoded as a union because the trace reads them through one guard.
   */
  export interface ISection {
    /** The station's plane. */
    plane: IPlane;

    /** Outer pieces of the cut after the extraction's bridging. */
    pieces: number;

    /** The outer piece holding the course point, chart millimetres, or null. */
    loop: [number, number][] | null;

    /** Its extents and quarters; null exactly when `loop` is. */
    reading: IReading | null;

    /** Its unit Newell normal, world; null without a loop or for a zero-area loop. */
    normal: V3 | null;

    /** Its area centroid in its own plane, world millimetres; null without a loop or for a zero-area loop. */
    centroid: V3 | null;

    /** Its area, square millimetres; null exactly when `loop` is. */
    area: number | null;

    /** The largest distance of a loop point from the course point, millimetres; null exactly when `loop` is. */
    reach: number | null;

    /** The cut's own flags (`AutoMovieMeshExtract.outline`: open, bridged, unclosed), in full. */
    flags: string[];

    /** The family checks: `jump <name>: <mm>` on the holding loop's values. */
    checks: string[];
  }

  /**
   * Cut a mesh on every course plane and read each holding loop.
   *
   * @param mesh The mesh, millimetres.
   * @param planes The course planes by increasing station.
   * @param tolerance Jump tolerance, millimetres, and the extraction's own flag tolerance (0.5 by default).
   * @param bridge The extraction's outer-boundary bridge, millimetres (25 by default, `AutoMovieMeshExtract.outline`).
   * @returns One section per plane, in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inputs, units, the per-plane cut and the jump rule.
   * @evidence contracts/development/implementation.md#principled-implementation Exact plane cut per station; jumps as deviations from the neighbours' station-linear interpolation, so unequal steps keep their meaning.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cutting with loop reading, then the family's jump pass over the same sections.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing loop and a refused shoulder are reported, never repaired; no point is dropped from a loop.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S T) cutting dominates; readings are O(points) per station and the jumps O(S).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each cut is read once for all its readings.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns no retained state or handle; only the returned sections remain.
   */
  export function cut(mesh: AutoMovieMeshExtract.IMesh, planes: readonly IPlane[], tolerance: number = 0.5, bridge: number = 25): ISection[] {
    const sections: ISection[] = planes.map((plane: IPlane): ISection => {
      const n: V3 = cross(plane.v, plane.u);
      const cut: AutoMovieMeshExtract.ISection = AutoMovieMeshExtract.outline(mesh, { origin: plane.origin, axes: [n, plane.u, plane.v] }, [0], 0, tolerance, bridge)[0]!;
      const held: AutoMovieMeshExtract.ILoop | undefined = cut.outer.find((l: AutoMovieMeshExtract.ILoop): boolean => contains(l.points, 0, 0));
      if (held === undefined) return { plane, pieces: cut.outer.length, loop: null, reading: null, normal: null, centroid: null, area: null, reach: null, flags: cut.flags, checks: [] };
      const world: V3[] = held.points.map(([a, b]: [number, number]): V3 => add(plane.origin, add(scale(plane.u, a), scale(plane.v, b))));
      const vector: V3 = newell(world);
      const length: number = Math.hypot(...vector);
      return {
        plane,
        pieces: cut.outer.length,
        loop: held.points,
        reading: read(held.points),
        normal: length === 0 ? null : scale(vector, 1 / length),
        centroid: centroid(world),
        area: length / 2,
        reach: Math.max(...held.points.map(([a, b]: [number, number]): number => Math.hypot(a, b))),
        flags: cut.flags,
        checks: [],
      };
    });

    // Jumps on the holding loop's own values.
    const names: string[] = ["+u", "-u", "+v", "-v", "q0", "q1", "q2", "q3"];
    const value = (s: ISection, k: number): number | null => {
      if (s.reading === null) return null;
      if (k < 4) return s.reading.extents[k]!;
      const q: IQuarter = s.reading.quarters[k - 4]!;
      return q.rho === null ? null : q.rho * q.reach;
    };
    for (let i: number = 1; i + 1 < sections.length; ++i)
      for (let k: number = 0; k < names.length; ++k) {
        const [p, c, q] = [value(sections[i - 1]!, k), value(sections[i]!, k), value(sections[i + 1]!, k)];
        if (p === null || c === null || q === null) continue;
        const s0: number = planes[i - 1]!.station;
        const s1: number = planes[i]!.station;
        const s2: number = planes[i + 1]!.station;
        const deviation: number = c - (p + ((q - p) * (s1 - s0)) / (s2 - s0));
        if (Math.abs(deviation) > tolerance) sections[i]!.checks.push(`jump ${names[k]}: ${deviation.toFixed(3)} mm`);
      }
    return sections;
  }

  /**
   * Read a closed chart loop's extents, touch offsets and conic quarters about the chart origin.
   *
   * @param loop Closed loop, chart millimetres, last point not repeated, holding the origin.
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the guide convention, the crossing segment and the signed result.
   * @evidence contracts/development/implementation.md#principled-implementation Conic lofting's shoulder (Liming 1944): with the guides on the axis lines at the four extents, as `AutoMovieViewSection` touches its box, M is the chord midpoint and A the corner, so the segment from the origin through M to A is `M + t (A - M)` for t in [-1, 1]; the loop's outermost crossing there gives rho = t. For the rational quadratic quarter of middle weight w that crossing is `w / (1 + w)` (Farin, "Rational quadratic circles are parametrized by chord length", 2006; Shene's derivation of `|MX| / |MP1|`), the engine's `w = rho / (1 - rho)`: a circle quarter has `w = sqrt(2) / 2` and `rho = sqrt(2) - 1`, a parabola `w = 1` and `rho = 0.5`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass for the extents, one segment intersection per quarter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp and no fallback value: a concave quarter reads rho <= 0 and a loop missing the segment reads null.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) for N loop points per quarter.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; returns fresh tuples.
   */
  export function read(loop: readonly (readonly [number, number])[]): IReading {
    let iu: [number, number] = [0, 0];
    let iv: [number, number] = [0, 0];
    for (let i: number = 1; i < loop.length; ++i) {
      if (loop[i]![0] > loop[iu[0]]![0]) iu = [i, iu[1]];
      if (loop[i]![0] < loop[iu[1]]![0]) iu = [iu[0], i];
      if (loop[i]![1] > loop[iv[0]]![1]) iv = [i, iv[1]];
      if (loop[i]![1] < loop[iv[1]]![1]) iv = [iv[0], i];
    }
    const extents: [number, number, number, number] = [loop[iu[0]]![0], loop[iu[1]]![0], loop[iv[0]]![1], loop[iv[1]]![1]];
    const touch: [number, number, number, number] = [loop[iu[0]]![1], loop[iu[1]]![1], loop[iv[0]]![0], loop[iv[1]]![0]];

    // Guides on the axis lines, in quarter order +u, +v, -u, -v.
    const guides: [number, number][] = [
      [extents[0], 0],
      [0, extents[2]],
      [extents[1], 0],
      [0, extents[3]],
    ];
    const quarters: IQuarter[] = [0, 1, 2, 3].map((q: number): IQuarter => {
      const g0: [number, number] = guides[q]!;
      const g1: [number, number] = guides[(q + 1) % 4]!;
      const M: [number, number] = [(g0[0] + g1[0]) / 2, (g0[1] + g1[1]) / 2];
      const A: [number, number] = [g0[0] + g1[0], g0[1] + g1[1]];
      return { rho: crossing(loop, M, A), reach: Math.hypot(A[0] - M[0], A[1] - M[1]) };
    });
    return { extents, touch, quarters: quarters as [IQuarter, IQuarter, IQuarter, IQuarter] };
  }

  /**
   * The Newell vector of a closed 3D polygon: its vector area, doubled.
   *
   * @param points Closed polygon, last point not repeated.
   * @returns The vector; its components are twice the polygon's projected areas on the coordinate planes, so for a planar polygon its direction is the plane normal (by the points' winding) and its length twice the area.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the components' meaning, the planar consequence and the orientation.
   * @evidence contracts/development/implementation.md#principled-implementation Newell's sums of `(y_i - y_j)(z_i + z_j)` and their cyclic forms, the doubled projected areas (Tampieri, "Newell's Method for Computing the Plane Equation of a Polygon", Graphics Gems III, 1992); the exact plane cuts read here are planar.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over consecutive pairs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A degenerate polygon returns the zero vector rather than an invented normal.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function newell(points: readonly V3[]): V3 {
    const out: V3 = [0, 0, 0];
    for (let i: number = 0; i < points.length; ++i) {
      const p: V3 = points[i]!;
      const q: V3 = points[(i + 1) % points.length]!;
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
   * @returns The centroid, millimetres, or null when the polygon has no area (fewer than three points or a zero Newell vector): no area centroid exists then.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the plane premise and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation A fan of triangles from the first vertex, each weighted by its signed area along the unit Newell vector, so concave polygons and either winding give the area centroid.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One Newell pass, one fan pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No vertex mean or origin stands in for a missing area centroid.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function centroid(points: readonly V3[]): V3 | null {
    const n: V3 = newell(points);
    const length: number = Math.hypot(...n);
    if (length === 0 || points.length < 3) return null;
    const unit: V3 = scale(n, 1 / length);
    const o: V3 = points[0]!;
    let weight: number = 0;
    let sum: V3 = [0, 0, 0];
    for (let i: number = 1; i + 1 < points.length; ++i) {
      const a: V3 = points[i]!;
      const b: V3 = points[i + 1]!;
      const w: number = dot(cross(sub(a, o), sub(b, o)), unit) / 2;
      weight += w;
      sum = add(sum, scale(add(o, add(a, b)), w / 3));
    }
    return scale(sum, 1 / weight);
  }

  /**
   * The outermost crossing share `t` of the closed polyline with `M + t (A - M)`, t in [-1, 1], or null.
   */
  function crossing(poly: readonly (readonly [number, number])[], M: [number, number], A: [number, number]): number | null {
    const d: [number, number] = [A[0] - M[0], A[1] - M[1]];
    let best: number | null = null;
    for (let i: number = 0; i < poly.length; ++i) {
      const p: readonly [number, number] = poly[i]!;
      const q: readonly [number, number] = poly[(i + 1) % poly.length]!;
      const e: [number, number] = [q[0] - p[0], q[1] - p[1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (den === 0) continue;
      const w: [number, number] = [p[0] - M[0], p[1] - M[1]];
      const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
      const s: number = (w[0] * d[1] - w[1] * d[0]) / den;
      if (s >= 0 && s <= 1 && t >= -1 && t <= 1 && (best === null || t > best)) best = t;
    }
    return best;
  }

  /** Even-odd point in polygon. */
  function contains(poly: readonly (readonly [number, number])[], x: number, y: number): boolean {
    let c: boolean = false;
    for (let i: number = 0, j: number = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i]!;
      const [xj, yj] = poly[j]!;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }

  /** a + b. */
  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** a - b. */
  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** a s. */
  function scale(a: V3, s: number): V3 {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** a . b. */
  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** a x b. */
  function cross(a: V3, b: V3): V3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
}
