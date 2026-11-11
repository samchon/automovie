import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

type Vec3 = AutoMovieSolidVector.Vec3;
type ILoop = AutoMovieSolidMesh.ILoop;
type IMesh = AutoMovieSolidMesh.IMesh;
const { dot, norm, sub } = AutoMovieSolidVector;

/**
 * The trim-loop readings of a face's tessellation (`AutoMovieSolidMesh.face`): which grid vertices a loop keeps with a local metric margin, how chart-distance scores rank drawn-cell cycles, and the polyline-chord parameter and heuristic alignment the zipper (`AutoMovieSolidZip`) uses for stitching.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each reading's measure and use.
 * @evidence contracts/development/design.md#principled-representation Represents The trim-loop readings of a face's tessellation (`AutoMovieSolidMesh.face`): which grid vertices a loop keeps with a local metric margin, how chart-distance scores rank drawn-cell cycles, and the polyline-chord parameter and heuristic alignment the zipper (`AutoMovieSolidZip`) uses for stitching: companion namespace of 13 members (`keeps`, `prepare`, `Classifier`, `Chart`, `IState`, `snapshot`, ...); units and frames named in its text: local, world, radians. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidMeshLoop` in packages/engine/src/geometry/construction/AutoMovieSolidMeshLoop.ts; its surface is the 13 members listed and the text shows 5 other files naming it, mostly packages/engine (3), test (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieSolidMeshLoop {
  /**
   * Whether a grid vertex lies on a loop's kept side, at least `margin` mm
   * from it.
   *
   * @param loop The loop.
   * @param u The vertex's station.
   * @param v The vertex's phase.
   * @param jet The surface's jet there, for the metric.
   * @param margin The least distance from the loop, mm.
   * @param period The face's phase period, or undefined.
   * @returns True when the vertex is kept at the margin.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Combines existing kept-side parity with the first-fundamental-form distance to every segment.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The live public reading shares its scalar metric minimum with prepared face queries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the same local metric, phase shifts, sqrt/clamp and inclusive margin comparison; no geodesic or world-distance substitute is used.
   * @evidence contracts/development/common.md#meaningful-documentation Names chart inputs, jet-derived metric and world-mm margin; parity boundary ties remain the existing predicate's.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) time for S edges, with metric coefficients computed once per call; prepare amortizes invariant work across a face.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work This live API caches nothing and sees current mutable input; prepared face snapshots have a separate lifetime.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a boolean and retains no input or scratch after returning.
   */
  export function keeps(
    loop: ILoop,
    u: number,
    v: number,
    jet: IAutoMovieSolidSurface.IJet,
    margin: number,
    period: number | undefined,
  ): boolean {
    if (!AutoMovieSolidCycle.kept(loop, u, v, period)) return false;

    return minimum(loop, u, v, jet, margin, period);
  }

  /**
   * Compile the same classification for one synchronous face's unchanged inputs.
   * Data-valued charts are copied lazily when their loop is first reached.
   * Accessors, inherited entries and unsuitable data use the original live walk.
   * Eligibility inspection invokes no ordinary object's getters; proxies with
   * non-transparent reads or effectful descriptor traps are outside this premise.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same parity, metric projection and margin comparisons as keeps; copied chart values change no geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One face-local closure owns lazy loop preparation and each loop's chart box; no global cache is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves loop order, eager fallback, both distinct periodic rules, sqrt and equality; the metric scan of a loop is skipped only where a lower bound of the same metric to the loop's chart box strictly exceeds the margin, so the answer is the full scan's and no tolerance or curve is changed.
   * @evidence contracts/development/common.md#meaningful-documentation States numerical snapshot ownership, accessor fallback, the supported descriptor premise and the bound that skips a far loop.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation is O(S+L) for S total edges and L loops; a query reads the kept side of each loop and scans only the loops whose box lies within the margin, so a face of many small holes costs each grid point its few near ones.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each new face owns new preparation after edits or rollback; eligible input and jet values stay unchanged while read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Captures O(S+L) scratch for L loops until the returned reader is dropped; the face retains it only through its synchronous call.
   */
  export function prepare(
    loops: readonly ILoop[],
    period: number | undefined,
  ): Classifier {
    const raw: Classifier = (
      u: number,
      v: number,
      jet: IAutoMovieSolidSurface.IJet,
      margin: number,
    ): boolean =>
      loops.every((l: ILoop): boolean => keeps(l, u, v, jet, margin, period));
    const states: (IState | undefined)[] = new Array<IState | undefined>(
      loops.length,
    );
    try {
      for (let k: number = 0; k < loops.length; k++) {
        const entry: PropertyDescriptor | undefined =
          Object.getOwnPropertyDescriptor(loops, String(k));
        if (entry === undefined) {
          if (k in loops) return raw;
          continue;
        }
        if (!("value" in entry)) return raw;
        states[k] = { input: entry.value as ILoop, checked: false };
      }
    } catch {
      return raw;
    }
    let eager: boolean =
      period !== undefined && (!Number.isFinite(period) || period <= 0);
    return (
      u: number,
      v: number,
      jet: IAutoMovieSolidSurface.IJet,
      margin: number,
    ): boolean => {
      if (eager) return raw(u, v, jet, margin);
      let metric: IAutoMovieSolidSurface.IJet | undefined;
      let E: number = 0;
      let F: number = 0;
      let G: number = 0;
      for (const state of states) {
        if (state === undefined) continue;
        if (!state.checked) {
          state.chart = snapshot(state.input);
          state.checked = true;
          if (state.chart !== null)
            state.side = AutoMovieSolidCycle.prepare(state.chart, period);
        }
        if (state.chart === null) {
          eager = true;
          return raw(u, v, jet, margin);
        }
        if (!state.side!(u, v)) return false;
        if (metric === undefined) {
          if (
            typeof u !== "number" ||
            typeof v !== "number" ||
            typeof margin !== "number" ||
            !plainJet(jet)
          ) {
            eager = true;
            return raw(u, v, jet, margin);
          }
          metric = jet;
          E = dot(jet.u, jet.u);
          F = dot(jet.u, jet.v);
          G = dot(jet.v, jet.v);
        }
        if (state.deltas === undefined) {
          const chart: [number, number][] = state.chart!.chart;
          state.deltas = new Float64Array(2 * chart.length);
          let low: number = Infinity;
          let high: number = -Infinity;
          let phase: number = chart[0]?.[1] ?? 0;
          let first: number = phase;
          let last: number = phase;
          for (let k: number = 0; k < chart.length; k++) {
            const a: [number, number] = chart[k]!;
            const b: [number, number] = chart[(k + 1) % chart.length]!;
            state.deltas[2 * k] = b[0] - a[0];
            state.deltas[2 * k + 1] =
              AutoMovieSolidCycle.shift(b[1], a[1], period) - a[1];
            low = Math.min(low, a[0]);
            high = Math.max(high, a[0]);
            first = Math.min(first, phase);
            last = Math.max(last, phase);
            phase += state.deltas[2 * k + 1]!;
          }
          // The loop's phases unwrapped along its own walk: a box in phase
          // exists only when they stay inside half a period, so every
          // point's nearest lift is the one the segments read.
          const narrow: boolean =
            Number.isFinite(first) &&
            Number.isFinite(last) &&
            (period === undefined || last - first < period / 2);
          state.box = [
            low,
            high,
            narrow ? (first + last) / 2 : NaN,
            narrow ? (last - first) / 2 : NaN,
          ];
        }

        // A point farther from the loop's chart box than the margin, by a
        // lower bound of the metric, is farther from every segment: with
        // `c = F / sqrt(E G)`, `E du^2 + 2 F du dv + G dv^2 >=
        // (1 - |c|) (E du^2 + G dv^2)`, and any offset to the loop has
        // `|du|`, `|dv|` at least the gaps to the box. The scan is skipped
        // only on a strict excess, so a tie still reads every segment.
        const box: [number, number, number, number] = state.box!;
        const gapU: number = Math.max(0, box[0] - u, u - box[1]);
        const gapV: number = Number.isNaN(box[2])
          ? 0
          : Math.max(
              0,
              Math.abs(AutoMovieSolidCycle.shift(v, box[2], period) - box[2]) -
                box[3],
            );
        const shear: number = E > 0 && G > 0 ? Math.abs(F) / Math.sqrt(E * G) : 1;
        if (
          (1 - shear) * (E * gapU * gapU + G * gapV * gapV) >
          margin * margin * (1 + 1e-9)
        )
          continue;
        if (
          !(
            distance(state.chart!, u, v, E, F, G, period, state.deltas) >=
            margin
          )
        )
          return false;
      }
      return true;
    };
  }

  /** A point classifier in chart coordinates, with a world-mm margin. */
  type Classifier = (
    u: number,
    v: number,
    jet: IAutoMovieSolidSurface.IJet,
    margin: number,
  ) => boolean;
  /** The numerical fields the parity and metric readings consume. */
  type Chart = Pick<ILoop, "kind" | "chart">;
  /** Scratch owned by one prepared face, never published into a body. */
  interface IState {
    /** Original input for live fallback. */ input: ILoop;
    /** Whether snapshot eligibility was inspected. */ checked: boolean;
    /** Copied numerical chart, or null for live fallback. */ chart?: Chart | null;
    /** Existing kept-side predicate over that copy. */ side?: (
      u: number,
      v: number,
    ) => boolean;
    /** Metric segment differences, dx/dy per edge. */ deltas?: Float64Array;
    /** The copied chart's box: lowest and highest station, then the middle and half width of its unwrapped phases, NaN when they span half a period or more. */ box?: [
      number,
      number,
      number,
      number,
    ];
  }

  /** Copy only own data-valued numerical fields, without invoking ordinary getters. */
  function snapshot(loop: ILoop): Chart | null {
    try {
      const kind: unknown = Object.getOwnPropertyDescriptor(
        loop,
        "kind",
      )?.value;
      const source: unknown = Object.getOwnPropertyDescriptor(
        loop,
        "chart",
      )?.value;
      if (
        !(
          kind === "hole" ||
          kind === "island" ||
          kind === "start" ||
          kind === "end"
        ) ||
        !Array.isArray(source)
      )
        return null;
      const chart: [number, number][] = [];
      for (let k: number = 0; k < source.length; k++) {
        const point: unknown = Object.getOwnPropertyDescriptor(
          source,
          String(k),
        )?.value;
        if (!Array.isArray(point)) return null;
        const x: unknown = Object.getOwnPropertyDescriptor(point, "0")?.value;
        const y: unknown = Object.getOwnPropertyDescriptor(point, "1")?.value;
        if (
          typeof x !== "number" ||
          typeof y !== "number" ||
          !Number.isFinite(x) ||
          !Number.isFinite(y)
        )
          return null;
        chart.push([x, y]);
      }
      return { kind, chart };
    } catch {
      return null;
    }
  }

  /** Metric sharing applies only to stable ordinary numerical vector fields. */
  function plainJet(jet: IAutoMovieSolidSurface.IJet): boolean {
    try {
      for (const name of ["u", "v"]) {
        const axis: unknown = Object.getOwnPropertyDescriptor(jet, name)?.value;
        if (!Array.isArray(axis)) return false;
        for (let k: number = 0; k < 3; k++) {
          const value: unknown = Object.getOwnPropertyDescriptor(
            axis,
            String(k),
          )?.value;
          if (typeof value !== "number" || !Number.isFinite(value))
            return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Live metric reading after kept-side acceptance, preserving its original operation order. */
  function minimum(
    loop: Pick<ILoop, "chart">,
    u: number,
    v: number,
    jet: IAutoMovieSolidSurface.IJet,
    margin: number,
    period: number | undefined,
  ): boolean {
    const E: number = dot(jet.u, jet.u);
    const F: number = dot(jet.u, jet.v);
    const G: number = dot(jet.v, jet.v);
    return distance(loop, u, v, E, F, G, period) >= margin;
  }

  /** Full segment minimum; optional differences are the same subtractions prepared once. */
  function distance(
    loop: Pick<ILoop, "chart">,
    u: number,
    v: number,
    E: number,
    F: number,
    G: number,
    period: number | undefined,
    deltas?: Float64Array,
  ): number {
    const n: number = loop.chart.length;
    let least: number = Infinity;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = loop.chart[k]!;
      const raw: [number, number] = loop.chart[(k + 1) % n]!;
      const bv: number | undefined =
        deltas === undefined
          ? AutoMovieSolidCycle.shift(raw[1], a[1], period)
          : undefined;
      const w: number = AutoMovieSolidCycle.shift(v, a[1], period);
      least = Math.min(
        least,
        segment(
          u - a[0],
          w - a[1],
          deltas === undefined ? raw[0] - a[0] : deltas[2 * k]!,
          deltas === undefined ? bv! - a[1] : deltas[2 * k + 1]!,
          E,
          F,
          G,
        ),
      );
    }
    return least;
  }

  /** The metric distance from a chart offset to a chart segment, mm. */
  function segment(
    px: number,
    py: number,
    dx: number,
    dy: number,
    E: number,
    F: number,
    G: number,
  ): number {
    const dd: number = E * dx * dx + 2 * F * dx * dy + G * dy * dy;
    const pd: number = E * px * dx + F * (px * dy + py * dx) + G * py * dy;
    const t: number = dd > 0 ? Math.min(1, Math.max(0, pd / dd)) : 0;
    const x: number = px - t * dx;
    const y: number = py - t * dy;
    return Math.sqrt(Math.max(0, E * x * x + 2 * F * x * y + G * y * y));
  }

  /**
   * The mean chart distance from a cycle's points to a loop, for matching a drawn-cell cycle to its loop.
   *
   * @param loop The loop.
   * @param points The cycle's chart points.
   * @param period The face's phase period, or undefined.
   * @returns The mean distance.
   *   Coordinates use their raw chart units, so this ranking is not a
   *   world-distance or topology certificate. No points gives NaN; no loop
   *   segments gives infinite distance for each nonempty point query.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Averages each drawn-cycle point's nearest polygon-segment chart distance to rank candidate boundaries in Mesh.face, using Cycle.foot's periodic branch conventions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One mean score separates candidate ranking from the later world-space starting/direction alignment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Equal point weighting and mixed chart-coordinate units remain the implemented heuristic; the score does not prove corresponding topology or globally optimal cycle assignment.
   * @evidence contracts/development/common.md#meaningful-documentation States chart-distance meaning, matching role and the empty-input NaN/infinite limits.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P*S) work for P cycle points and S loop segments: every foot compares all segments without an index to find its chart minimum, and Mesh.face repeats the score across candidate cycles.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This independent score retains no spatial index or prior foot; no effectful requests are coordinated.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar; per-query foot records are temporary, with no loop, point list or score cache retained after the call.
   */
  export function nearest(
    loop: ILoop,
    points: readonly [number, number][],
    period: number | undefined,
  ): number {
    let sum: number = 0;
    for (const p of points)
      sum += AutoMovieSolidCycle.foot(loop, p[0], p[1], period).distance;
    return sum / points.length;
  }

  /**
   * The zipper's parameter of a closed vertex sequence: its cumulative length
   * between its points from its first, over its whole length, times a turn.
   * Arclength holds for any simple cycle a clip leaves, where an angle about
   * a centre turns back on a cycle that is not star-shaped.
   *
   * @param mesh The mesh holding the vertices.
   * @param ids The sequence's vertices.
   * @returns Each vertex's parameter, radians from 0.
   *   The sequence must be nonempty with valid mesh indices. This is closed
   *   polyline chord length, not smooth-surface arclength. A total that does
   *   not compare above zero takes the all-zero branch; positive infinity
   *   still enters normalization and is not validated here.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Accumulates world-position chord lengths, includes the closing edge and normalizes the cumulative distances to one turn for Zip's monotone parameter walk.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cumulative array and a closing total describe the existing vertex sequence without fitting or sampling a new curve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not claim exact smooth-curve arclength or validate indices/simplicity; a total that is not above zero produces zero parameters rather than a repaired polygon.
   * @evidence contracts/development/common.md#meaningful-documentation Gives world-chord meaning, radians, nonempty/index premises and degenerate-total behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) position/chord work and O(N) output for N vertices, including the final closing edge.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call rebuilds cumulative lengths; aligned's quarter queries and the later Zip inputs currently repeat those arc reads rather than share a prepared result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh N-entry parameter array; intermediate positions and the cumulative array are call-local, with no mesh or vertex list retained globally.
   */
  export function arc(mesh: IMesh, ids: readonly number[]): number[] {
    const p = (v: number): Vec3 => [
      mesh.positions[3 * v]!,
      mesh.positions[3 * v + 1]!,
      mesh.positions[3 * v + 2]!,
    ];
    const out: number[] = [0];
    for (let k: number = 1; k < ids.length; k++)
      out.push(out[k - 1]! + norm(sub(p(ids[k]!), p(ids[k - 1]!))));
    const total: number =
      out[ids.length - 1]! + norm(sub(p(ids[0]!), p(ids[ids.length - 1]!)));
    return out.map((x: number): number =>
      total > 0 ? (2 * Math.PI * x) / total : 0,
    );
  }

  /**
   * A drawn-cell cycle turned and started to run with a loop: started at its
   * vertex nearest the loop's first, and turned the way whose point a quarter
   * of its length on lies nearer the loop's point a quarter on.
   *
   * @param mesh The mesh holding the vertices.
   * @param loop The loop's vertices.
   * @param cycle The cycle's vertices.
   * @returns The cycle, started and turned to run with the loop.
   *   Both sequences must be nonempty with valid mesh indices. The quarter
   *   observation is the first existing vertex at or beyond a quarter turn,
   *   falling back to the first vertex if none reaches it; it is not an
   *   interpolated quarter point or proof of boundary correspondence.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Starts at the world vertex nearest the loop's first point, then compares forward/backward quarter-vertex distances to choose one traversal for the zipper.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two reordered candidate arrays expose the heuristic's two choices without moving any vertex or changing its owner coordinates.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Ties keep the earlier start and choose forward; nearest-start and discrete-quarter tests do not certify matching topology, smooth arclength or a globally best alignment.
   * @evidence contracts/development/common.md#meaningful-documentation States valid nonempty inputs, world-space comparison and the discrete quarter/fallback convention.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(L+C) scans for loop length L and cycle length C, with two C-entry candidate arrays and three cumulative arc readings; no pairwise alignment search is used.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The loop's quarter is shared between direction comparisons, but candidate arcs and the current best start distance are recomputed, and Mesh.face later rebuilds the chosen arcs for Zip.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh reordered cycle; the unchosen array, arc arrays and point vectors are call-local, with no retained mesh, reader or cross-face cache.
   */
  export function aligned(
    mesh: IMesh,
    loop: readonly number[],
    cycle: readonly number[],
  ): number[] {
    const p = (v: number): Vec3 => [
      mesh.positions[3 * v]!,
      mesh.positions[3 * v + 1]!,
      mesh.positions[3 * v + 2]!,
    ];
    const head: Vec3 = p(loop[0]!);
    let start: number = 0;
    cycle.forEach((v: number, k: number): void => {
      if (norm(sub(p(v), head)) < norm(sub(p(cycle[start]!), head))) start = k;
    });
    const forward: number[] = cycle.map(
      (_: number, k: number): number => cycle[(start + k) % cycle.length]!,
    );
    const backward: number[] = [forward[0]!, ...forward.slice(1).reverse()];
    const quarter = (ids: readonly number[]): Vec3 => {
      const a: number[] = arc(mesh, ids);
      const k: number = a.findIndex((x: number): boolean => x >= Math.PI / 2);
      return p(ids[k < 0 ? 0 : k]!);
    };
    const target: Vec3 = quarter(loop);
    return norm(sub(quarter(forward), target)) <=
      norm(sub(quarter(backward), target))
      ? forward
      : backward;
  }
}
