import { AutoMovieMeshExtract } from "./AutoMovieMeshExtract";

/** A point or direction, millimetres. */
type V3 = AutoMovieMeshExtract.V3;

/** A chart point or direction, millimetres. */
type V2 = [number, number];

/** A polyline segment, chart millimetres, start then end. */
type Segment = readonly [V2, V2];

/**
 * Sections of a dense mesh on the planes of a course: one exact plane cut per
 * station (`AutoMovieMeshExtract.outline` on that station's own plane, so a
 * turned family needs no common axis), the outer piece holding the course
 * point, that loop's own plane readings and the family's neighbour jumps.
 *
 * Each section reports the loop's Newell vector direction and area centroid
 * read in its own plane, its four chart extents and four conic quarter
 * shoulders ({@link read}), each support direction's crests and notches
 * (the loop's points whose tangent is square to that direction, from a
 * persistence walk) and its reach from the course point. A caller that
 * follows guides from section to section climbs to each one's hill
 * ({@link ascend}) and reads the quarters between them split at their
 * shoulder bars ({@link pieces}). A course's turn regularity is a property
 * of the course itself and belongs to its owner (the axis and its analytic
 * jet), not to these sampled planes.
 *
 * The jump check reads the holding loop's own values: an extent, or a
 * quarter's shoulder point (rho times its corner reach, millimetres), that
 * leaves the station-linear interpolation of its two neighbours by more than
 * the tolerance is flagged as a jump, so a neighbouring body in the same cut
 * (a hand beside the hip) does not flag the part.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the per-station plane convention, the readings, their units and null meanings, the climb, split and feature rules and the jump rule.
 * @evidence contracts/development/design.md#principled-representation The namespace groups a course's section reading: planes by station, holding loops in their own chart millimetres, and readings whose absence is null rather than a default; the axis-line quarters follow the four-quarter view section's guide convention and the split pieces the given guides of the touch/split view section.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Its consumers are `AutoMovieHumanF1Trace` and the operator tests; the plane cut stays with `AutoMovieMeshExtract`, the guides' correspondence from section to section with its caller, and the course's own geometry (its turn regularity) with the axis that owns it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member serves only a test or one part; the reading is the same for every part's course.
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
   * One quarter between two given guides, split at its shoulder bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the guides, the arc, the split point, its tangent reading, the two pieces and every null meaning.
   * @evidence contracts/development/design.md#principled-representation The loop's own arc between two guide points (each tangent along its support line) split at that arc's shoulder point, each piece a conic on its two ends and tangent lines with its own shoulder read on its own sub-arc (#3158).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the trace's split runs and receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing crossing or an unmet tangent pair stays null; nothing is clamped.
   */
  export interface IPiece {
    /** The split point: the arc's outermost crossing of the segment from the guides' chord midpoint toward their support lines' corner, chart mm; null when the arc misses it. */
    split: [number, number] | null;

    /** The crossed polyline edge's direction there (the polyline's own tangent at the split), radians from `+u` toward `+v`, along the arc from the first guide toward the second; null without a split. */
    angle: number | null;

    /** The shoulders of the piece from the first guide to the split and of the piece from the split to the second guide, each read on its own sub-arc (the crossed edge divided at the split); null where its tangent lines do not meet ahead of both ends or its sub-arc misses its segment. */
    shoulders: [number | null, number | null];

    /** Each piece's `|M->A|`, mm, null with its shoulder's first cause. */
    reach: [number | null, number | null];
  }

  /**
   * One point of a loop where its tangent is square to a support direction
   * and its outward side faces that direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two kinds, the point's chart and the value's meaning.
   * @evidence contracts/development/design.md#principled-representation A crest (a local maximum of the support, the loop convex there) or a notch (a local minimum facing the same way, the loop concave there), with its point and support value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the trace's receipt and its feature lines.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only features standing out by the walk's tolerance are reported; nothing is smoothed or merged, and no loop point is dropped.
   */
  export interface IFeature {
    /** `crest`: a local maximum of the support; `notch`: a local minimum facing the same direction. */
    kind: "crest" | "notch";

    /** The loop point, chart millimetres. */
    point: [number, number];

    /** Its support value (the point along the direction), millimetres. */
    value: number;
  }

  /**
   * A loop's four chart extents and four conic quarters about the course point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the extents' order and signs, the touch offsets' meaning, the features' order and the quarter order.
   * @evidence contracts/development/design.md#principled-representation The four-quarter view section's own inputs (four support lines and four shoulders) plus the touch offsets and the features that report what those inputs leave out.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the trace or its receipt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values are the loop's own; nothing is admitted or refused here.
   */
  export interface IReading {
    /** Signed extents `+u`, `-u`, `+v`, `-v`, millimetres about the course point: the loop's measured envelope. */
    extents: [number, number, number, number];

    /**
     * Where each extreme touches its support line, measured off the course
     * point's axis line, millimetres: the `v` of the `+u` and `-u` extremes,
     * the `u` of the `+v` and `-v` extremes. The four-quarter view section
     * touches its box on those axis lines, so a nonzero offset is shape it
     * cannot carry. A loop reaching its extreme value at more than one point
     * reports the first in loop order: a reading of this section alone, not
     * a correspondence with its neighbours.
     */
    touch: [number, number, number, number];

    /** The crests and notches facing `+u`, `-u`, `+v`, `-v`, each list in increasing phase from `-pi`. */
    features: [IFeature[], IFeature[], IFeature[], IFeature[]];

    /** Quarters q0..q3: between `+u`/`+v`, `+v`/`-u`, `-u`/`-v`, `-v`/`+u`, on the axis-line guides. */
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
   * @param tolerance Jump tolerance, millimetres, the features' persistence and the extraction's own flag tolerance (0.5 by default).
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
        reading: read(held.points, tolerance),
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
   * Read a closed chart loop's extents, touch offsets, features and conic quarters about the chart origin.
   *
   * @param loop Closed loop, chart millimetres, last point not repeated, holding the origin.
   * @param tolerance The features' persistence, millimetres (0.5 by default).
   * @returns The reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the guide convention, the crossing segment, the feature walk and the signed result.
   * @evidence contracts/development/implementation.md#principled-implementation Conic lofting's shoulder (Liming 1944): with the guides on the axis lines at the four extents, as `AutoMovieViewSection` touches its box, M is the chord midpoint and A the corner, so the segment from the origin through M to A is `M + t (A - M)` for t in [-1, 1]; the loop's outermost crossing there gives rho = t. For the rational quadratic quarter of middle weight w that crossing is `w / (1 + w)` (Farin, "Rational quadratic circles are parametrized by chord length", 2006; Shene's derivation of `|MX| / |MP1|`), the engine's `w = rho / (1 - rho)`: a circle quarter has `w = sqrt(2) / 2` and `rho = sqrt(2) - 1`, a parabola `w = 1` and `rho = 0.5`. Features: a hysteresis walk of the support `h = p . d` once around the loop from its global maximum keeps the alternating maxima and minima that differ by at least the tolerance (the zigzag of extrema with persistence at least the tolerance), and each keeps the direction its outward normal faces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass for the extents, one walk per direction, one segment intersection per quarter.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp and no fallback value: a concave quarter reads rho <= 0, a loop missing the segment reads null, and no feature is smoothed or merged.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) for N loop points per quarter and per direction.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; returns fresh tuples.
   */
  export function read(loop: readonly (readonly [number, number])[], tolerance: number = 0.5): IReading {
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
    const found: IFeature[][] = DIRECTIONS.map((d: V2): IFeature[] => features(loop, d, tolerance));

    // Guides on the axis lines, in quarter order +u, +v, -u, -v.
    const guides: V2[] = [
      [extents[0], 0],
      [0, extents[2]],
      [extents[1], 0],
      [0, extents[3]],
    ];
    const all: Segment[] = loop.map((p: readonly [number, number], i: number): Segment => [[p[0], p[1]], [loop[(i + 1) % loop.length]![0], loop[(i + 1) % loop.length]![1]]]);
    const quarters: IQuarter[] = [0, 1, 2, 3].map((q: number): IQuarter => {
      const g0: V2 = guides[q]!;
      const g1: V2 = guides[(q + 1) % 4]!;
      const M: V2 = [(g0[0] + g1[0]) / 2, (g0[1] + g1[1]) / 2];
      const A: V2 = [g0[0] + g1[0], g0[1] + g1[1]];
      return { rho: crossing(all, M, A)?.t ?? null, reach: Math.hypot(A[0] - M[0], A[1] - M[1]) };
    });
    return { extents, touch, features: found as IReading["features"], quarters: quarters as IReading["quarters"] };
  }

  /**
   * The hill of the support along a direction that holds a loop point: walk
   * the loop both ways from `start` while the support stays within the
   * tolerance of the best reached on that side, and return the higher of the
   * two bests. A dip deeper than the tolerance ends a side, so the walk stays
   * on the hill it began on (dips within the tolerance do not separate
   * hills, as in the features' persistence).
   *
   * @param loop Closed loop, chart millimetres, last point not repeated.
   * @param direction 0 `+u`, 1 `-u`, 2 `+v`, 3 `-v`.
   * @param start The loop index to climb from.
   * @param tolerance The persistence, millimetres (0.5 by default).
   * @returns The index of the hill's highest point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the walk, its stopping rule and the tie between the two sides.
   * @evidence contracts/development/implementation.md#principled-implementation Hill climbing on the loop's own support with the features' persistence, so a guide followed from section to section keeps its own hill rather than the global maximum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk per side, then the higher best.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No point is skipped, smoothed or dropped; each side stops at most once around the loop.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N).
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function ascend(loop: readonly (readonly [number, number])[], direction: number, start: number, tolerance: number = 0.5): number {
    const N: number = loop.length;
    const d: V2 = DIRECTIONS[direction]!;
    const h = (i: number): number => loop[i]![0] * d[0] + loop[i]![1] * d[1];
    let best: number = start;
    for (const step of [1, N - 1]) {
      let top: number = start;
      for (let k: number = 1, i: number = (start + step) % N; k < N; ++k, i = (i + step) % N) {
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
   * @param loop Closed loop, chart millimetres, last point not repeated, holding the origin.
   * @param guides The loop indices of the `+u`, `+v`, `-u` and `-v` guides, in increasing phase.
   * @returns One piece pair per quarter, `+u`/`+v`, `+v`/`-u`, `-u`/`-v`, `-v`/`+u`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the arcs, the guides' tangents, the corner, the split and piece readings and their nulls.
   * @evidence contracts/development/implementation.md#principled-implementation Each guide stands at its loop point, tangent along its support line in increasing phase; quarter q is the loop's own arc from guide q to guide q + 1 in increasing phase (by the loop's winding), and only that arc's segments are crossed. The shoulder construction on the guides with A the support lines' corner gives the arc's shoulder point S, which splits it (#3158); the polyline's tangent at S is the crossed edge's own direction, and that edge is divided at S between the two sub-arcs. Each piece is the conic on its two ends and tangent lines (`AutoMovieViewChain`: A where they meet, ahead of both ends), its shoulder the outermost crossing of its own M->A by its own sub-arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Per quarter: its arc, one split crossing, then two piece readings on the two sub-arcs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No crossing of another arc stands in, and no clamp or fallback: an arc missing its segment or an unmet tangent pair reads null.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) per quarter.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no requests.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; returns fresh tuples.
   */
  export function pieces(loop: readonly (readonly [number, number])[], guides: readonly [number, number, number, number]): [IPiece, IPiece, IPiece, IPiece] {
    const N: number = loop.length;
    let area: number = 0;
    for (let i: number = 0; i < N; ++i) {
      const p: readonly [number, number] = loop[i]!;
      const q: readonly [number, number] = loop[(i + 1) % N]!;
      area += p[0] * q[1] - q[0] * p[1];
    }
    const step: number = area > 0 ? 1 : N - 1;
    const lines: V2[] = [
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 0],
    ];
    const at = (i: number): V2 => [loop[i]![0], loop[i]![1]];
    const g: V2[] = guides.map(at);
    const corners: V2[] = [
      [g[0]![0], g[1]![1]],
      [g[2]![0], g[1]![1]],
      [g[2]![0], g[3]![1]],
      [g[0]![0], g[3]![1]],
    ];

    // The segments of the arc from loop index a to loop index b in increasing phase, each oriented along it.
    const arc = (a: number, b: number): Segment[] => {
      const out: Segment[] = [];
      for (let i: number = a; i !== b; i = (i + step) % N) out.push([at(i), at((i + step) % N)]);
      return out;
    };
    return [0, 1, 2, 3].map((q: number): IPiece => {
      const segments: Segment[] = arc(guides[q]!, guides[(q + 1) % 4]!);
      const g0: V2 = g[q]!;
      const g1: V2 = g[(q + 1) % 4]!;
      const M: V2 = [(g0[0] + g1[0]) / 2, (g0[1] + g1[1]) / 2];
      const A: V2 = corners[q]!;
      const hit: { t: number; index: number } | null = crossing(segments, M, A);
      if (hit === null) return { split: null, angle: null, shoulders: [null, null], reach: [null, null] };
      const S: V2 = [M[0] + hit.t * (A[0] - M[0]), M[1] + hit.t * (A[1] - M[1])];
      const [from, to]: Segment = segments[hit.index]!;
      const T: V2 = [to[0] - from[0], to[1] - from[1]];
      const first: [number | null, number | null] = piece(g0, lines[q]!, S, T, [...segments.slice(0, hit.index), [from, S]]);
      const second: [number | null, number | null] = piece(S, T, g1, lines[(q + 1) % 4]!, [[S, to], ...segments.slice(hit.index + 1)]);
      return { split: S, angle: Math.atan2(T[1], T[0]), shoulders: [first[0], second[0]], reach: [first[1], second[1]] };
    }) as [IPiece, IPiece, IPiece, IPiece];
  }

  /**
   * Read a conic shoulder between two supplied tangents on an ordered source arc.
   *
   * @param arc Actual chart points from the first contact through the last.
   * @param start Tangent at the first contact, oriented along the arc.
   * @param end Tangent at the last contact, oriented along the arc.
   * @returns The signed, dimensionless shoulder and the corner reach in millimetres. The reach can be known even when the arc misses the crossing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order and directions of the measured contacts, the two units, and the partial result when the arc misses the chord-to-corner ray.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same tangent intersection and measured M-to-A crossing as the split quarter.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure After checking both contacts exist, form consecutive segments and delegate the intersection and crossing to the shared piece reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the supplied measured contacts and tangents without replacing a failed conic.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear work in the ordered arc size for segment construction and the crossing scan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure arc reading has no shared requests across calls.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Segment pairs are temporary. Only the two scalar readings are returned.
   */
  export function shoulder(arc: readonly V2[], start: V2, end: V2): [number | null, number | null] {
    if (arc.length < 2) return [null, null];
    return piece(arc[0]!, start, arc[arc.length - 1]!, end, arc.slice(1).map((point: V2, i: number): Segment => [arc[i]!, point]));
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

  /** The four support directions, `+u`, `-u`, `+v`, `-v`. */
  const DIRECTIONS: readonly V2[] = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  /**
   * One conic piece's shoulder and reach on its own sub-arc: the piece from
   * P0 (tangent T0) to P2 (tangent T2) has its control point where the
   * tangent lines meet, `P0 + a T0 = P2 - b T2`, which must lie ahead of
   * both ends (a, b > 0); its shoulder is the sub-arc's outermost crossing of
   * the segment from the chord midpoint toward that point. Null with its
   * first cause.
   */
  function piece(P0: V2, T0: V2, P2: V2, T2: V2, segments: readonly Segment[]): [number | null, number | null] {
    const den: number = T0[0] * T2[1] - T0[1] * T2[0];
    if (den === 0) return [null, null];
    const d: V2 = [P2[0] - P0[0], P2[1] - P0[1]];
    const a: number = (d[0] * T2[1] - d[1] * T2[0]) / den;
    const b: number = (T0[0] * d[1] - T0[1] * d[0]) / den;
    if (!(a > 0 && b > 0)) return [null, null];
    const A: V2 = [P0[0] + a * T0[0], P0[1] + a * T0[1]];
    const M: V2 = [(P0[0] + P2[0]) / 2, (P0[1] + P2[1]) / 2];
    const reach: number = Math.hypot(A[0] - M[0], A[1] - M[1]);
    return [crossing(segments, M, A)?.t ?? null, reach];
  }

  /**
   * The crests and notches of a closed loop facing direction d: a hysteresis
   * walk of `h = p . d` once around from the global maximum keeps the
   * alternating extrema differing by at least the tolerance; each keeps its
   * kind when its outward normal (the loop's own winding, the tangent from
   * its two neighbours) faces d. Sorted by phase from `-pi`.
   */
  function features(loop: readonly (readonly [number, number])[], d: V2, tolerance: number): IFeature[] {
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
    const turns: { index: number; kind: "crest" | "notch" }[] = [{ index: start, kind: "crest" }];
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
    const out: IFeature[] = [];
    for (const turn of turns) {
      const a: readonly [number, number] = loop[(turn.index + N - 1) % N]!;
      const b: readonly [number, number] = loop[(turn.index + 1) % N]!;
      const t: V2 = [b[0] - a[0], b[1] - a[1]];
      const normal: V2 = [winding * t[1], -winding * t[0]];
      if (!(normal[0] * d[0] + normal[1] * d[1] > 0)) continue;
      const p: readonly [number, number] = loop[turn.index]!;
      out.push({ kind: turn.kind, point: [p[0], p[1]], value: h(turn.index) });
    }
    return out.sort((x: IFeature, y: IFeature): number => Math.atan2(x.point[1], x.point[0]) - Math.atan2(y.point[1], y.point[0]));
  }

  /**
   * The outermost crossing share `t` of the given segments with `M + t (A -
   * M)`, t in [-1, 1], and the crossed segment's index, or null. A
   * zero-length segment is never crossed.
   */
  function crossing(segments: readonly Segment[], M: V2, A: V2): { t: number; index: number } | null {
    const d: V2 = [A[0] - M[0], A[1] - M[1]];
    let best: { t: number; index: number } | null = null;
    segments.forEach(([p, q]: Segment, i: number): void => {
      const e: V2 = [q[0] - p[0], q[1] - p[1]];
      const den: number = d[0] * e[1] - d[1] * e[0];
      if (den === 0) return;
      const w: V2 = [p[0] - M[0], p[1] - M[1]];
      const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
      const s: number = (w[0] * d[1] - w[1] * d[0]) / den;
      if (s >= 0 && s <= 1 && t >= -1 && t <= 1 && (best === null || t > best.t)) best = { t, index: i };
    });
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
