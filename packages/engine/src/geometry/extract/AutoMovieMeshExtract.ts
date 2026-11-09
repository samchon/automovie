import { AutoMovieNaturalSpline } from "../construction/AutoMovieNaturalSpline";
import type { IAutoMovieConstructionProfileSource } from "../construction/IAutoMovieConstructionProfileSource";

/**
 * Reverse extraction of sparse 2D lines from a dense triangle mesh: exact
 * plane sections at stations along a frame axis, with their chained loops,
 * extreme points in eight in-plane directions and artifact flags, and the
 * fewest cubic Hermite knots (value and slope on a run, point and tangent on
 * a closed loop) that hold a dense sampled line within a tolerance. It is an
 * analysis of an existing mesh, kept apart from construction, whose sources
 * are authored and never fitted to samples: a modeler reads a reference here,
 * corrects the result by eye, and authors the corrected knots as source.
 * {@link profileCurve} is the output adaptor for that hand-over: it turns
 * per-station knot loops (extracted or corrected) into the curve owner the
 * construction profile consumes, which is why this module imports the
 * profile source type and the natural spline; it evaluates the given knots
 * and fits nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the units, the frame convention, the flag meanings and the knot removal rule.
 * @evidence contracts/development/design.md#principled-representation Represents Reverse extraction of sparse 2D lines from a dense triangle mesh: exact plane sections at stations along a frame axis, with their chained loops, extreme points in eight in-plane directions and artifact flags, and the fewest cubic Hermite knots (value and slope on a run, point and tangent on a closed loop) that hold a dense sampled line within a tolerance: companion namespace of 40 members (`V3`, `IMesh`, `IFrame`, `IExtreme`, `ILoop`, `ISection`, ...); units and frames named in its text: frame, world, second, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieMeshExtract` in packages/engine/src/geometry/extract/AutoMovieMeshExtract.ts; its surface is the 40 members listed and the text shows 10 other files naming it, mostly packages/human (6), test (3), packages/engine (1), so no member is declared for a presumed future need; members without their own doc: `at`, `add`, `sub`, `scale`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieMeshExtract {
  /**
   * A point, millimetres.
   *
   * @evidence contracts/development/design.md#principled-representation Three Cartesian coordinates in the mesh's own frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A plain tuple, matching the flat position arrays it is read from.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no admission; finite values are a producer premise.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the unit.
   */
  export type V3 = [number, number, number];

  /**
   * A triangle mesh in millimetres: flat xyz positions, three indices per triangle.
   *
   * @evidence contracts/development/design.md#principled-representation The indexed triangle list every mesh producer here emits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two flat arrays, borrowed, so a loader's typed arrays pass without copying.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no admission; indices in range are a producer premise.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the unit and the array layout.
   */
  export interface IMesh {
    /** Flat positions, three numbers per vertex, millimetres. */
    positions: ArrayLike<number>;

    /** Flat triangle indices, three per triangle. */
    indices: ArrayLike<number>;
  }

  /**
   * An orthonormal frame: origin and three unit axes.
   *
   * @evidence contracts/development/design.md#principled-representation Sections are cut normal to one axis; the next two axes in cyclic order span the section plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An origin and an axis triple, the whole of a rigid frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Orthonormality is a producer premise and is not re-checked.
   * @evidence contracts/development/common.md#meaningful-documentation States the in-plane axis convention at outline.
   */
  export interface IFrame {
    /** Origin, millimetres. */
    origin: V3;

    /** The three unit axes. */
    axes: [V3, V3, V3];
  }

  /**
   * One extreme point of a section along an in-plane direction.
   *
   * @evidence contracts/development/design.md#principled-representation The support point of the section polygon, which is always one of its vertices.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The point and its reach, nothing derived further.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reports the cut's own vertex; no smoothing.
   * @evidence contracts/development/common.md#meaningful-documentation States what the reach is measured from.
   */
  export interface IExtreme {
    /** The extreme section point, world millimetres. */
    point: V3;

    /** Its reach along the direction from the station's axis point, millimetres. */
    reach: number;
  }

  /**
   * One chained piece of a section: the crossings of consecutive triangles in order.
   *
   * @evidence contracts/development/design.md#principled-representation Crossings are chained through the mesh edges they lie on, which two adjacent triangles share on a manifold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface In-plane coordinates ready for reduceLoop, with a closed flag.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An open chain stays open; no gap is bridged.
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinates' axes and origin.
   */
  export interface ILoop {
    /**
     * The chain's points as `[a, b]` millimetres about the station's axis
     * point, `a` and `b` the section's in-plane axes (see {@link ISection.extremes});
     * coincident consecutive crossings are merged, a closed loop's last point
     * is not repeated.
     */
    points: [number, number][];

    /** Whether the chain closes on itself; an open chain is a hole, gap or broken slice. */
    closed: boolean;
  }

  /**
   * The section at one station.
   *
   * @evidence contracts/development/design.md#principled-representation Holds the exact cut's crossing count, chained loops, eight extremes and flags.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record per station, in station order.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Flags report artifacts; nothing is excluded on the caller's behalf.
   * @evidence contracts/development/common.md#meaningful-documentation States the direction names and every flag.
   */
  export interface ISection {
    /** The station along the frame axis, millimetres from the origin. */
    station: number;

    /** Intersection points found (zero when the plane misses the mesh). */
    count: number;

    /** The cut's chained pieces, closed loops and open chains alike, each oriented by the triangles' winding. */
    loops: ILoop[];

    /**
     * The cut's outer boundaries, largest enclosed area first: the closed
     * pieces after open chains were joined end to end across gaps up to the
     * bridge (each bridged gap flagged), less every piece enclosed by another
     * (eyes, teeth, a mouth bag). Disjoint bodies (two legs) give one each; a
     * reference with holes and slits still gives its outer contour here.
     */
    outer: ILoop[];

    /**
     * Extremes along `+a`, `-a`, `+b`, `-b` (a and b the two in-plane frame
     * axes after the station axis in cyclic order: for axis 1 they are axes 2
     * and 0), and the quarter diagonals `(+a+b)`, `(+a-b)`, `(-a+b)`, `(-a-b)`
     * over the square root of two; null when the plane misses.
     */
    extremes: Record<
      "+a" | "-a" | "+b" | "-b" | "+a+b" | "+a-b" | "-a+b" | "-a-b",
      IExtreme
    > | null;

    /**
     * Why this sample cannot be trusted as it stands, empty when sound: "open"
     * when the cut leaves dangling crossings (a hole, a gap or a broken slice
     * of the mesh; the flag names the dangling crossings and broken chains),
     * "jump <direction>" when an extreme leaves the mean of its two
     * neighbouring stations' by more than the tolerance (a spike or saw
     * tooth). A flagged sample is to be checked in the viewer or excluded.
     */
    flags: string[];
  }

  /**
   * One knot of a reduced run: station, value and slope.
   *
   * @evidence contracts/development/design.md#principled-representation A cubic Hermite knot; consecutive knots define one span through hermite.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dense index beside the knot's data lets a caller trace it to its sample and flags.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The value is the dense sample's own; the slope is fitted.
   * @evidence contracts/development/common.md#meaningful-documentation States which members are measured and which fitted.
   */
  export interface IKnot {
    /** Index of the dense point it sits on, in the caller's array (excluded samples counted). */
    index: number;

    /** Station. */
    s: number;

    /** Value: the dense sample's own. */
    value: number;

    /** Slope d value / d station, fitted to the dense samples of its two spans; zero at a prominent extremum. */
    slope: number;
  }

  /**
   * One knot of a reduced loop: point, tangent and chord parameter.
   *
   * @evidence contracts/development/design.md#principled-representation A planar cubic Hermite knot on the dense loop's chord-length parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The dense index and parameter beside the point and tangent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the dense sample's own; the tangent is fitted.
   * @evidence contracts/development/common.md#meaningful-documentation States the parameter and which members are fitted.
   */
  export interface ILoopKnot {
    /** Index of the dense point it sits on, in the caller's array (excluded samples counted). */
    index: number;

    /** Cumulative chord length of the dense loop (excluded samples left out) at the knot. */
    t: number;

    /** Point: the dense sample's own. */
    point: [number, number];

    /** Tangent d point / d t, fitted to the dense samples of its two spans; its axis component is zero at an axis extreme. */
    tangent: [number, number];
  }

  /**
   * The exact plane sections of a mesh at stations along one frame axis: each
   * triangle edge crossing the plane `dot(p - origin, axis) = station` gives
   * its exact crossing point (a vertex on the plane counts as just above it,
   * so a triangle crosses on exactly zero or two edges and no edge lies in
   * the plane). Each triangle's two crossings form one segment; segments are
   * chained through their shared edges into loops. A crossing used by other
   * than two segments is a dangling end, and the sample is flagged "open".
   * The extremes are taken over the crossings, which a polygonal section's
   * extremes always are. An extreme leaving the mean of its two neighbouring
   * stations' by more than the tolerance is flagged as a jump. The outer
   * boundaries join open chains across gaps up to the bridge, each bridged
   * gap flagged "bridged", chains still open flagged "unclosed", and drop the
   * pieces enclosed by another (see {@link ISection.outer}).
   *
   * @param mesh The mesh.
   * @param frame The frame.
   * @param stations Stations along the frame axis, millimetres, in order.
   * @param axis Index of the station axis in `frame.axes`.
   * @param tolerance Admitted departure of an extreme from its neighbours' mean, millimetres.
   * @param bridge Longest gap between chain ends the outer boundaries close, millimetres (25 by default: wider than a mouth slit or a nostril, narrower than a limb).
   * @returns One section per station, in the given order.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation on each sign-changing edge is the exact intersection of a flat triangle with a plane; the symbolic perturbation (a vertex on the plane counts as above) removes the degenerate cases, so every cut is a set of chains through edges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass per station collects crossings, segments and their chains; the jump flags are a second pass over neighbours.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Dangling crossings and jumps are flagged and never smoothed; the raw loops stay unbridged, and every gap the outer boundaries bridge is flagged with its length for the viewer check.
   * @evidence contracts/development/common.md#meaningful-documentation States the perturbation, the chaining, the extreme set and both flags.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S T) for S stations over T triangles, plus O(S P) for P crossings per station; heights along the axis are computed once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Vertex heights are shared across all stations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Per-station maps are released after the station; only the returned sections remain.
   */
  export function outline(
    mesh: IMesh,
    frame: IFrame,
    stations: readonly number[],
    axis: 0 | 1 | 2,
    tolerance: number = 0.5,
    bridge: number = 25,
  ): ISection[] {
    const n: V3 = frame.axes[axis];
    const a: V3 = frame.axes[((axis + 1) % 3) as 0 | 1 | 2];
    const b: V3 = frame.axes[((axis + 2) % 3) as 0 | 1 | 2];
    const count: number = Math.floor(mesh.indices.length / 3);
    const height: Float64Array = new Float64Array(mesh.positions.length / 3);
    for (let v: number = 0; v < height.length; ++v)
      height[v] = dot(sub(at(mesh, v), frame.origin), n);
    const r2: number = Math.SQRT1_2;
    const directions: [keyof NonNullable<ISection["extremes"]>, V3][] = [
      ["+a", a],
      ["-a", scale(a, -1)],
      ["+b", b],
      ["-b", scale(b, -1)],
      ["+a+b", scale(add(a, b), r2)],
      ["+a-b", scale(sub(a, b), r2)],
      ["-a+b", scale(sub(b, a), r2)],
      ["-a-b", scale(add(a, b), -r2)],
    ];
    const sections: ISection[] = stations.map((station: number): ISection => {
      // Crossing points by the edge they lie on, and each triangle's segment between two edges.
      const point: Map<string, V3> = new Map();
      const segments: [string, string][] = [];
      // A vertex on the plane counts as above it (simulation of simplicity).
      const above: (v: number) => boolean = (v: number): boolean =>
        height[v]! - station >= 0;
      for (let t: number = 0; t < count; ++t) {
        const ids: number[] = [
          mesh.indices[3 * t]!,
          mesh.indices[3 * t + 1]!,
          mesh.indices[3 * t + 2]!,
        ];
        const nodes: string[] = [];
        for (let k: number = 0; k < 3; ++k) {
          const i: number = ids[k]!;
          const j: number = ids[(k + 1) % 3]!;
          if (above(i) === above(j)) continue;
          const key: string = i < j ? `${i},${j}` : `${j},${i}`;
          if (!point.has(key)) {
            const di: number = height[i]! - station;
            const dj: number = height[j]! - station;
            const p: V3 = at(mesh, i);
            const q: V3 = at(mesh, j);
            const w: number = di / (di - dj);
            point.set(key, [
              p[0] + w * (q[0] - p[0]),
              p[1] + w * (q[1] - p[1]),
              p[2] + w * (q[2] - p[2]),
            ]);
          }
          nodes.push(key);
        }
        // Under the perturbation a triangle crosses on zero or two edges. The
        // segment runs along n x N (N the triangle's winding normal), so on a
        // consistently wound closed surface every piece of the cut turns the
        // same way round the solid and its ends meet tail to head.
        if (nodes.length === 2) {
          const winding: V3 = cross(
            sub(at(mesh, ids[1]!), at(mesh, ids[0]!)),
            sub(at(mesh, ids[2]!), at(mesh, ids[0]!)),
          );
          const along: number = dot(
            sub(point.get(nodes[1]!)!, point.get(nodes[0]!)!),
            cross(n, winding),
          );
          segments.push(
            along >= 0 ? [nodes[0]!, nodes[1]!] : [nodes[1]!, nodes[0]!],
          );
        }
      }
      if (point.size === 0)
        return {
          station,
          count: 0,
          loops: [],
          outer: [],
          extremes: null,
          flags: [],
        };
      const centre: V3 = add(frame.origin, scale(n, station));
      const extremes: Partial<NonNullable<ISection["extremes"]>> = {};
      for (const [name, d] of directions) {
        let best: IExtreme | null = null;
        for (const p of point.values()) {
          const reach: number = dot(sub(p, centre), d);
          if (best === null || reach > best.reach) best = { point: p, reach };
        }
        extremes[name] = best!;
      }
      const { loops, dangling } = chain(
        segments,
        (key: string): [number, number] => {
          const p: V3 = sub(point.get(key)!, centre);
          return [dot(p, a), dot(p, b)];
        },
      );
      const broken: number = loops.filter(
        (l: ILoop): boolean => !l.closed,
      ).length;
      const envelope: { outer: ILoop[]; gaps: string[]; unclosed: number } =
        enclose(loops, bridge);
      const flags: string[] =
        dangling === 0
          ? []
          : [`open: ${dangling} dangling crossings in ${broken} broken chains`];
      flags.push(...envelope.gaps);
      if (envelope.unclosed !== 0)
        flags.push(
          `unclosed: ${envelope.unclosed} chains left open past the ${bridge} mm bridge`,
        );
      return {
        station,
        count: point.size,
        loops,
        outer: envelope.outer,
        extremes: extremes as NonNullable<ISection["extremes"]>,
        flags,
      };
    });
    for (let i: number = 1; i + 1 < sections.length; ++i) {
      const [p, c, q] = [
        sections[i - 1]!.extremes,
        sections[i]!.extremes,
        sections[i + 1]!.extremes,
      ];
      if (p === null || c === null || q === null) continue;
      for (const [name] of directions) {
        const jump: number =
          c[name].reach - (p[name].reach + q[name].reach) / 2;
        if (Math.abs(jump) > tolerance)
          sections[i]!.flags.push(`jump ${name}: ${jump.toFixed(3)} mm`);
      }
    }
    return sections;
  }

  /**
   * Chains a section's segments through their shared crossings: chains start
   * first at crossings of other than two segments (the ends of open chains),
   * then anywhere on what remains (closed loops). Consecutive coincident
   * points (two edges meeting at a vertex just above the plane) are merged.
   */
  function chain(
    segments: readonly [string, string][],
    place: (key: string) => [number, number],
  ): { loops: ILoop[]; dangling: number } {
    const incident: Map<string, number[]> = new Map();
    for (let s: number = 0; s < segments.length; ++s)
      for (const key of segments[s]!) {
        const list: number[] | undefined = incident.get(key);
        if (list === undefined) incident.set(key, [s]);
        else list.push(s);
      }
    let dangling: number = 0;
    for (const list of incident.values()) if (list.length !== 2) dangling += 1;
    const used: Uint8Array = new Uint8Array(segments.length);
    const loops: ILoop[] = [];
    const walk: (start: string) => void = (start: string): void => {
      const keys: string[] = [start];
      let node: string = start;
      // Steps along and against the segments' winding direction.
      let along: number = 0;
      for (;;) {
        const next: number | undefined = incident
          .get(node)!
          .find((s: number): boolean => used[s] === 0);
        if (next === undefined) break;
        used[next] = 1;
        const [p, q] = segments[next]!;
        along += p === node ? 1 : -1;
        node = p === node ? q : p;
        keys.push(node);
        if (node === start) break;
      }
      const closed: boolean = keys.length > 3 && keys.at(-1) === start;
      if (closed) keys.pop();
      // The chain follows the winding of most of its segments.
      if (along < 0) keys.reverse();
      const points: [number, number][] = [];
      for (const key of keys) {
        const p: [number, number] = place(key);
        const last: [number, number] | undefined = points.at(-1);
        if (
          last === undefined ||
          Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-9
        )
          points.push(p);
      }
      if (
        closed &&
        points.length > 1 &&
        Math.hypot(
          points[0]![0] - points.at(-1)![0],
          points[0]![1] - points.at(-1)![1],
        ) <= 1e-9
      )
        points.pop();
      loops.push({ points, closed });
    };
    for (const [key, list] of incident)
      if (list.length !== 2 && list.some((s: number): boolean => used[s] === 0))
        walk(key);
    for (let s: number = 0; s < segments.length; ++s)
      if (used[s] === 0) walk(segments[s]![0]);
    return { loops, dangling };
  }

  /**
   * A cut's outer boundaries. Open chains are joined end to end, always the
   * nearest pair of ends first while that gap stays within the bridge: first
   * only a chain's tail to a chain's head (the winding agrees, so the join
   * continues the same contour), then any two ends with a chain reversed
   * (an inconsistently wound reference). A chain whose own tail meets its
   * head closes. The closed pieces enclosed by another (tested at their first
   * point, even-odd) are dropped; the rest return, largest area first.
   */
  function enclose(
    pieces: readonly ILoop[],
    bridge: number,
  ): { outer: ILoop[]; gaps: string[]; unclosed: number } {
    const closed: [number, number][][] = pieces
      .filter((l: ILoop): boolean => l.closed)
      .map((l: ILoop): [number, number][] => l.points);
    const open: [number, number][][] = pieces
      .filter((l: ILoop): boolean => !l.closed && l.points.length >= 1)
      .map((l: ILoop): [number, number][] => l.points.slice());
    const gaps: string[] = [];
    const distance: (
      p: readonly [number, number],
      q: readonly [number, number],
    ) => number = (
      p: readonly [number, number],
      q: readonly [number, number],
    ): number => Math.hypot(p[0] - q[0], p[1] - q[1]);
    for (const reversible of [false, true]) {
      for (;;) {
        // The nearest joinable pair: i's tail to j's head, after reversing i or j when allowed.
        let best: {
          i: number;
          j: number;
          flipI: boolean;
          flipJ: boolean;
          gap: number;
        } | null = null;
        for (let i: number = 0; i < open.length; ++i)
          for (let j: number = 0; j < open.length; ++j) {
            const a: [number, number][] = open[i]!;
            const b: [number, number][] = open[j]!;
            const options: [boolean, boolean][] =
              i === j
                ? a.length >= 3
                  ? [[false, false]]
                  : []
                : reversible
                  ? [
                      [false, false],
                      [false, true],
                      [true, false],
                    ]
                  : [[false, false]];
            for (const [flipI, flipJ] of options) {
              const tail: [number, number] = flipI ? a[0]! : a.at(-1)!;
              const head: [number, number] = flipJ ? b.at(-1)! : b[0]!;
              const gap: number = distance(tail, head);
              if (gap <= bridge && (best === null || gap < best.gap))
                best = { i, j, flipI, flipJ, gap };
            }
          }
        if (best === null) break;
        const a: [number, number][] = best.flipI
          ? open[best.i]!.slice().reverse()
          : open[best.i]!;
        if (best.gap > 1e-9)
          gaps.push(
            `bridged: ${best.gap.toFixed(3)} mm${best.flipI || best.flipJ ? " (a chain reversed)" : ""}`,
          );
        if (best.i === best.j) {
          closed.push(a);
          open.splice(best.i, 1);
          continue;
        }
        const b: [number, number][] = best.flipJ
          ? open[best.j]!.slice().reverse()
          : open[best.j]!;
        const joined: [number, number][] =
          best.gap > 1e-9 ? a.concat(b) : a.concat(b.slice(1));
        open[best.i] = joined;
        open.splice(best.j, 1);
      }
    }
    const loops: { points: [number, number][]; area: number }[] = closed
      .filter((p: [number, number][]): boolean => p.length >= 3)
      .map(
        (
          points: [number, number][],
        ): { points: [number, number][]; area: number } => ({
          points,
          area: Math.abs(shoelace(points)),
        }),
      );
    loops.sort(
      (x: { area: number }, y: { area: number }): number => y.area - x.area,
    );
    const outer: ILoop[] = [];
    for (let k: number = 0; k < loops.length; ++k) {
      const probe: [number, number] = loops[k]!.points[0]!;
      let inside: boolean = false;
      for (let m: number = 0; m < loops.length && !inside; ++m)
        if (
          m !== k &&
          loops[m]!.area >= loops[k]!.area &&
          contains(loops[m]!.points, probe)
        )
          inside = true;
      if (!inside) outer.push({ points: loops[k]!.points, closed: true });
    }
    return { outer, gaps, unclosed: open.length };
  }

  /** The signed shoelace area of a closed polygon, positive counter-clockwise. */
  function shoelace(points: readonly (readonly [number, number])[]): number {
    let out: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const p: readonly [number, number] = points[i]!;
      const q: readonly [number, number] = points[(i + 1) % points.length]!;
      out += (p[0] * q[1] - q[0] * p[1]) / 2;
    }
    return out;
  }

  /** Even-odd point-in-polygon by a ray along +x. */
  function contains(
    polygon: readonly (readonly [number, number])[],
    p: readonly [number, number],
  ): boolean {
    let inside: boolean = false;
    for (
      let i: number = 0, j: number = polygon.length - 1;
      i < polygon.length;
      j = i++
    ) {
      const a: readonly [number, number] = polygon[i]!;
      const b: readonly [number, number] = polygon[j]!;
      if (
        a[1] > p[1] !== b[1] > p[1] &&
        p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        inside = !inside;
    }
    return inside;
  }

  /**
   * The fewest value-and-slope knots that hold a dense run within the
   * tolerance. Every sample starts as a knot with its central-difference
   * slope; knots are then removed one at a time, always the one whose removal
   * deviates least, while that deviation stays within the tolerance. On each
   * removal the two neighbouring knots' slopes are refitted by least squares
   * to the dense samples of the three spans they shape (knot removal with a
   * least-squares approximation, Lyche and Morken, Knot removal for
   * parametric B-spline curves and surfaces, CAGD 4, 1987), so facet noise in
   * the samples does not enter the slopes, and the deviation is the largest
   * over those spans' samples. Knot values stay the samples' own.
   *
   * Never removed: the ends, the pinned indices, and the prominent features: a
   * local extremum whose topographic prominence exceeds twice the tolerance
   * (its slope is held at zero, so the curve's extremum is the sample's), and
   * an inflection (sign change of the divided second difference) between two
   * bends whose sagittas exceed twice the tolerance after the weaker wiggles
   * merge away. Twice the tolerance is the noise threshold because a curve
   * through the middle of a bump that high stays within the tolerance of both
   * its top and its foot without a knot of its own.
   *
   * @param all Dense `[station, value]` points in strictly increasing station order.
   * @param tolerance Largest admitted deviation, the values' units (0.5 mm by default).
   * @param pinned Indices of named landmarks to keep.
   * @param excluded Indices of flagged samples to leave out of the fit and its error (holes, spikes, saw teeth).
   * @returns The knots in station order and the largest deviation of any kept dense sample from its span.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Greedy knot removal ranked by the measured Hermite span deviation, with local least-squares slope refits; prominent features are found by topographic prominence of values and of bend runs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the removal engine with reduceLoop; only the feature pins and the scalar dimension differ.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance is measured on every kept sample after each removal; no knot count is targeted.
   * @evidence contracts/development/common.md#meaningful-documentation States the removal order, the refit, the pins, the noise threshold and its reason.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N^2) for the best-candidate scans over N samples; each refit is linear in the samples of five neighbouring knots' spans.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Candidate costs are cached and recomputed only for the six positions around a removal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources O(N) call-local arrays; only the knots are returned.
   */
  export function reduce(
    all: readonly (readonly [number, number])[],
    tolerance: number = 0.5,
    pinned: readonly number[] = [],
    excluded: readonly number[] = [],
  ): { knots: IKnot[]; error: number } {
    const kept: number[] = keptIndices(all.length, excluded);
    const points: (readonly [number, number])[] = kept.map(
      (i: number): readonly [number, number] => all[i]!,
    );
    const pins: number[] = pinned
      .map((i: number): number => kept.indexOf(i))
      .filter((i: number): boolean => i >= 0);
    const n: number = points.length;
    if (n < 2) throw new Error("A run needs at least two points");
    const s: number[] = points.map(
      (p: readonly [number, number]): number => p[0],
    );
    const v: number[] = points.map(
      (p: readonly [number, number]): number => p[1],
    );
    const slope: number[] = s.map((_: number, i: number): number =>
      i === 0
        ? (v[1]! - v[0]!) / (s[1]! - s[0]!)
        : i === n - 1
          ? (v[n - 1]! - v[n - 2]!) / (s[n - 1]! - s[n - 2]!)
          : (v[i + 1]! - v[i - 1]!) / (s[i + 1]! - s[i - 1]!),
    );
    const keep: boolean[] = new Array<boolean>(n).fill(false);
    const flat: boolean[] = new Array<boolean>(n).fill(false);
    keep[0] = true;
    keep[n - 1] = true;
    for (const i of pins) keep[i] = true;
    // Only prominent features are pinned; see the doc comment for the threshold.
    const noise: number = 2 * tolerance;
    for (let i: number = 1; i + 1 < n; ++i)
      if (
        (v[i]! - v[i - 1]!) * (v[i + 1]! - v[i]!) < 0 &&
        prominence(v, i) > noise
      ) {
        keep[i] = true;
        flat[i] = true;
        slope[i] = 0;
      }
    // Bends are divided second differences, so unequal station steps keep their sign.
    const bend: number[] = v.map((_: number, i: number): number =>
      i === 0 || i === n - 1
        ? 0
        : (v[i + 1]! - v[i]!) / (s[i + 1]! - s[i]!) -
          (v[i]! - v[i - 1]!) / (s[i]! - s[i - 1]!),
    );
    // A run's signed sagitta: how far its samples stand off the chord between
    // its outer neighbours, positive on the side its bend sign curves away to.
    const sagitta: (first: number, last: number, sign: number) => number = (
      first: number,
      last: number,
      sign: number,
    ): number => {
      const a: number = first - 1;
      const b: number = last + 1;
      let out: number = -Infinity;
      for (let k: number = first; k <= last; ++k)
        out = Math.max(
          out,
          sign *
            (v[a]! +
              ((v[b]! - v[a]!) * (s[k]! - s[a]!)) / (s[b]! - s[a]!) -
              v[k]!),
        );
      return out;
    };
    for (const i of inflections(bend, false, sagitta, noise)) keep[i] = true;
    const alive: number[] = remove({
      t: s,
      period: null,
      values: [v],
      slopes: [slope],
      fixed: [flat],
      keep,
      tolerance,
      minimum: 2,
    });
    return {
      knots: alive.map(
        (i: number): IKnot => ({
          index: kept[i]!,
          s: s[i]!,
          value: v[i]!,
          slope: slope[i]!,
        }),
      ),
      error: worstSpan(
        { t: s, period: null, values: [v], slopes: [slope] },
        alive,
      ),
    };
  }

  /**
   * The loop variant for top silhouettes and section loops: the dense closed
   * loop is parameterised by cumulative chord length, every point starts as a
   * knot with its periodic central-difference tangent, and knots are removed
   * as in {@link reduce}, the deviation being the Euclidean distance of a
   * dense point from its span and both tangent components refitted. Never
   * removed: the extremes along both axes (their axis component of tangent
   * held at zero, so the curve's extreme is the sample's), the pinned indices
   * and the prominent inflections (sign changes of the turn between bends
   * whose sagittas exceed twice the tolerance after the weaker facet wiggles
   * merge away); at least four knots remain.
   *
   * @param all Dense closed loop, last point not repeated, no two consecutive points equal.
   * @param tolerance Largest admitted distance (0.5 mm by default).
   * @param pinned Indices of named landmarks to keep.
   * @param excluded Indices of flagged samples to leave out of the fit and its error.
   * @returns The knots in loop order, the loop's chord length and the largest distance of any kept dense point from its span.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same knot removal as reduce on a periodic chord-length parameter; x and y decouple in the least-squares refit because they share the Hermite basis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the removal engine with reduce; only the parameter, the period and the pins differ.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The distance is measured on every kept dense point after each removal; no knot count is targeted.
   * @evidence contracts/development/common.md#meaningful-documentation States the parameter, the pins, the held tangent components and the minimum.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N^2) best-candidate scans over N points with refits linear in five knots' spans.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Candidate costs are cached and recomputed only around a removal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources O(N) call-local arrays; only the knots are returned.
   */
  export function reduceLoop(
    all: readonly (readonly [number, number])[],
    tolerance: number = 0.5,
    pinned: readonly number[] = [],
    excluded: readonly number[] = [],
  ): { knots: ILoopKnot[]; length: number; error: number } {
    const kept: number[] = keptIndices(all.length, excluded);
    const points: (readonly [number, number])[] = kept.map(
      (i: number): readonly [number, number] => all[i]!,
    );
    const pins: number[] = pinned
      .map((i: number): number => kept.indexOf(i))
      .filter((i: number): boolean => i >= 0);
    const n: number = points.length;
    if (n < 4) throw new Error("A loop needs at least four points");
    const t: number[] = [0];
    for (let i: number = 1; i < n; ++i)
      t.push(
        t[i - 1]! +
          Math.hypot(
            points[i]![0] - points[i - 1]![0],
            points[i]![1] - points[i - 1]![1],
          ),
      );
    const length: number =
      t[n - 1]! +
      Math.hypot(
        points[0]![0] - points[n - 1]![0],
        points[0]![1] - points[n - 1]![1],
      );
    const wrap: (i: number) => number = (i: number): number =>
      ((i % n) + n) % n;
    const pt: (i: number) => readonly [number, number] = (
      i: number,
    ): readonly [number, number] => points[wrap(i)]!;
    const values: [number[], number[]] = [
      points.map((p: readonly [number, number]): number => p[0]),
      points.map((p: readonly [number, number]): number => p[1]),
    ];
    const slopes: [number[], number[]] = [[], []];
    for (let i: number = 0; i < n; ++i) {
      // The periodic central difference over the chord length between the two neighbours.
      const dt: number =
        forward(t, length, wrap(i - 1), i) + forward(t, length, i, wrap(i + 1));
      slopes[0].push((pt(i + 1)[0] - pt(i - 1)[0]) / dt);
      slopes[1].push((pt(i + 1)[1] - pt(i - 1)[1]) / dt);
    }
    const keep: boolean[] = new Array<boolean>(n).fill(false);
    const fixed: [boolean[], boolean[]] = [
      new Array<boolean>(n).fill(false),
      new Array<boolean>(n).fill(false),
    ];
    for (const i of pins) keep[i] = true;
    for (const c of [0, 1] as const) {
      let lo: number = 0;
      let hi: number = 0;
      for (let i: number = 1; i < n; ++i) {
        if (points[i]![c] < points[lo]![c]) lo = i;
        if (points[i]![c] > points[hi]![c]) hi = i;
      }
      for (const i of [lo, hi]) {
        keep[i] = true;
        fixed[c][i] = true;
        slopes[c][i] = 0;
      }
    }
    const turn: (i: number) => number = (i: number): number => {
      const a: readonly [number, number] = pt(i - 1);
      const b: readonly [number, number] = pt(i);
      const c: readonly [number, number] = pt(i + 1);
      return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    };
    // A run's signed sagitta: the farthest standoff of its samples from the
    // chord between its outer neighbours, positive on the side its turn sign
    // bulges to (right of the chord for left turns).
    const sagitta: (first: number, last: number, sign: number) => number = (
      first: number,
      last: number,
      sign: number,
    ): number => {
      const a: readonly [number, number] = pt(first - 1);
      const b: readonly [number, number] = pt(last + 1);
      const d: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
      let out: number = -Infinity;
      for (let k: number = first; k <= last; ++k) {
        const p: readonly [number, number] = pt(k);
        out = Math.max(
          out,
          d === 0
            ? Math.hypot(p[0] - a[0], p[1] - a[1])
            : (sign *
                ((b[1] - a[1]) * (p[0] - a[0]) -
                  (b[0] - a[0]) * (p[1] - a[1]))) /
                d,
        );
      }
      return out;
    };
    for (const i of inflections(
      points.map((_: readonly [number, number], i: number): number => turn(i)),
      true,
      sagitta,
      2 * tolerance,
    ))
      keep[i] = true;
    const alive: number[] = remove({
      t,
      period: length,
      values,
      slopes,
      fixed,
      keep,
      tolerance,
      minimum: 4,
    });
    return {
      knots: alive.map(
        (i: number): ILoopKnot => ({
          index: kept[i]!,
          t: t[i]!,
          point: [values[0][i]!, values[1][i]!],
          tangent: [slopes[0][i]!, slopes[1][i]!],
        }),
      ),
      length,
      error: worstSpan({ t, period: length, values, slopes }, alive),
    };
  }

  /**
   * One station's reduced closed loop, as {@link reduceLoop} returns it, at
   * its station: the input of {@link profileCurve}.
   *
   * @evidence contracts/development/design.md#principled-representation Pairs a periodic Hermite knot loop with the station of the plane it lies in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The reduceLoop result is taken as it is, so a modeler's corrected knots pass in the same shape.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no admission; profileCurve checks the station order and knot count.
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinates the points are in.
   */
  export interface IStationLoop {
    /** The station, millimetres along the frame axis. */
    station: number;

    /** The loop's knots (points in the section's `[a, b]` millimetres about the station's axis point) and its chord length. */
    loop: { knots: readonly ILoopKnot[]; length: number };
  }

  /**
   * A section family through reduced loops at several stations, in the shape
   * the engine's profile construction consumes
   * (`IAutoMovieConstructionProfileSource.ICurve`): `point(station, clock)`
   * with its phase and total-order-two jet, in the loops' `[a, b]`
   * millimetres. Nothing is fitted: each loop is its own periodic Hermite
   * spline, and stations are joined by the natural cubic spline through the
   * loops' values at the same clock.
   *
   * The clock is each loop's chord length over its total, in [0, 1) with
   * period 1, so equal clocks are equal fractions of the way round. Every
   * loop is first turned counter-clockwise in `[a, b]` (positive shoelace
   * area), and its clock starts at its knot farthest along `+a` (the extreme
   * reduceLoop always keeps), so clock 0 is the `+a` side at every station.
   * Station derivatives come from the natural spline's cardinal functions,
   * clock derivatives from the Hermite spans, so all orders differentiate one
   * function; past the end stations the spline extends linearly.
   *
   * @param stations At least two loops, in strictly increasing station order.
   * @returns The curve family; its domain is the first to the last station.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A tensor of a periodic cubic Hermite loop in the clock and a natural cubic spline in station; cardinal weights make the station and clock derivatives exact derivatives of the same function.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One adaptor from reduceLoop's output to the profile curve owner; no second representation is kept.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The correspondence across stations is the chord-length fraction from the +a extreme, stated here; where loops change shape sharply it may slide, which the viewer check shows, and nothing is resampled to hide it.
   * @evidence contracts/development/common.md#meaningful-documentation States the clock, the orientation, the origin, the station interpolation and the coordinates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation solves S cardinal splines in O(S^2); each reading costs O(S (log S + log K)) for S stations of up to K knots.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The cardinal splines and normalised loops are prepared once and shared by every reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned curve retains the normalised loops and S cardinal splines for its owner's lifetime.
   */
  export function profileCurve(
    stations: readonly IStationLoop[],
  ): IAutoMovieConstructionProfileSource.ICurve {
    if (stations.length < 2)
      throw new Error("A profile curve needs loops at two stations at least");
    for (let i: number = 1; i < stations.length; ++i)
      if (!(stations[i]!.station > stations[i - 1]!.station))
        throw new Error(
          "Profile loops must be in strictly increasing station order",
        );
    const xs: number[] = stations.map((s: IStationLoop): number => s.station);
    // Cardinal natural splines: weight i is 1 at station i and 0 at the others.
    const cardinal: AutoMovieNaturalSpline.ISpline[] = xs.map(
      (_: number, i: number): AutoMovieNaturalSpline.ISpline =>
        AutoMovieNaturalSpline.create(
          xs,
          xs.map((__: number, j: number): number => (i === j ? 1 : 0)),
        ),
    );
    const loops: IClockLoop[] = stations.map(
      (s: IStationLoop): IClockLoop => clockLoop(s.loop),
    );
    const sum: (
      station: number,
      clock: number,
    ) => IAutoMovieConstructionProfileSource.IJet = (
      station: number,
      clock: number,
    ): IAutoMovieConstructionProfileSource.IJet => {
      const out: IAutoMovieConstructionProfileSource.IJet = {
        p: [0, 0],
        s: [0, 0],
        t: [0, 0],
        ss: [0, 0],
        st: [0, 0],
        tt: [0, 0],
      };
      for (let i: number = 0; i < loops.length; ++i) {
        const [w, ws, wss] = AutoMovieNaturalSpline.read(cardinal[i]!, station);
        if (w === 0 && ws === 0 && wss === 0) continue;
        const [p, t, tt] = readClock(loops[i]!, clock);
        for (const d of [0, 1] as const) {
          out.p[d] += w * p[d];
          out.s[d] += ws * p[d];
          out.ss[d] += wss * p[d];
          out.t[d] += w * t[d];
          out.st[d] += ws * t[d];
          out.tt[d] += w * tt[d];
        }
      }
      return out;
    };
    return {
      domain: [xs[0]!, xs.at(-1)!],
      clock: [0, 1],
      period: 1,
      point: (
        station: number,
        clock: number,
      ): IAutoMovieConstructionProfileSource.Vector => sum(station, clock).p,
      phase: (
        station: number,
        clock: number,
      ): IAutoMovieConstructionProfileSource.IPhase => {
        const jet: IAutoMovieConstructionProfileSource.IJet = sum(
          station,
          clock,
        );
        return { p: jet.p, t: jet.t, tt: jet.tt };
      },
      jet: (
        station: number,
        clock: number,
      ): IAutoMovieConstructionProfileSource.IJet => sum(station, clock),
    };
  }

  /** A loop normalised to the unit clock: knot clocks from 0, points, and tangents per clock unit. */
  interface IClockLoop {
    clocks: number[];
    points: [number, number][];
    tangents: [number, number][];
  }

  /** Turns a reduced loop counter-clockwise, starts it at its +a extreme knot and rescales it to the unit clock. */
  function clockLoop(loop: {
    knots: readonly ILoopKnot[];
    length: number;
  }): IClockLoop {
    const k: number = loop.knots.length;
    if (k < 3) throw new Error("A profile loop needs three knots at least");
    let knots: {
      t: number;
      point: [number, number];
      tangent: [number, number];
    }[] = loop.knots.map(
      (
        x: ILoopKnot,
      ): { t: number; point: [number, number]; tangent: [number, number] } => ({
        t: x.t,
        point: x.point,
        tangent: x.tangent,
      }),
    );
    if (
      shoelace(
        knots.map(
          (x: { point: [number, number] }): [number, number] => x.point,
        ),
      ) < 0
    )
      // Reversed travel: the parameter runs back from the loop's length and the tangents flip.
      knots = knots
        .reverse()
        .map(
          (x: {
            t: number;
            point: [number, number];
            tangent: [number, number];
          }): {
            t: number;
            point: [number, number];
            tangent: [number, number];
          } => ({
            t: loop.length - x.t,
            point: x.point,
            tangent: [-x.tangent[0], -x.tangent[1]],
          }),
        );
    let first: number = 0;
    for (let i: number = 1; i < k; ++i)
      if (knots[i]!.point[0] > knots[first]!.point[0]) first = i;
    const t0: number = knots[first]!.t;
    const clocks: number[] = [];
    const points: [number, number][] = [];
    const tangents: [number, number][] = [];
    for (let j: number = 0; j < k; ++j) {
      const x: {
        t: number;
        point: [number, number];
        tangent: [number, number];
      } = knots[(first + j) % k]!;
      clocks.push(
        ((((x.t - t0) % loop.length) + loop.length) % loop.length) /
          loop.length,
      );
      points.push([x.point[0], x.point[1]]);
      // d point / d clock = d point / d t * d t / d clock, with t = clock * length.
      tangents.push([x.tangent[0] * loop.length, x.tangent[1] * loop.length]);
    }
    return { clocks, points, tangents };
  }

  /** A normalised loop's point and its first and second clock derivatives at a clock, wrapped into [0, 1). */
  function readClock(
    loop: IClockLoop,
    clock: number,
  ): [[number, number], [number, number], [number, number]] {
    const c: number = clock - Math.floor(clock);
    const n: number = loop.clocks.length;
    // The last knot clock at or before c (the first knot is at 0).
    let lo: number = 0;
    let hi: number = n - 1;
    while (lo < hi) {
      const mid: number = (lo + hi + 1) >> 1;
      if (loop.clocks[mid]! <= c) lo = mid;
      else hi = mid - 1;
    }
    const j: number = (lo + 1) % n;
    const c0: number = loop.clocks[lo]!;
    const h: number = (j === 0 ? 1 : loop.clocks[j]!) - c0;
    const u: number = (c - c0) / h;
    const u2: number = u * u;
    // The Hermite basis, its first and second derivatives in u.
    const b: number[] = [
      2 * u2 * u - 3 * u2 + 1,
      u2 * u - 2 * u2 + u,
      -2 * u2 * u + 3 * u2,
      u2 * u - u2,
    ];
    const b1: number[] = [
      6 * u2 - 6 * u,
      3 * u2 - 4 * u + 1,
      -6 * u2 + 6 * u,
      3 * u2 - 2 * u,
    ];
    const b2: number[] = [12 * u - 6, 6 * u - 4, -12 * u + 6, 6 * u - 2];
    const p0: [number, number] = loop.points[lo]!;
    const p1: [number, number] = loop.points[j]!;
    const m0: [number, number] = loop.tangents[lo]!;
    const m1: [number, number] = loop.tangents[j]!;
    const mix: (w: number[], d: 0 | 1) => number = (
      w: number[],
      d: 0 | 1,
    ): number =>
      w[0]! * p0[d] + w[1]! * h * m0[d] + w[2]! * p1[d] + w[3]! * h * m1[d];
    return [
      [mix(b, 0), mix(b, 1)],
      [mix(b1, 0) / h, mix(b1, 1) / h],
      [mix(b2, 0) / (h * h), mix(b2, 1) / (h * h)],
    ];
  }

  /**
   * The cubic Hermite through (s0, v0, m0) and (s1, v1, m1) at s: the span
   * every knot pair of {@link reduce} and, per coordinate, of
   * {@link reduceLoop} defines.
   *
   * @param s0 Start station.
   * @param v0 Start value.
   * @param m0 Start slope.
   * @param s1 End station, different from `s0`.
   * @param v1 End value.
   * @param m1 End slope.
   * @param s Station to read.
   * @returns The span's value at `s`; outside `[s0, s1]` the same cubic extended.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The four cubic Hermite basis functions on the normalised parameter, slopes scaled by the span length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar evaluation; vector spans call it per coordinate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Equal stations are not admitted and give a non-finite result rather than a guess.
   * @evidence contracts/development/common.md#meaningful-documentation States the argument order and the outside-span behaviour.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A single evaluation coordinates no work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains nothing.
   */
  export function hermite(
    s0: number,
    v0: number,
    m0: number,
    s1: number,
    v1: number,
    m1: number,
    s: number,
  ): number {
    const h: number = s1 - s0;
    const [h00, h10, h01, h11] = basis((s - s0) / h);
    return h00 * v0 + h10 * h * m0 + h01 * v1 + h11 * h * m1;
  }

  /** The cubic Hermite basis at normalised u: value at 0, slope at 0, value at 1, slope at 1. */
  function basis(u: number): [number, number, number, number] {
    const u2: number = u * u;
    const u3: number = u2 * u;
    return [2 * u3 - 3 * u2 + 1, u3 - 2 * u2 + u, -2 * u3 + 3 * u2, u3 - u2];
  }

  /** The parameter distance from sample i forward to sample j, one period added when j does not follow i. */
  function forward(
    t: readonly number[],
    period: number | null,
    i: number,
    j: number,
  ): number {
    return period !== null && j <= i ? t[j]! + period - t[i]! : t[j]! - t[i]!;
  }

  /** The dense samples of a run or loop with its knot data per coordinate. */
  interface ISpans {
    /** Parameter per sample, increasing. */
    t: readonly number[];

    /** Period of a loop's parameter; null for an open run. */
    period: number | null;

    /** Sample values per coordinate. */
    values: readonly (readonly number[])[];

    /** Knot slopes per coordinate, per sample (read at alive knots only). */
    slopes: number[][];
  }

  /** The removal problem: spans plus the pins, the held slope components and the stop rule. */
  interface IRemoval extends ISpans {
    /** Slope components held at their value (zero), per coordinate per sample. */
    fixed: readonly (readonly boolean[])[];

    /** Samples never removed. */
    keep: readonly boolean[];

    /** Largest admitted deviation. */
    tolerance: number;

    /** Fewest knots left. */
    minimum: number;
  }

  /**
   * The samples strictly inside the span from i to j, with their span
   * parameter u in (0, 1) and the span length h.
   */
  function inside(
    spans: ISpans,
    i: number,
    j: number,
  ): { k: number[]; u: number[]; h: number } {
    const n: number = spans.t.length;
    const h: number = forward(spans.t, spans.period, i, j);
    const k: number[] = [];
    const u: number[] = [];
    for (let m: number = (i + 1) % n; m !== j; m = (m + 1) % n) {
      if (spans.period === null && m === 0) break;
      k.push(m);
      u.push(forward(spans.t, spans.period, i, m) / h);
    }
    return { k, u, h };
  }

  /** The largest distance of a span's inner samples from the span, with the given slopes at its ends. */
  function spanError(
    spans: ISpans,
    i: number,
    j: number,
    mi: readonly number[],
    mj: readonly number[],
  ): number {
    const { k, u, h } = inside(spans, i, j);
    let worst: number = 0;
    for (let m: number = 0; m < k.length; ++m) {
      const [h00, h10, h01, h11] = basis(u[m]!);
      let sq: number = 0;
      for (let d: number = 0; d < spans.values.length; ++d) {
        const v: readonly number[] = spans.values[d]!;
        const r: number =
          v[k[m]!]! -
          (h00 * v[i]! + h10 * h * mi[d]! + h01 * v[j]! + h11 * h * mj[d]!);
        sq += r * r;
      }
      worst = Math.max(worst, Math.sqrt(sq));
    }
    return worst;
  }

  /** The largest deviation over all spans between consecutive alive knots. */
  function worstSpan(spans: ISpans, alive: readonly number[]): number {
    const at: (i: number) => number[] = (i: number): number[] =>
      spans.slopes.map((s: number[]): number => s[i]!);
    let worst: number = 0;
    const last: number =
      spans.period === null ? alive.length - 1 : alive.length;
    for (let p: number = 0; p < last; ++p) {
      const i: number = alive[p]!;
      const j: number = alive[(p + 1) % alive.length]!;
      worst = Math.max(worst, spanError(spans, i, j, at(i), at(j)));
    }
    return worst;
  }

  /**
   * The cost of removing a knot between alive neighbours a and b, with a0
   * before a and b1 after b (null past an open run's ends): the slopes of a
   * and b are refitted by least squares to the inner samples of the spans
   * (a0, a), (a, b) and (b, b1), the slopes of a0 and b1 staying, a held
   * component staying at its value; the cost is the largest deviation over
   * those spans with the refitted slopes. Each coordinate is an independent
   * two-unknown linear least squares, since the basis is shared.
   */
  function refit(
    problem: IRemoval,
    a0: number | null,
    a: number,
    b: number,
    b1: number | null,
  ): { cost: number; ma: number[]; mb: number[] } {
    const dims: number = problem.values.length;
    const ma: number[] = [];
    const mb: number[] = [];
    const spans: [number, number, 0 | 1 | 2][] = [];
    if (a0 !== null) spans.push([a0, a, 0]);
    spans.push([a, b, 1]);
    if (b1 !== null) spans.push([b, b1, 2]);
    const insides: { k: number[]; u: number[]; h: number }[] = spans.map(
      ([i, j]): { k: number[]; u: number[]; h: number } =>
        inside(problem, i, j),
    );
    for (let d: number = 0; d < dims; ++d) {
      const v: readonly number[] = problem.values[d]!;
      const m: number[] = problem.slopes[d]!;
      // Normal equations of the residual y - alpha ma - beta mb, where y is
      // the sample less the span's known part (values and the outer slopes).
      let saa: number = 0;
      let sab: number = 0;
      let sbb: number = 0;
      let ya: number = 0;
      let yb: number = 0;
      for (let q: number = 0; q < spans.length; ++q) {
        const [i, j, role] = spans[q]!;
        const { k, u, h } = insides[q]!;
        for (let r: number = 0; r < k.length; ++r) {
          const [h00, h10, h01, h11] = basis(u[r]!);
          let known: number = h00 * v[i]! + h01 * v[j]!;
          let alpha: number = 0;
          let beta: number = 0;
          if (role === 0) {
            known += h10 * h * m[i]!;
            alpha = h11 * h;
          } else if (role === 1) {
            alpha = h10 * h;
            beta = h11 * h;
          } else {
            known += h11 * h * m[j]!;
            beta = h10 * h;
          }
          const y: number = v[k[r]!]! - known;
          saa += alpha * alpha;
          sab += alpha * beta;
          sbb += beta * beta;
          ya += alpha * y;
          yb += beta * y;
        }
      }
      const freeA: boolean = !problem.fixed[d]![a]! && saa > 0;
      const freeB: boolean = !problem.fixed[d]![b]! && sbb > 0;
      let xa: number = m[a]!;
      let xb: number = m[b]!;
      const det: number = saa * sbb - sab * sab;
      if (freeA && freeB && det > 1e-12 * saa * sbb) {
        xa = (ya * sbb - yb * sab) / det;
        xb = (yb * saa - ya * sab) / det;
      } else if (freeA) xa = (ya - sab * xb) / saa;
      else if (freeB) xb = (yb - sab * xa) / sbb;
      ma.push(xa);
      mb.push(xb);
    }
    const slope: (i: number) => number[] = (i: number): number[] =>
      i === a
        ? ma
        : i === b
          ? mb
          : problem.slopes.map((s: number[]): number => s[i]!);
    let cost: number = 0;
    for (const [i, j] of spans)
      cost = Math.max(cost, spanError(problem, i, j, slope(i), slope(j)));
    return { cost, ma, mb };
  }

  /**
   * Greedy knot removal: the alive knot whose refitted removal deviates
   * least goes, while that deviation stays within the tolerance; the
   * refitted slopes of its neighbours are written back. Returns the alive
   * sample indices in order.
   */
  function remove(problem: IRemoval): number[] {
    const cyclic: boolean = problem.period !== null;
    const alive: number[] = problem.t.map((_: number, i: number): number => i);
    const cache: Map<number, { cost: number; ma: number[]; mb: number[] }> =
      new Map();
    const evaluate: (p: number) => void = (p: number): void => {
      const m: number = alive.length;
      const i: number = alive[p]!;
      if (
        problem.keep[i] ||
        m <= problem.minimum ||
        (!cyclic && (p === 0 || p === m - 1))
      ) {
        cache.delete(i);
        return;
      }
      const pick: (q: number) => number | null = (q: number): number | null =>
        cyclic ? alive[(q + m) % m]! : q >= 0 && q < m ? alive[q]! : null;
      cache.set(
        i,
        refit(problem, pick(p - 2), pick(p - 1)!, pick(p + 1)!, pick(p + 2)),
      );
    };
    for (let p: number = 0; p < alive.length; ++p) evaluate(p);
    for (;;) {
      if (alive.length <= problem.minimum) break;
      let best: number = -1;
      let low: number = Infinity;
      for (let p: number = 0; p < alive.length; ++p) {
        const c: { cost: number } | undefined = cache.get(alive[p]!);
        if (c !== undefined && c.cost <= problem.tolerance && c.cost < low) {
          best = p;
          low = c.cost;
        }
      }
      if (best < 0) break;
      const m: number = alive.length;
      const a: number = alive[cyclic ? (best - 1 + m) % m : best - 1]!;
      const b: number = alive[cyclic ? (best + 1) % m : best + 1]!;
      const chosen: { ma: number[]; mb: number[] } = cache.get(alive[best]!)!;
      for (let d: number = 0; d < problem.slopes.length; ++d) {
        problem.slopes[d]![a] = chosen.ma[d]!;
        problem.slopes[d]![b] = chosen.mb[d]!;
      }
      cache.delete(alive[best]!);
      alive.splice(best, 1);
      // Candidates whose five-knot window holds a, b or the removed gap.
      const after: number = alive.length;
      for (let q: number = best - 3; q <= best + 2; ++q) {
        if (cyclic) evaluate(((q % after) + after) % after);
        else if (q >= 0 && q < after) evaluate(q);
      }
    }
    return alive;
  }

  /** The indices `0 .. count - 1` not excluded, in order. */
  function keptIndices(count: number, excluded: readonly number[]): number[] {
    const out: Set<number> = new Set(excluded);
    const kept: number[] = [];
    for (let i: number = 0; i < count; ++i) if (!out.has(i)) kept.push(i);
    return kept;
  }

  /**
   * Topographic prominence of the local extremum at `i`: on each side, how
   * far the run falls from it (rises, for a minimum) before it passes the
   * extremum's value or ends; the smaller side.
   */
  function prominence(v: readonly number[], i: number): number {
    const sign: number = v[i]! > v[i - 1]! ? 1 : -1;
    let out: number = Infinity;
    for (const step of [-1, 1]) {
      let drop: number = 0;
      for (let j: number = i + step; j >= 0 && j < v.length; j += step) {
        if (sign * (v[j]! - v[i]!) > 0) break;
        drop = Math.max(drop, sign * (v[i]! - v[j]!));
      }
      out = Math.min(out, drop);
    }
    return out;
  }

  /** A run of samples bending one way, by unwrapped indices. */
  interface IRun {
    first: number;
    last: number;
    sign: number;
    strength: number;
  }

  /**
   * The prominent inflections of a sequence of bends. Nonzero bends are
   * grouped into runs of one sign; while the weakest run's sagitta stays
   * within the noise threshold it is merged with its neighbours into their
   * sign (topographic prominence applied to curvature), so facet-level
   * wiggles dissolve into the bend they ride on. Each boundary between two
   * surviving runs is an inflection: the middle of the zero bends between
   * them, else the side whose bend is nearer zero.
   *
   * @param bend Signed bend per sample; zero bends belong to no run.
   * @param cyclic Whether the samples close into a loop; runs then wrap and use unwrapped indices.
   * @param sagitta Signed sagitta of the run `first .. last` of bend sign `sign` against the chord between its outer neighbours.
   * @param noise Largest sagitta still treated as noise.
   */
  function inflections(
    bend: readonly number[],
    cyclic: boolean,
    sagitta: (first: number, last: number, sign: number) => number,
    noise: number,
  ): number[] {
    const n: number = bend.length;
    const order: number[] = [];
    for (let i: number = 0; i < n; ++i) if (bend[i] !== 0) order.push(i);
    if (order.length === 0) return [];
    // A loop's runs start at a sign change, so its first and last runs differ.
    const start: number = cyclic
      ? order.findIndex(
          (i: number, k: number): boolean =>
            Math.sign(bend[i]!) !==
            Math.sign(bend[order[(k - 1 + order.length) % order.length]!]!),
        )
      : 0;
    if (start < 0) return [];
    const runs: IRun[] = [];
    for (let k: number = 0; k < order.length; ++k) {
      const i: number =
        order[(start + k) % order.length]! +
        (start + k >= order.length ? n : 0);
      const sign: number = Math.sign(bend[i % n]!);
      const tail: IRun | undefined = runs.at(-1);
      if (tail !== undefined && tail.sign === sign) tail.last = i;
      else runs.push({ first: i, last: i, sign, strength: 0 });
    }
    for (const r of runs) r.strength = sagitta(r.first, r.last, r.sign);
    for (;;) {
      const m: number = runs.length;
      if (m <= 1) break;
      let w: number = -1;
      for (let k: number = 0; k < m; ++k)
        if (
          runs[k]!.strength <= noise &&
          (w < 0 || runs[k]!.strength < runs[w]!.strength)
        )
          w = k;
      if (w < 0) break;
      if (cyclic && m === 2) return [];
      let merged: IRun;
      if (w > 0 && w < m - 1) {
        merged = {
          first: runs[w - 1]!.first,
          last: runs[w + 1]!.last,
          sign: runs[w - 1]!.sign,
          strength: 0,
        };
        runs.splice(w - 1, 3, merged);
      } else if (!cyclic && w === 0) {
        merged = {
          first: runs[0]!.first,
          last: runs[1]!.last,
          sign: runs[1]!.sign,
          strength: 0,
        };
        runs.splice(0, 2, merged);
      } else if (!cyclic) {
        merged = {
          first: runs[m - 2]!.first,
          last: runs[m - 1]!.last,
          sign: runs[m - 2]!.sign,
          strength: 0,
        };
        runs.splice(m - 2, 2, merged);
      } else if (w === 0) {
        merged = {
          first: runs[m - 1]!.first - n,
          last: runs[1]!.last,
          sign: runs[1]!.sign,
          strength: 0,
        };
        runs.splice(0, 2, merged);
        runs.pop();
      } else {
        merged = {
          first: runs[m - 2]!.first,
          last: runs[0]!.last + n,
          sign: runs[m - 2]!.sign,
          strength: 0,
        };
        runs.splice(m - 2, 2, merged);
        runs.shift();
      }
      merged.strength = sagitta(merged.first, merged.last, merged.sign);
    }
    const out: number[] = [];
    const m: number = runs.length;
    if (m <= 1) return out;
    const wrap: (i: number) => number = (i: number): number =>
      ((i % n) + n) % n;
    for (let k: number = 0; k < (cyclic ? m : m - 1); ++k) {
      const p: number = runs[k]!.last;
      const q: number = k + 1 < m ? runs[k + 1]!.first : runs[0]!.first + n;
      out.push(
        wrap(
          q - p > 1
            ? Math.floor((p + q) / 2)
            : Math.abs(bend[wrap(p)]!) <= Math.abs(bend[wrap(q)]!)
              ? p
              : q,
        ),
      );
    }
    return out;
  }

  function at(mesh: IMesh, v: number): V3 {
    return [
      mesh.positions[3 * v]!,
      mesh.positions[3 * v + 1]!,
      mesh.positions[3 * v + 2]!,
    ];
  }

  function add(a: V3, b: V3): V3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function sub(a: V3, b: V3): V3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function scale(a: V3, k: number): V3 {
    return [a[0] * k, a[1] * k, a[2] * k];
  }

  function cross(a: V3, b: V3): V3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
