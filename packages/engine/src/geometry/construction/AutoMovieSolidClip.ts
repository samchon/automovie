import type { AutoMovieSolidBlendChain } from "./AutoMovieSolidBlendChain";
import type { AutoMovieSolidBody } from "./AutoMovieSolidBody";
import { AutoMovieSolidCycle } from "./AutoMovieSolidCycle";
import type { AutoMovieSolidJoin } from "./AutoMovieSolidJoin";
import { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import type { AutoMovieSolidRail } from "./AutoMovieSolidRail";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

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
 * surface removal using polygon area sorting, SIGGRAPH 1977).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the crossing search, the two candidates and the side test.
 * @evidence contracts/development/design.md#principled-representation Represents A host rail laid onto the faces of a body: its points with the crossings between faces, and each face it runs over trimmed by it: companion namespace of 6 members (`IRailPoint`, `BISECTIONS`, `SIDE`, `rail`, `trim`, `clip`); units and frames named in its text: world, local, second. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidClip` in packages/engine/src/geometry/construction/AutoMovieSolidClip.ts; its surface is the 6 members listed and the text shows 3 other files naming it, mostly packages/engine (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidClip {
  /**
   * A mesh vertex with its host-rail parameter and one or two incident face charts.
   *
   * @evidence contracts/development/design.md#principled-representation Regular points belong to one face; a placed crossing shares one vertex between two chart readings so clipped face boundaries can refer to the same index.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One record couples the shared mesh index to per-face chart data and the optional side-probe direction.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Two chart readings alone do not certify identical world positions; the crossing builder's finite bisection and atlas premises own that approximation.
   * @evidence contracts/development/common.md#meaningful-documentation Gives phase order, face-chart mapping and the absence of an across probe at crossings.
   */
  export interface IRailPoint {
    /** Its vertex in the body's mesh. */
    vertex: number;

    /** Its phase on the blend chain, increasing along the rail from 0 to under a turn. */
    phase: number;

    /** The body faces it lies on: one, or the two a crossing joins. */
    faces: number[];

    /** Its chart point on each of those faces. */
    chart: Map<number, [number, number]>;

    /** The rail's offset direction there in the chart of its one face, of unit world speed; absent at a crossing. */
    across?: [number, number];
  }

  /** Maximum crossing halvings; a null rail may end the search earlier once the bracket is at most a millionth of a column. */
  export const BISECTIONS: number = 40;

  /** Largest world distance between the rail's last point on one face and its first on the next for a crossing to be placed between them, mm: a hundredth of a millimetre, a hundredth of the chord tolerance a skin is drawn at. */
  export const CROSSING: number = 1e-2;

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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Samples the host rail at blend columns and bisects each adjacent face change, retaining one low-side world vertex plus both endpoint chart readings for the placed crossing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One point constructor owns mesh registration and metadata while one ordered column pass owns crossing brackets.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Assumes a supported face transition between adjacent columns; finite bisection and the millionth-column null-rail escape do not independently certify coincident chart positions. A failure can leave inserted vertices until the body caller rolls back.
   * @evidence contracts/development/common.md#meaningful-documentation Names atlas-to-body index mapping, column count, rail order, mutation and crossing failure meaning.
   * @evidence contracts/development/implementation.md#efficient-algorithms C columns and B face changes use O(C) output plus up to 40 rail queries per change, with linear owner-name lookup for inserted points; rail solving/cache costs belong to that caller as well.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses published column charts/across directions and the join's rail cache for bisection queries; each returned crossing has one mesh vertex for both incident faces.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Mesh mutations and O(C+B) returned metadata survive success; on string failure the operation does not undo earlier inserts, while SolidBody.merge's checkpoint restores its arrays/cycles.
   */
  export function rail(
    body: AutoMovieSolidBody.IBody,
    join: AutoMovieSolidJoin.IJoin,
    blend: AutoMovieSolidBlendChain.IBlend,
    index: number[],
    count: number,
  ): IRailPoint[] | string {
    const faces: number[] = (
      blend.host.faces ?? blend.host.chart.map((): number => 0)
    ).map((f: number): number => index[f]!);
    const point = (
      face: number,
      chart: [number, number],
      phase: number,
      across?: [number, number],
    ): IRailPoint => {
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
    const out: IRailPoint[] = [];
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
      let low: AutoMovieSolidRail.IRail | null = join.rail(lo);
      let high: AutoMovieSolidRail.IRail | null = join.rail(hi);
      for (
        let i: number = 0;
        i < BISECTIONS && low !== null && high !== null;
        i++
      ) {
        const m: number = (lo + hi) / 2;
        const r: AutoMovieSolidRail.IRail | null = join.rail(m);
        // At the crossing itself the rail may stand on the boundary of both
        // faces and settle on neither; once the bracket is a millionth of a
        // column the two ends already place the crossing.
        if (r === null) {
          if (hi - lo <= (1e-6 * 2 * Math.PI) / count) break;

          // The rail settles on neither face over a stretch of the parameter
          // round the crossing. Each end of that stretch is found from its own
          // side; the crossing is placed when the rail's two ends there are one
          // world point within `CROSSING` mm.
          let dead: [number, number] = [m, m];
          for (let j: number = 0; j < BISECTIONS; j++) {
            const a: number = (lo + dead[0]) / 2;
            const ra: AutoMovieSolidRail.IRail | null = join.rail(a);
            if (ra === null) dead = [a, dead[1]];
            else if (index[ra.hostFace] === faces[k]) {
              lo = a;
              low = ra;
            } else break;
          }
          for (let j: number = 0; j < BISECTIONS; j++) {
            const b: number = (dead[1] + hi) / 2;
            const rb: AutoMovieSolidRail.IRail | null = join.rail(b);
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
          if (
            index[low!.hostFace] === faces[k] &&
            index[high!.hostFace] === next &&
            gap <= CROSSING
          )
            break;
          return `no rail at t ${m}, between the columns at t ${lo} and ${hi} where the rail leaves face ${faces[k]} for face ${next} (its two ends stand ${gap} mm apart)`;
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
      const crossing: IRailPoint = point(
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
   * @param kind The rail's kind on a single face (`AutoMovieSolidBlendChain.IBlend.host.kind`).
   * @returns Null, or why a face could not be trimmed.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Splits a multi-face rail into crossing-to-crossing runs, inserts crossings in one existing boundary cycle and builds the two replacement arcs, using an available local across probe to choose the kept side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The single-face loop case is direct; multi-face runs delegate boundary insertion/candidate selection to one local clip operation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Rejects unsupported run/cycle/probe outcomes, but missing interior probes default to the first candidate without proving the kept side; previous mutations also remain on a later failure until the body owner rolls back.
   * @evidence contracts/development/common.md#meaningful-documentation States in-place cycle changes, blend-neighbour identity, single-face kind and nullable error; the evidence records the no-probe validation gap.
   * @evidence contracts/development/implementation.md#efficient-algorithms Ordered run extraction is linear in rail size, while each run scans candidate face cycles and builds/tests O(C+R) boundary data; repeated runs can revisit an existing boundary rather than sharing a global clipping index.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses existing rail vertex/chart identities and shared blend-neighbour mappings instead of recomputing a second geometric rail.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The body retains replaced cycles and inserted crossing references; run/candidate scratch is local, and SolidBody.merge owns recovery of partial mutations when a premise string is returned.
   */
  export function trim(
    body: AutoMovieSolidBody.IBody,
    rail: IRailPoint[],
    blend: number,
    kind: AutoMovieSolidCycle.ICycle["kind"],
  ): string | null {
    const n: number = rail.length;
    const along = (
      a: IRailPoint,
      b: IRailPoint,
    ): AutoMovieSolidCycle.INeighbour => ({
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
        (r: IRailPoint): boolean =>
          r.faces.length === 1 && r.faces[0] === first,
      )
    ) {
      body.faces[first]!.cycles.push({
        kind,
        vertices: rail.map((r: IRailPoint): number => r.vertex),
        chart: rail.map(
          (r: IRailPoint): [number, number] => r.chart.get(first)!,
        ),
        neighbours: rail.map(
          (r: IRailPoint, k: number): AutoMovieSolidCycle.INeighbour =>
            along(r, rail[(k + 1) % n]!),
        ),
      });
      return null;
    }

    // Runs from crossing to crossing, each on one face. A run that joins two
    // of a face's trims (a cut across a band, from its one rim to its other)
    // cuts nothing off by itself; it waits for the face's next such run, and
    // the two are clipped together (`clipPair`).
    const pending: Map<number, IRailPoint[]> = new Map();
    const start: number = rail.findIndex(
      (r: IRailPoint): boolean => r.faces.length === 2,
    );
    for (let k: number = 0; k < n; ) {
      const a: number = (start + k) % n;
      const entry: IRailPoint = rail[a]!;
      const run: IRailPoint[] = [entry];
      let j: number = k + 1;
      for (; j <= n; j++) {
        const p: IRailPoint = rail[(start + j) % n]!;
        run.push(p);
        if (p.faces.length === 2) break;
      }
      const exit: IRailPoint = run[run.length - 1]!;
      const face: number | undefined = entry.faces.find(
        (f: number): boolean =>
          exit.faces.includes(f) &&
          run.slice(1, -1).every((p: IRailPoint): boolean => p.faces[0] === f),
      );
      if (face === undefined)
        return `the rail's run from phase ${entry.phase} to ${exit.phase} lies on no one face`;
      const failed: string | null = clip(body, face, run, along);
      if (failed === ACROSS) {
        const first: IRailPoint[] | undefined = pending.get(face);
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

  /** What `clip` returns for a run that joins two of the face's trims. */
  const ACROSS: string = "across";

  /**
   * Place a rail crossing into the face's trim it lies on: the trim that
   * already holds its vertex, or the one nearest it in the face's chart, split
   * at the crossing's foot.
   */
  function place(
    body: AutoMovieSolidBody.IBody,
    face: number,
    p: IRailPoint,
  ): [AutoMovieSolidCycle.ICycle, number] | null {
    const f: AutoMovieSolidBody.IFace = body.faces[face]!;
    const period: number | undefined = f.surface.period;
    const c: [number, number] = p.chart.get(face)!;
    let best: {
      cycle: AutoMovieSolidCycle.ICycle;
      foot: AutoMovieSolidCycle.IFoot;
    } | null = null;
    for (const cycle of f.cycles) {
      const at: number = cycle.vertices.indexOf(p.vertex);
      if (at >= 0) return [cycle, at];
      const foot: AutoMovieSolidCycle.IFoot = AutoMovieSolidCycle.foot(
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
    const other: number = p.faces.find((x: number): boolean => x !== face)!;
    const old: AutoMovieSolidCycle.INeighbour = cycle.neighbours[foot.segment]!;
    const there: [number, number] =
      old.face === other
        ? p.chart.get(other)!
        : [
            old.from[0] + foot.share * (old.to[0] - old.from[0]),
            old.from[1] + foot.share * (old.to[1] - old.from[1]),
          ];
    const k: number = foot.segment + 1;
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
    body: AutoMovieSolidBody.IBody,
    face: number,
    first: IRailPoint[],
    second: IRailPoint[],
    along: (a: IRailPoint, b: IRailPoint) => AutoMovieSolidCycle.INeighbour,
  ): string | null {
    const f: AutoMovieSolidBody.IFace = body.faces[face]!;
    const period: number | undefined = f.surface.period;
    const [e1, x1, e2, x2]: IRailPoint[] = [first[0]!, first[first.length - 1]!, second[0]!, second[second.length - 1]!];
    const placed: ([AutoMovieSolidCycle.ICycle, number] | null)[] = [e1, x1, e2, x2].map((p: IRailPoint): [AutoMovieSolidCycle.ICycle, number] | null => place(body, face, p));
    if (placed.some((p: [AutoMovieSolidCycle.ICycle, number] | null): boolean => p === null))
      return `face ${f.surface.name} has no trim for the rail to cross`;
    const a: AutoMovieSolidCycle.ICycle = placed[0]![0];
    const b: AutoMovieSolidCycle.ICycle = placed[1]![0];
    if (a === b || placed[2]![0] !== b || placed[3]![0] !== a)
      return `the rail's two runs across face ${f.surface.name} do not each join its two trims`;
    // An arc of a trim from one crossing to another, walked in the trim's own
    // order (`step` 1) or against it (-1). The band's two rims run the same way
    // round, so one of the two arcs is walked against its trim's order, or the
    // new cycle would wind once round the period.
    const arc = (cycle: AutoMovieSolidCycle.ICycle, from: IRailPoint, to: IRailPoint, step: 1 | -1): number[] => {
      const m: number = cycle.vertices.length;
      const out: number[] = [];
      for (let k: number = cycle.vertices.indexOf(from.vertex); ; k = (k + step + m) % m) {
        out.push(k);
        if (cycle.vertices[k] === to.vertex) break;
      }
      return out;
    };
    const reverse = (n: AutoMovieSolidCycle.INeighbour): AutoMovieSolidCycle.INeighbour => ({ face: n.face, from: n.to, to: n.from });

    // One closed cycle: the arc of `p`, then the run `r`, the arc of `q`, then the run `s`, each run starting where its arc ends.
    const build = (
      p: AutoMovieSolidCycle.ICycle,
      pArc: number[],
      r: IRailPoint[],
      q: AutoMovieSolidCycle.ICycle,
      qArc: number[],
      s: IRailPoint[],
    ): AutoMovieSolidCycle.ICycle => {
      const vertices: number[] = [];
      const chart: [number, number][] = [];
      const neighbours: AutoMovieSolidCycle.INeighbour[] = [];
      for (const [cycle, positions, run] of [[p, pArc, r], [q, qArc, s]] as [AutoMovieSolidCycle.ICycle, number[], IRailPoint[]][]) {
        const m: number = cycle.vertices.length;
        positions.forEach((k: number, i: number): void => {
          vertices.push(cycle.vertices[k]!);
          chart.push(cycle.chart[k]!);
          if (i + 1 < positions.length) {
            const next: number = positions[i + 1]!;
            neighbours.push(next === (k + 1) % m ? cycle.neighbours[k]! : reverse(cycle.neighbours[next]!));
          }
        });
        for (let i: number = 0; i + 1 < run.length; i++) {
          if (i > 0) {
            vertices.push(run[i]!.vertex);
            chart.push(run[i]!.chart.get(face)!);
          }
          neighbours.push(along(run[i]!, run[i + 1]!));
        }
      }
      for (let k: number = 1; k < chart.length; k++)
        chart[k] = [chart[k]![0], AutoMovieSolidCycle.shift(chart[k]![1], chart[k - 1]![1], period)];
      return { kind: "island", vertices, chart, neighbours };
    };
    // Of the arc directions on the second trim, the one whose cycle closes without winding round the period.
    const unwound = (make: (step: 1 | -1) => AutoMovieSolidCycle.ICycle): AutoMovieSolidCycle.ICycle => {
      const turn = (k: AutoMovieSolidCycle.ICycle): number => (period === undefined ? 0 : Math.abs(k.chart[k.chart.length - 1]![1] - k.chart[0]![1]));
      const [plus, minus]: AutoMovieSolidCycle.ICycle[] = [make(1), make(-1)];
      return turn(plus) <= turn(minus) ? plus : minus;
    };
    const one: AutoMovieSolidCycle.ICycle = unwound((step: 1 | -1): AutoMovieSolidCycle.ICycle => build(a, arc(a, x2, e1, 1), first, b, arc(b, x1, e2, step), second));
    const two: AutoMovieSolidCycle.ICycle = unwound((step: 1 | -1): AutoMovieSolidCycle.ICycle => build(a, arc(a, e1, x2, 1), [...second].reverse(), b, arc(b, e2, x1, step), [...first].reverse()));

    // The candidate that keeps the side past the rail, probed as `clip` does.
    const inner: IRailPoint[] = first.slice(1, -1);
    const probe: IRailPoint | undefined = inner[Math.floor(inner.length / 2)];
    let chosen: AutoMovieSolidCycle.ICycle = one;
    if (probe !== undefined && probe.across !== undefined) {
      const at = (p: IRailPoint): number[] => body.mesh.positions.slice(3 * p.vertex, 3 * p.vertex + 3);
      const gap = (u: IRailPoint, v: IRailPoint): number => Math.hypot(...[0, 1, 2].map((i: number): number => at(u)[i]! - at(v)[i]!));
      const index: number = first.indexOf(probe);
      const side: number = SIDE * Math.min(gap(probe, first[index - 1]!), gap(probe, first[index + 1]!));
      const c: [number, number] = probe.chart.get(face)!;
      const e: [number, number] = probe.across;
      const keeps = (k: AutoMovieSolidCycle.ICycle): boolean =>
        AutoMovieSolidCycle.kept(k, c[0] + side * e[0], c[1] + side * e[1], period) && !AutoMovieSolidCycle.kept(k, c[0] - side * e[0], c[1] - side * e[1], period);
      if (keeps(two) && !keeps(one)) chosen = two;
      else if (!keeps(one)) return `neither side of the rail's two runs across face ${f.surface.name} keeps the face past the rail`;
    }
    f.cycles.splice(f.cycles.indexOf(a), 1, chosen);
    f.cycles.splice(f.cycles.indexOf(b), 1);
    return null;
  }

  /** Clip one face by one run of the rail. */
  function clip(
    body: AutoMovieSolidBody.IBody,
    face: number,
    run: IRailPoint[],
    along: (a: IRailPoint, b: IRailPoint) => AutoMovieSolidCycle.INeighbour,
  ): string | null {
    const f: AutoMovieSolidBody.IFace = body.faces[face]!;
    const period: number | undefined = f.surface.period;
    const entry: IRailPoint = run[0]!;
    const exit: IRailPoint = run[run.length - 1]!;

    // Both crossings into the cycle they lie on.
    const inPlace: [AutoMovieSolidCycle.ICycle, number] | null = place(body, face, entry);
    const outPlace: [AutoMovieSolidCycle.ICycle, number] | null = place(body, face, exit);
    if (inPlace === null || outPlace === null)
      return `face ${f.surface.name} has no trim for the rail to cross`;
    // A run that joins two trims cuts nothing off by itself; `trim` pairs it with the next such run.
    if (inPlace[0] !== outPlace[0]) return ACROSS;
    const cycle: AutoMovieSolidCycle.ICycle = inPlace[0];
    const ia: number = cycle.vertices.indexOf(entry.vertex);
    const ib: number = cycle.vertices.indexOf(exit.vertex);
    if (ia < 0 || ib < 0)
      return `the rail's run on face ${f.surface.name} does not meet its trim at both ends (entry at ${ia}, exit at ${ib})`;
    const off: IRailPoint | undefined = run.find(
      (p: IRailPoint): boolean => !p.chart.has(face),
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
    const inner: IRailPoint[] = run.slice(1, -1);
    const build = (
      positions: number[],
      tail: IRailPoint[],
      head: IRailPoint,
      last: IRailPoint,
    ): AutoMovieSolidCycle.ICycle => {
      const vertices: number[] = positions.map(
        (k: number): number => cycle.vertices[k]!,
      );
      const chart: [number, number][] = positions.map(
        (k: number): [number, number] => cycle.chart[k]!,
      );
      const neighbours: AutoMovieSolidCycle.INeighbour[] = positions
        .slice(0, -1)
        .map(
          (k: number): AutoMovieSolidCycle.INeighbour => cycle.neighbours[k]!,
        );
      const chain: IRailPoint[] = [head, ...tail, last];
      for (let k: number = 0; k + 1 < chain.length; k++) {
        if (k > 0) {
          vertices.push(chain[k]!.vertex);
          chart.push(chain[k]!.chart.get(face)!);
        }
        neighbours.push(along(chain[k]!, chain[k + 1]!));
      }
      // One branch of the periodic phase along the whole cycle.
      for (let k: number = 1; k < chart.length; k++)
        chart[k] = [
          chart[k]![0],
          AutoMovieSolidCycle.shift(chart[k]![1], chart[k - 1]![1], period),
        ];
      return { kind: cycle.kind, vertices, chart, neighbours };
    };
    const one: AutoMovieSolidCycle.ICycle = build(
      arc(ib, ia),
      inner,
      entry,
      exit,
    );
    const two: AutoMovieSolidCycle.ICycle = build(
      arc(ia, ib),
      [...inner].reverse(),
      exit,
      entry,
    );

    // The candidate that keeps the side past the rail and removes the side before it.
    const probe: IRailPoint | undefined = inner[Math.floor(inner.length / 2)];
    let chosen: AutoMovieSolidCycle.ICycle = one;
    if (probe !== undefined && probe.across !== undefined) {
      const at = (p: IRailPoint): number[] =>
        body.mesh.positions.slice(3 * p.vertex, 3 * p.vertex + 3);
      const gap = (a: IRailPoint, b: IRailPoint): number =>
        Math.hypot(
          ...[0, 1, 2].map((i: number): number => at(a)[i]! - at(b)[i]!),
        );
      const index: number = run.indexOf(probe);
      const side: number =
        SIDE *
        Math.min(gap(probe, run[index - 1]!), gap(probe, run[index + 1]!));
      const c: [number, number] = probe.chart.get(face)!;
      const e: [number, number] = probe.across;
      const keeps = (k: AutoMovieSolidCycle.ICycle): boolean =>
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
    }
    f.cycles.splice(f.cycles.indexOf(cycle), 1, chosen);
    return null;
  }
}
