import type {
  IAutoMovieSolidBlendChain,
  IAutoMovieSolidBody,
  IAutoMovieSolidClip,
  IAutoMovieSolidCycle,
  IAutoMovieSolidJoin,
  IAutoMovieSolidRail,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import { AutoMovieSolidDomain } from "./AutoMovieSolidDomain";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";

/**
 * A host rail laid onto the faces of a body: its points with the crossings
 * between faces, and each face it runs over trimmed by it.
 *
 * The rail is read at the blend's columns; where two neighbouring columns
 * lie on different faces, the crossing between them is placed by bisection
 * of the curve's parameter on the face the rail lies on, and is one vertex
 * of both faces. A rail on one face adds its loop to that face. A rail over
 * several faces is cut into runs, each from the crossing it enters a face by
 * to the crossing it leaves by; both crossings lie on one cycle of that face
 * (the boundary it shares with the faces the rail came from and goes to).
 * The cycle is split at them, and of its two arcs the one on the side the
 * rail removes (toward the curve, against the rail's offset direction) is
 * replaced by the run: of the two cycles the arcs make with the run, the one
 * that keeps a point just past the rail and removes a point just before it
 * (the clipping of one boundary by another of Weiler and Atherton, Hidden
 * surface removal using polygon area sorting, SIGGRAPH 1977). Where both
 * do, as when the run stands outside a hole it starts and ends on, the one
 * that still removes everything the cycle removed is kept: a cut only takes
 * more of a face away. The rebuilt cycle's arc keeps the exact boundary each of
 * its segments lay on, and the run's segments are chords (`ICycle.segments`).
 */
export namespace AutoMovieSolidClip {
  /** Maximum crossing halvings; a null rail may end the search earlier once the bracket is at most a millionth of a column. */
  export const BISECTIONS: number = 40;

  /**
   * World slack of a crossing placed across a stretch where the rail settles on neither face, mm: a hundredth of a millimetre, a hundredth of
   * the chord tolerance a skin is drawn at. The crossing is placed when the rail's last point on one face and its first on the next stand
   * within it of each other, or each within it of the shared boundary's chord beyond the boundary's own sagitta (`seam`).
   */
  export const CROSSING: number = 1e-2;

  /**
   * Largest chart distance from a crossing to the trim it is placed into, as a share of one plus its coordinates' magnitudes, for the
   * crossing to be moved onto the trim: rounding, a few thousand units in the last place, never a crossing that truly stands off it.
   */
  export const SNAP: number = 1e-12;

  /** Local side-probe distance is a quarter of neighbouring world spacing in the unit-world-speed chart direction; this relative sampling choice is not a global curved-cell bound. */
  export const SIDE: number = 0.25;

  /**
   * The host rail's points with the crossings between faces, each a vertex
   * of the body's mesh.
   *
   * @param body The body.
   * @param join The join.
   * @param blend Its published blend.
   * @param index The body face of each atlas face the join was traced on.
   * @param count The blend's columns.
   * @returns The points in rail order, or where a crossing's rail fails.
   */
  export function rail(
    body: IAutoMovieSolidBody.IBody,
    join: IAutoMovieSolidJoin.IJoin,
    blend: IAutoMovieSolidBlendChain.IBlend,
    index: number[],
    count: number,
  ): IAutoMovieSolidClip.IRailPoint[] | string {
    const faces: number[] = (
      blend.host.faces ?? blend.host.chart.map((): number => 0)
    ).map((f: number): number => index[f]!);
    const point = (
      face: number,
      chart: [number, number],
      phase: number,
      across?: [number, number],
    ): IAutoMovieSolidClip.IRailPoint => {
      const surface: IAutoMovieSolidSurface = body.faces[face]!.surface;
      const owner: number = AutoMovieSolidMesh.owner(body.mesh, surface);
      const vertex: number = AutoMovieSolidMesh.vertex(
        body.mesh,
        surface.jet(chart[0], chart[1]).p,
        owner,
        chart[0],
        chart[1],
      );
      return {
        vertex,
        phase,
        faces: [face],
        chart: new Map([[face, chart]]),
        ...(across !== undefined ? { across } : {}),
      };
    };
    const out: IAutoMovieSolidClip.IRailPoint[] = [];
    for (let k: number = 0; k < count; k++) {
      out.push(
        point(
          faces[k]!,
          blend.host.chart[k]!,
          (2 * Math.PI * k) / count,
          blend.across[k]!,
        ),
      );
      const next: number = faces[(k + 1) % count]!;
      if (next === faces[k]) continue;

      // The crossing: the last parameter on this face and the first on the next.
      let lo: number = blend.seed + (2 * Math.PI * k) / count;
      let hi: number = blend.seed + (2 * Math.PI * (k + 1)) / count;
      let low: IAutoMovieSolidRail.IRail | null = blend.rails?.[k] ?? join.rail(lo);
      // A full turn can land on a different atlas chart branch than its seed.
      let high: IAutoMovieSolidRail.IRail | null =
        (k + 1 < count ? blend.rails?.[k + 1] : undefined) ?? join.rail(hi);
      for (
        let i: number = 0;
        i < BISECTIONS && low !== null && high !== null;
        i++
      ) {
        const m: number = (lo + hi) / 2;
        const r: IAutoMovieSolidRail.IRail | null = join.rail(m);
        // At the crossing itself the rail may stand on the boundary of both
        // faces and settle on neither; once the bracket is a millionth of a
        // column the two ends already place the crossing.
        if (r === null) {
          if (hi - lo <= (1e-6 * 2 * Math.PI) / count) break;

          // The rail settles on neither face over a stretch of the parameter
          // round the crossing. Each end of that stretch is found from its own
          // side; the crossing is placed when the rail's two ends there are one
          // world point within `CROSSING` mm, or when both lie on the faces'
          // shared boundary as closely as the boundary's two readings do (the
          // sliver between them is the stretch, long where the rail runs along
          // the boundary at a grazing angle).
          let dead: [number, number] = [m, m];
          for (let j: number = 0; j < BISECTIONS; j++) {
            const a: number = (lo + dead[0]) / 2;
            const ra: IAutoMovieSolidRail.IRail | null = join.rail(a);
            if (ra === null) dead = [a, dead[1]];
            else if (index[ra.hostFace] === faces[k]) {
              lo = a;
              low = ra;
            } else break;
          }
          for (let j: number = 0; j < BISECTIONS; j++) {
            const b: number = (dead[1] + hi) / 2;
            const rb: IAutoMovieSolidRail.IRail | null = join.rail(b);
            if (rb === null) dead = [dead[0], b];
            else if (index[rb.hostFace] === next) {
              hi = b;
              high = rb;
            } else break;
          }
          const gap: number = Math.hypot(
            high!.hostPoint[0] - low!.hostPoint[0],
            high!.hostPoint[1] - low!.hostPoint[1],
            high!.hostPoint[2] - low!.hostPoint[2],
          );
          const off: [number, number] = seam(
            body,
            faces[k]!,
            next,
            low!,
            high!,
          );
          if (
            index[low!.hostFace] === faces[k] &&
            index[high!.hostFace] === next &&
            (gap <= CROSSING || off[0] <= off[1] + CROSSING)
          )
            break;
          return `no rail at t ${m}, between the columns at t ${lo} and ${hi} where the rail leaves face ${faces[k]} for face ${next} (its two ends stand ${gap} mm apart and ${off[0]} mm off the seam, which stands ${off[1]} mm off its chord)`;
        }
        if (index[r.hostFace] === faces[k]) {
          lo = m;
          low = r;
        } else {
          hi = m;
          high = r;
        }
      }
      if (low === null || high === null)
        return `no rail at the column ${low === null ? `t ${lo}` : `t ${hi}`} beside the crossing from face ${faces[k]} to face ${next}`;
      if (index[low.hostFace] !== faces[k] || index[high.hostFace] !== next)
        return `the rail's crossing from face ${faces[k]} to face ${next} lands on faces ${index[low.hostFace]} and ${index[high.hostFace]} (t ${lo} to ${hi})`;
      const crossing: IAutoMovieSolidClip.IRailPoint = point(
        faces[k]!,
        [low.host[0], low.host[1]],
        (lo + hi) / 2 - blend.seed,
      );
      crossing.faces.push(index[high.hostFace]!);
      crossing.chart.set(index[high.hostFace]!, [high.host[0], high.host[1]]);
      out.push(crossing);
    }
    return out;
  }

  /**
   * Trim every face a host rail runs over.
   *
   * @param body The body; its cycles change in place.
   * @param rail The rail's points.
   * @param blend The blend face's index.
   * @param kind The rail's kind on a single face (`IAutoMovieSolidBlendChain.IBlend.host.kind`).
   * @returns Null, or why a face could not be trimmed.
   */
  export function trim(
    body: IAutoMovieSolidBody.IBody,
    rail: IAutoMovieSolidClip.IRailPoint[],
    blend: number,
    kind: IAutoMovieSolidCycle.ICycle["kind"],
  ): string | null {
    const n: number = rail.length;
    const along = (
      a: IAutoMovieSolidClip.IRailPoint,
      b: IAutoMovieSolidClip.IRailPoint,
    ): IAutoMovieSolidCycle.INeighbour => ({
      face: blend,
      from: [0, a.phase],
      to: [
        0,
        b.phase + 2 * Math.PI * Math.round((a.phase - b.phase) / (2 * Math.PI)),
      ],
    });

    // One face: the rail is its own loop.
    const first: number = rail[0]!.faces[0]!;
    if (
      rail.every(
        (r: IAutoMovieSolidClip.IRailPoint): boolean =>
          r.faces.length === 1 && r.faces[0] === first,
      )
    ) {
      body.faces[first]!.cycles.push({
        kind,
        vertices: rail.map(
          (r: IAutoMovieSolidClip.IRailPoint): number => r.vertex,
        ),
        chart: rail.map(
          (r: IAutoMovieSolidClip.IRailPoint): [number, number] =>
            r.chart.get(first)!,
        ),
        neighbours: rail.map(
          (
            r: IAutoMovieSolidClip.IRailPoint,
            k: number,
          ): IAutoMovieSolidCycle.INeighbour => along(r, rail[(k + 1) % n]!),
        ),
      });
      return null;
    }

    // Runs from crossing to crossing, each on one face. A run that joins two
    // of a face's trims (a cut across a band, from its one rim to its other)
    // cuts nothing off by itself; it waits for the face's next such run, and
    // the two are clipped together (`clipPair`).
    const pending: Map<number, IAutoMovieSolidClip.IRailPoint[]> = new Map();
    const start: number = rail.findIndex(
      (r: IAutoMovieSolidClip.IRailPoint): boolean => r.faces.length === 2,
    );
    for (let k: number = 0; k < n; ) {
      const a: number = (start + k) % n;
      const entry: IAutoMovieSolidClip.IRailPoint = rail[a]!;
      const run: IAutoMovieSolidClip.IRailPoint[] = [entry];
      let j: number = k + 1;
      for (; j <= n; j++) {
        const p: IAutoMovieSolidClip.IRailPoint = rail[(start + j) % n]!;
        run.push(p);
        if (p.faces.length === 2) break;
      }
      const exit: IAutoMovieSolidClip.IRailPoint = run[run.length - 1]!;
      const face: number | undefined = entry.faces.find(
        (f: number): boolean =>
          exit.faces.includes(f) &&
          run
            .slice(1, -1)
            .every(
              (p: IAutoMovieSolidClip.IRailPoint): boolean => p.faces[0] === f,
            ),
      );
      if (face === undefined)
        return `the rail's run from phase ${entry.phase} to ${exit.phase} lies on no one face`;
      const failed: string | null = clip(body, face, run, along);
      if (failed === ACROSS) {
        const first: IAutoMovieSolidClip.IRailPoint[] | undefined =
          pending.get(face);
        if (first === undefined) pending.set(face, run);
        else {
          pending.delete(face);
          const paired: string | null = clipPair(body, face, first, run, along);
          if (paired !== null) return paired;
        }
      } else if (failed !== null) return failed;
      k = j;
    }
    for (const face of pending.keys())
      return `the rail enters face ${body.faces[face]!.surface.name} through one trim and leaves through another, and crosses it only once`;
    return null;
  }

  /**
   * How far a rail's two ends round a crossing stand off the boundary two faces share, and how far that boundary itself stands off its
   * chord, mm: `[ends, seam]`. The boundary is the segment the two faces share nearest the first end, in the first face's chart. Its chord
   * is the straight line between its two vertices; each face reads the segment in its own chart, the first as a chart chord and the second
   * by its own map, and both readings stand off the chord by the segment's sagitta: on a blend round a tube 3 mm across, with columns
   * 0.9 mm apart, by some hundredths of a millimetre. Between the two readings the rail lies on neither face; where it runs along the seam
   * at a grazing angle that stretch is many times the sagitta long. Infinite ends where the faces share no segment.
   */
  function seam(
    body: IAutoMovieSolidBody.IBody,
    face: number,
    next: number,
    low: IAutoMovieSolidRail.IRail,
    high: IAutoMovieSolidRail.IRail,
  ): [number, number] {
    const at: [number, number] = [low.host[0], low.host[1]];
    const f: IAutoMovieSolidBody.IFace = body.faces[face]!;
    const g: IAutoMovieSolidBody.IFace | undefined = body.faces[next];
    if (g === undefined) return [Infinity, 0];
    const period: number | undefined = f.surface.period;

    // The shared segment nearest the first end, in the first face's chart.
    let best: {
      a: [number, number];
      b: [number, number];
      neighbour: IAutoMovieSolidCycle.INeighbour;
      distance: number;
    } | null = null;
    for (const cycle of f.cycles)
      for (let k: number = 0; k < cycle.neighbours.length; k++) {
        const neighbour: IAutoMovieSolidCycle.INeighbour = cycle.neighbours[k]!;
        if (neighbour.face !== next) continue;
        const a: [number, number] = cycle.chart[k]!;
        const raw: [number, number] =
          cycle.chart[(k + 1) % cycle.chart.length]!;
        const b: [number, number] = [
          raw[0],
          AutoMovieSolidCycle.shift(raw[1], a[1], period),
        ];
        const w: number = AutoMovieSolidCycle.shift(at[1], a[1], period);
        const distance: number = Math.hypot(
          ...nearest(a, b, [at[0], w]).map(
            (x: number, i: number): number => x - [at[0], w][i]!,
          ),
        );
        if (best === null || distance < best.distance)
          best = { a, b, neighbour, distance };
      }
    if (best === null) return [Infinity, 0];

    // The chord between the segment's two vertices, the first face's reading of its middle and the second face's.
    const { a, b, neighbour: n } = best;
    const read = (
      surface: IAutoMovieSolidSurface,
      c: [number, number],
    ): [number, number, number] | null => {
      const jet: IAutoMovieSolidSurface.IJet | null = AutoMovieSolidDomain.jet(
        surface,
        c[0],
        c[1],
      );
      return jet === null ? null : [jet.p[0], jet.p[1], jet.p[2]];
    };
    const ends: ([number, number, number] | null)[] = [
      read(f.surface, a),
      read(f.surface, b),
      read(f.surface, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]),
      read(g.surface, [(n.from[0] + n.to[0]) / 2, (n.from[1] + n.to[1]) / 2]),
    ];
    if (ends.some((p: [number, number, number] | null): boolean => p === null))
      return [Infinity, 0];
    const [p, q, here, there] = ends as [number, number, number][];
    const off = (x: readonly number[]): number =>
      Math.hypot(
        ...nearest(p!, q!, x).map((y: number, i: number): number => y - x[i]!),
      );
    return [
      Math.max(off(low.hostPoint), off(high.hostPoint)),
      Math.max(off(here!), off(there!)),
    ];
  }

  /** The point of the segment from `a` to `b` nearest `x`, in any dimension. */
  function nearest(
    a: readonly number[],
    b: readonly number[],
    x: readonly number[],
  ): number[] {
    const d: number[] = b.map((y: number, i: number): number => y - a[i]!);
    const dd: number = d.reduce(
      (sum: number, y: number): number => sum + y * y,
      0,
    );
    const t: number =
      dd > 0
        ? Math.min(
            1,
            Math.max(
              0,
              d.reduce(
                (sum: number, y: number, i: number): number =>
                  sum + y * (x[i]! - a[i]!),
                0,
              ) / dd,
            ),
          )
        : 0;
    return a.map((y: number, i: number): number => y + t * d[i]!);
  }

  /** A rebuilt cycle's per-segment exact boundaries, or nothing where every segment is a chord. */
  function carried(
    segments: (IAutoMovieSolidCycle.IExactSegment | null)[],
  ): { segments?: (IAutoMovieSolidCycle.IExactSegment | null)[] } {
    return segments.some(
      (s: IAutoMovieSolidCycle.IExactSegment | null): boolean => s !== null,
    )
      ? { segments }
      : {};
  }

  /** What `clip` returns for a run that joins two of the face's trims. */
  const ACROSS: string = "across";

  /**
   * Place a rail crossing into the face's trim it lies on: the trim that
   * already holds its vertex, or the one nearest it in the face's chart, split
   * at the crossing's foot.
   */
  function place(
    body: IAutoMovieSolidBody.IBody,
    face: number,
    p: IAutoMovieSolidClip.IRailPoint,
  ): [IAutoMovieSolidCycle.ICycle, number] | null {
    const f: IAutoMovieSolidBody.IFace = body.faces[face]!;
    const period: number | undefined = f.surface.period;
    const c: [number, number] = p.chart.get(face)!;
    let best: {
      cycle: IAutoMovieSolidCycle.ICycle;
      foot: IAutoMovieSolidCycle.IFoot;
    } | null = null;
    for (const cycle of f.cycles) {
      const at: number = cycle.vertices.indexOf(p.vertex);
      if (at >= 0) return [cycle, at];
      const foot: IAutoMovieSolidCycle.IFoot = AutoMovieSolidCycle.foot(
        cycle,
        c[0],
        c[1],
        period,
      );
      if (best === null || foot.distance < best.foot.distance)
        best = { cycle, foot };
    }
    if (best === null) return null;
    const { cycle, foot } = best;

    // A crossing found off its trim by no more than the rounding of its chart point is moved onto the trim: the bisection that placed it
    // reads the next face's surface, and a crossing left 7e-15 off the station line of f1's ear band, where the concha's cut crosses
    // the band's end, stood one unit in the last place inside the band and fenced a sliver no triangulation could open.
    if (
      foot.share > 0 &&
      foot.share < 1 &&
      foot.distance <= SNAP * (1 + Math.abs(c[0]) + Math.abs(c[1]))
    ) {
      const a: [number, number] = cycle.chart[foot.segment]!;
      const b: [number, number] =
        cycle.chart[(foot.segment + 1) % cycle.chart.length]!;
      const bv: number = AutoMovieSolidCycle.shift(b[1], a[1], period);
      const snapped: [number, number] = [
        a[0] === b[0] ? a[0] : a[0] + foot.share * (b[0] - a[0]),
        a[1] === bv ? a[1] : a[1] + foot.share * (bv - a[1]),
      ];
      c[0] = snapped[0];
      c[1] = AutoMovieSolidCycle.shift(snapped[1], c[1], period);
      p.chart.set(face, [c[0], c[1]]);
    }
    const other: number = p.faces.find((x: number): boolean => x !== face)!;
    const old: IAutoMovieSolidCycle.INeighbour =
      cycle.neighbours[foot.segment]!;
    const there: [number, number] =
      old.face === other
        ? p.chart.get(other)!
        : [
            old.from[0] + foot.share * (old.to[0] - old.from[0]),
            old.from[1] + foot.share * (old.to[1] - old.from[1]),
          ];
    const k: number = foot.segment + 1;

    // The segment the crossing is placed into becomes two chords; every other segment keeps the exact boundary it lies on.
    AutoMovieSolidCycle.divide(cycle, foot.segment);
    cycle.vertices.splice(k, 0, p.vertex);
    cycle.chart.splice(k, 0, [
      c[0],
      AutoMovieSolidCycle.shift(c[1], cycle.chart[foot.segment]![1], period),
    ]);
    cycle.neighbours.splice(
      foot.segment,
      1,
      { face: old.face, from: old.from, to: there },
      { face: old.face, from: there, to: old.to },
    );
    return [cycle, k];
  }

  /**
   * Clip one face by two runs of the rail that each join its two trims, as a
   * cut does that crosses a band from rim to rim and back. Neither run cuts
   * anything off alone; together they replace the two trims by one island: one
   * trim's arc between the runs, the first run, the other trim's arc, the second
   * run. It no longer winds round the period, so the face keeps its inside.
   * Of the two such cycles, the one that keeps the side past the rail is kept,
   * read by the same probe across the rail as `clip`'s.
   */
  function clipPair(
    body: IAutoMovieSolidBody.IBody,
    face: number,
    first: IAutoMovieSolidClip.IRailPoint[],
    second: IAutoMovieSolidClip.IRailPoint[],
    along: (
      a: IAutoMovieSolidClip.IRailPoint,
      b: IAutoMovieSolidClip.IRailPoint,
    ) => IAutoMovieSolidCycle.INeighbour,
  ): string | null {
    const f: IAutoMovieSolidBody.IFace = body.faces[face]!;
    const period: number | undefined = f.surface.period;
    const [e1, x1, e2, x2]: IAutoMovieSolidClip.IRailPoint[] = [
      first[0]!,
      first[first.length - 1]!,
      second[0]!,
      second[second.length - 1]!,
    ];
    const placed: ([IAutoMovieSolidCycle.ICycle, number] | null)[] = [
      e1,
      x1,
      e2,
      x2,
    ].map(
      (
        p: IAutoMovieSolidClip.IRailPoint,
      ): [IAutoMovieSolidCycle.ICycle, number] | null => place(body, face, p),
    );
    if (
      placed.some(
        (p: [IAutoMovieSolidCycle.ICycle, number] | null): boolean =>
          p === null,
      )
    )
      return `face ${f.surface.name} has no trim for the rail to cross`;
    const a: IAutoMovieSolidCycle.ICycle = placed[0]![0];
    const b: IAutoMovieSolidCycle.ICycle = placed[1]![0];
    if (a === b || placed[2]![0] !== b || placed[3]![0] !== a)
      return `the rail's two runs across face ${f.surface.name} do not each join its two trims`;
    // An arc of a trim from one crossing to another, walked in the trim's own
    // order (`step` 1) or against it (-1). The band's two rims run the same way
    // round, so one of the two arcs is walked against its trim's order, or the
    // new cycle would wind once round the period.
    const arc = (
      cycle: IAutoMovieSolidCycle.ICycle,
      from: IAutoMovieSolidClip.IRailPoint,
      to: IAutoMovieSolidClip.IRailPoint,
      step: 1 | -1,
    ): number[] => {
      const m: number = cycle.vertices.length;
      const out: number[] = [];
      for (
        let k: number = cycle.vertices.indexOf(from.vertex);
        ;
        k = (k + step + m) % m
      ) {
        out.push(k);
        if (cycle.vertices[k] === to.vertex) break;
      }
      return out;
    };
    const reverse = (
      n: IAutoMovieSolidCycle.INeighbour,
    ): IAutoMovieSolidCycle.INeighbour => ({
      face: n.face,
      from: n.to,
      to: n.from,
    });

    // One closed cycle: the arc of `p`, then the run `r`, the arc of `q`, then the run `s`, each run starting where its arc ends.
    const build = (
      p: IAutoMovieSolidCycle.ICycle,
      pArc: number[],
      r: IAutoMovieSolidClip.IRailPoint[],
      q: IAutoMovieSolidCycle.ICycle,
      qArc: number[],
      s: IAutoMovieSolidClip.IRailPoint[],
    ): IAutoMovieSolidCycle.ICycle => {
      const vertices: number[] = [];
      const chart: [number, number][] = [];
      const neighbours: IAutoMovieSolidCycle.INeighbour[] = [];

      // Each arc's segments stay on the exact boundary their trim lies on, an arc walked against its trim reversing their sense; the
      // runs are this clip's own chords.
      const segments: (IAutoMovieSolidCycle.IExactSegment | null)[] = [];
      for (const [cycle, positions, run] of [[p, pArc, r], [q, qArc, s]] as [IAutoMovieSolidCycle.ICycle, number[], IAutoMovieSolidClip.IRailPoint[]][]) {
        const m: number = cycle.vertices.length;
        positions.forEach((k: number, i: number): void => {
          vertices.push(cycle.vertices[k]!);
          chart.push(cycle.chart[k]!);
          if (i + 1 < positions.length) {
            const next: number = positions[i + 1]!;
            const forward: boolean = next === (k + 1) % m;
            neighbours.push(forward ? cycle.neighbours[k]! : reverse(cycle.neighbours[next]!));
            segments.push(forward ? AutoMovieSolidCycle.piece(cycle, k) : AutoMovieSolidCycle.piece(cycle, next, true));
          }
        });
        for (let i: number = 0; i + 1 < run.length; i++) {
          if (i > 0) {
            vertices.push(run[i]!.vertex);
            chart.push(run[i]!.chart.get(face)!);
          }
          neighbours.push(along(run[i]!, run[i + 1]!));
          segments.push(null);
        }
      }
      for (let k: number = 1; k < chart.length; k++)
        chart[k] = [chart[k]![0], AutoMovieSolidCycle.shift(chart[k]![1], chart[k - 1]![1], period)];
      return { kind: "island", vertices, chart, neighbours, ...carried(segments) };
    };
    // Of the arc directions on the second trim, the one whose cycle closes without winding round the period.
    const unwound = (
      make: (step: 1 | -1) => IAutoMovieSolidCycle.ICycle,
    ): IAutoMovieSolidCycle.ICycle => {
      const turn = (k: IAutoMovieSolidCycle.ICycle): number =>
        period === undefined
          ? 0
          : Math.abs(k.chart[k.chart.length - 1]![1] - k.chart[0]![1]);
      const [plus, minus]: IAutoMovieSolidCycle.ICycle[] = [make(1), make(-1)];
      return turn(plus) <= turn(minus) ? plus : minus;
    };
    const one: IAutoMovieSolidCycle.ICycle = unwound(
      (step: 1 | -1): IAutoMovieSolidCycle.ICycle =>
        build(a, arc(a, x2, e1, 1), first, b, arc(b, x1, e2, step), second),
    );
    const two: IAutoMovieSolidCycle.ICycle = unwound(
      (step: 1 | -1): IAutoMovieSolidCycle.ICycle =>
        build(
          a,
          arc(a, e1, x2, 1),
          [...second].reverse(),
          b,
          arc(b, e2, x1, step),
          [...first].reverse(),
        ),
    );

    // The candidate that keeps the side past the rail, probed as `clip` does.
    const inner: IAutoMovieSolidClip.IRailPoint[] = first.slice(1, -1);
    const probe: IAutoMovieSolidClip.IRailPoint | undefined =
      inner[Math.floor(inner.length / 2)];
    let chosen: IAutoMovieSolidCycle.ICycle = one;
    if (probe !== undefined && probe.across !== undefined) {
      const at = (p: IAutoMovieSolidClip.IRailPoint): number[] =>
        body.mesh.positions.slice(3 * p.vertex, 3 * p.vertex + 3);
      const gap = (
        u: IAutoMovieSolidClip.IRailPoint,
        v: IAutoMovieSolidClip.IRailPoint,
      ): number =>
        Math.hypot(
          ...[0, 1, 2].map((i: number): number => at(u)[i]! - at(v)[i]!),
        );
      const index: number = first.indexOf(probe);
      const side: number =
        SIDE *
        Math.min(gap(probe, first[index - 1]!), gap(probe, first[index + 1]!));
      const c: [number, number] = probe.chart.get(face)!;
      const e: [number, number] = probe.across;
      const keeps = (k: IAutoMovieSolidCycle.ICycle): boolean =>
        AutoMovieSolidCycle.kept(
          k,
          c[0] + side * e[0],
          c[1] + side * e[1],
          period,
        ) &&
        !AutoMovieSolidCycle.kept(
          k,
          c[0] - side * e[0],
          c[1] - side * e[1],
          period,
        );
      if (keeps(two) && !keeps(one)) chosen = two;
      else if (!keeps(one))
        return `neither side of the rail's two runs across face ${f.surface.name} keeps the face past the rail`;
    }
    f.cycles.splice(f.cycles.indexOf(a), 1, chosen);
    f.cycles.splice(f.cycles.indexOf(b), 1);
    return null;
  }

  /** Clip one face by one run of the rail. */
  function clip(
    body: IAutoMovieSolidBody.IBody,
    face: number,
    run: IAutoMovieSolidClip.IRailPoint[],
    along: (
      a: IAutoMovieSolidClip.IRailPoint,
      b: IAutoMovieSolidClip.IRailPoint,
    ) => IAutoMovieSolidCycle.INeighbour,
  ): string | null {
    const f: IAutoMovieSolidBody.IFace = body.faces[face]!;
    const period: number | undefined = f.surface.period;
    const entry: IAutoMovieSolidClip.IRailPoint = run[0]!;
    const exit: IAutoMovieSolidClip.IRailPoint = run[run.length - 1]!;

    // Both crossings into the cycle they lie on.
    const inPlace: [IAutoMovieSolidCycle.ICycle, number] | null = place(
      body,
      face,
      entry,
    );
    const outPlace: [IAutoMovieSolidCycle.ICycle, number] | null = place(
      body,
      face,
      exit,
    );
    if (inPlace === null || outPlace === null)
      return `face ${f.surface.name} has no trim for the rail to cross`;
    // A run that joins two trims cuts nothing off by itself; `trim` pairs it with the next such run.
    if (inPlace[0] !== outPlace[0]) return ACROSS;
    const cycle: IAutoMovieSolidCycle.ICycle = inPlace[0];
    const ia: number = cycle.vertices.indexOf(entry.vertex);
    const ib: number = cycle.vertices.indexOf(exit.vertex);
    if (ia < 0 || ib < 0)
      return `the rail's run on face ${f.surface.name} does not meet its trim at both ends (entry at ${ia}, exit at ${ib})`;
    const off: IAutoMovieSolidClip.IRailPoint | undefined = run.find(
      (p: IAutoMovieSolidClip.IRailPoint): boolean => !p.chart.has(face),
    );
    if (off !== undefined)
      return `the rail's run on face ${f.surface.name} holds a point at phase ${off.phase} with no chart on that face (faces ${off.faces.join(", ")})`;
    const short: boolean =
      cycle.chart.length !== cycle.vertices.length ||
      cycle.neighbours.length !== cycle.vertices.length;
    if (short)
      return `face ${f.surface.name}'s trim holds ${cycle.vertices.length} vertices, ${cycle.chart.length} chart points and ${cycle.neighbours.length} neighbours`;

    // The two candidates: the arc from the exit round to the entry, then the
    // run; or the arc from the entry to the exit, then the run backwards.
    const m: number = cycle.vertices.length;
    const arc = (from: number, to: number): number[] => {
      const out: number[] = [];
      for (let k: number = from; ; k = (k + 1) % m) {
        out.push(k);
        if (k === to) break;
      }
      return out;
    };
    const inner: IAutoMovieSolidClip.IRailPoint[] = run.slice(1, -1);
    const build = (
      positions: number[],
      tail: IAutoMovieSolidClip.IRailPoint[],
      head: IAutoMovieSolidClip.IRailPoint,
      last: IAutoMovieSolidClip.IRailPoint,
    ): IAutoMovieSolidCycle.ICycle => {
      const vertices: number[] = positions.map(
        (k: number): number => cycle.vertices[k]!,
      );
      const chart: [number, number][] = positions.map(
        (k: number): [number, number] => cycle.chart[k]!,
      );
      const neighbours: IAutoMovieSolidCycle.INeighbour[] = positions
        .slice(0, -1)
        .map(
          (k: number): IAutoMovieSolidCycle.INeighbour => cycle.neighbours[k]!,
        );
      // The arc's segments stay on the exact boundary the trim lies on; the run's are this clip's own chords.
      const segments: (IAutoMovieSolidCycle.IExactSegment | null)[] = positions
        .slice(0, -1)
        .map(
          (k: number): IAutoMovieSolidCycle.IExactSegment | null =>
            AutoMovieSolidCycle.piece(cycle, k),
        );
      const chain: IAutoMovieSolidClip.IRailPoint[] = [head, ...tail, last];
      for (let k: number = 0; k + 1 < chain.length; k++) {
        if (k > 0) {
          vertices.push(chain[k]!.vertex);
          chart.push(chain[k]!.chart.get(face)!);
        }
        neighbours.push(along(chain[k]!, chain[k + 1]!));
        segments.push(null);
      }
      // One branch of the periodic phase along the whole cycle.
      for (let k: number = 1; k < chart.length; k++)
        chart[k] = [
          chart[k]![0],
          AutoMovieSolidCycle.shift(chart[k]![1], chart[k - 1]![1], period),
        ];
      return {
        kind: cycle.kind,
        vertices,
        chart,
        neighbours,
        ...(cycle.along === undefined ? {} : { along: cycle.along }),
        ...carried(segments),
      };
    };
    const one: IAutoMovieSolidCycle.ICycle = build(
      arc(ib, ia),
      inner,
      entry,
      exit,
    );
    const two: IAutoMovieSolidCycle.ICycle = build(
      arc(ia, ib),
      [...inner].reverse(),
      exit,
      entry,
    );

    // The candidate that keeps the side past the rail and removes the side before it.
    const probe: IAutoMovieSolidClip.IRailPoint | undefined =
      inner[Math.floor(inner.length / 2)];
    let chosen: IAutoMovieSolidCycle.ICycle = one;
    if (probe !== undefined && probe.across !== undefined) {
      const at = (p: IAutoMovieSolidClip.IRailPoint): number[] =>
        body.mesh.positions.slice(3 * p.vertex, 3 * p.vertex + 3);
      const gap = (
        a: IAutoMovieSolidClip.IRailPoint,
        b: IAutoMovieSolidClip.IRailPoint,
      ): number =>
        Math.hypot(
          ...[0, 1, 2].map((i: number): number => at(a)[i]! - at(b)[i]!),
        );
      const index: number = run.indexOf(probe);
      const side: number =
        SIDE *
        Math.min(gap(probe, run[index - 1]!), gap(probe, run[index + 1]!));
      const c: [number, number] = probe.chart.get(face)!;
      const e: [number, number] = probe.across;
      const keeps = (k: IAutoMovieSolidCycle.ICycle): boolean =>
        AutoMovieSolidCycle.kept(
          k,
          c[0] + side * e[0],
          c[1] + side * e[1],
          period,
        ) &&
        !AutoMovieSolidCycle.kept(
          k,
          c[0] - side * e[0],
          c[1] - side * e[1],
          period,
        );
      if (keeps(two) && !keeps(one)) chosen = two;
      else if (!keeps(one))
        return `neither side of the rail's run on face ${f.surface.name} keeps the face past the rail`;
      // Both keep the side past the rail where the run's two crossings lie on a trim whose removed side the run stands outside, as a
      // cut under a port's band runs over the host's skin below the port's hole: one candidate is the hole widened by the cut, the
      // other the cut alone, which would give the face back the hole's whole inside. A cut only takes more of a face away, so the one
      // that removes everything the trim removed is kept.
      else if (
        keeps(two) &&
        lost(cycle, two, period) < lost(cycle, one, period)
      )
        chosen = two;
    }
    f.cycles.splice(f.cycles.indexOf(cycle), 1, chosen);
    return null;
  }

  /**
   * How many points the trim `old` removes the candidate would keep: one point beside the middle of each of the trim's segments, on the
   * side the trim removes, a quarter of the segment's chart length off it. A candidate that removes at least what the trim did keeps none.
   */
  function lost(
    old: IAutoMovieSolidCycle.ICycle,
    candidate: IAutoMovieSolidCycle.ICycle,
    period: number | undefined,
  ): number {
    let count: number = 0;
    const n: number = old.chart.length;
    for (let k: number = 0; k < n; k++) {
      const a: [number, number] = old.chart[k]!;
      const raw: [number, number] = old.chart[(k + 1) % n]!;
      const b: [number, number] = [
        raw[0],
        AutoMovieSolidCycle.shift(raw[1], a[1], period),
      ];
      const middle: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const off: [number, number] = [
        -SIDE * (b[1] - a[1]),
        SIDE * (b[0] - a[0]),
      ];
      if (!(Math.hypot(off[0], off[1]) > 0)) continue;
      const plus: [number, number] = [middle[0] + off[0], middle[1] + off[1]];
      const minus: [number, number] = [middle[0] - off[0], middle[1] - off[1]];
      const keepsPlus: boolean = AutoMovieSolidCycle.kept(
        old,
        plus[0],
        plus[1],
        period,
      );
      if (
        keepsPlus === AutoMovieSolidCycle.kept(old, minus[0], minus[1], period)
      )
        continue;
      const removed: [number, number] = keepsPlus ? minus : plus;
      if (AutoMovieSolidCycle.kept(candidate, removed[0], removed[1], period))
        count++;
    }
    return count;
  }
}
