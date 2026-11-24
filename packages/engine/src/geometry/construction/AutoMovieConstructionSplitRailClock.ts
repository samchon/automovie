import type {
  AutoMovieVector3Tuple as V3,
  IAutoMovieConstructionSkinCut,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitCompose,
} from "@automovie/interface";

import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** Match topologically corresponding arcs of a composed split's two rails. */
export namespace AutoMovieConstructionSplitRailClock {
  /**
   * Within matched source stretches, move a rail phase only when the existing
   * pairing cannot support a forward Hermite cross line at both ends. The
   * positive derivative projections are necessary for strict chord advance.
   * Preserve each fork and choose the least geometric motion of the rail
   * points under the shared cyclic order.
   */
  export function regularize(
    phases: readonly number[],
    marks: readonly { column: number; phase: number }[],
    starts: readonly { point: V3; first: V3 }[],
    read: (phase: number) => IAutoMovieConstructionSplitBand.ILineEnd,
    behind?: (column: number, line: IAutoMovieConstructionSplitBand.ILineDemand) => void,
    observe?: (column: number, phase: number, end: IAutoMovieConstructionSplitBand.ILineEnd) => void,
    directed?: (column: number, target: V3) => V3,
  ): number[] | string {
    const turn: number = 2 * Math.PI;
    const sense: number = Math.sign(phases.at(-1)! - phases[0]!);
    const ahead = (k: number, b: ReturnType<typeof read>): boolean => {
      const a = starts[k]!;
      const chord: V3 = Vec.sub(b.point, a.point);
      return Vec.dot(chord, directed?.(k, b.point) ?? a.first) > 0 && Vec.dot(chord, b.first) > 0;
    };
    const original = phases.map((phase, k) => {
      const end = read(phase);
      observe?.(k, phase, end);
      return end;
    });
    const failing: number[] = original.flatMap((b, k): number[] => ahead(k, b) ? [] : [k]);
    if (failing.length === 0) return [...phases];
    const output: number[] = [...phases];
    const refused: string[] = [];
    const report = (k: number): void => behind?.(k, { childPhase: phases[k]!, start: starts[k]!, end: original[k]! });
    const step: number = turn / (8 * phases.length);
    for (const [i, a] of marks.entries()) {
      const b = marks[i + 1] ?? { column: phases.length, phase: marks[0]!.phase + sense * turn };
      if (failing.includes(a.column)) {
        report(a.column);
        refused.push(`fork ${a.column} at ${a.phase} rad points behind its own chord`);
      }
      const target: number[] = failing.filter((k): boolean => k > a.column && k < b.column);
      if (target.length === 0) continue;
      const count: number = Math.ceil(Math.abs(b.phase - a.phase) / step);
      const choices: number[] = [
        ...Array.from({ length: count - 1 }, (_, k): number => a.phase + (b.phase - a.phase) * (k + 1) / count),
        ...phases.slice(a.column + 1, b.column),
      ].sort((x, y): number => sense * (x - y));
      const unique: number[] = [...new Set(choices)];
      const rail = unique.map(read);
      let previous = unique.map((): number => 0);
      const links: number[][] = [];
      for (let k: number = a.column + 1; k < b.column; ++k) {
        let before: number = -1;
        const row: number[] = [];
        const expected: V3 = original[k]!.point;
        const next: number[] = rail.map((sample, at): number => {
          if (at > 0 && (before < 0 || previous[at - 1]! < previous[before]!)) before = at - 1;
          row.push(before);
          if (!ahead(k, sample) || (links.length !== 0 && before < 0)) return Infinity;
          const delta: V3 = Vec.sub(sample.point, expected);
          return Vec.dot(delta, delta) + (links.length === 0 ? 0 : previous[before]!);
        });
        links.push(row);
        previous = next;
      }
      let best: number = previous.indexOf(Math.min(...previous));
      if (best < 0 || !Number.isFinite(previous[best])) {
        target.forEach(report);
        const directions: string[] = target.map((k): string => {
          const near = starts[k]!;
          const far = original[k]!;
          const chord: V3 = Vec.sub(far.point, near.point);
          const start: V3 = directed?.(k, far.point) ?? near.first;
          const a: number = Vec.dot(chord, start) / (Vec.norm(chord) * Vec.norm(start));
          const b: number = Vec.dot(chord, far.first) / (Vec.norm(chord) * Vec.norm(far.first));
          return `${k} [${a.toFixed(3)}, ${b.toFixed(3)}]`;
        });
        refused.push(`stretch ${a.column}–${b.column} has no ordered forward cross lines (${directions.join(", ")})`);
        continue;
      }
      for (let k: number = b.column - 1; k > a.column; --k) {
        output[k] = unique[best]!;
        best = links[k - a.column - 1]![best]!;
      }
    }
    return refused.length === 0 ? output : refused.join("; ");
  }

  /** Prepare all active territorial switches and the uniform addresses used to find them. */
  export function switches(
    source: IAutoMovieConstructionSplitCompose.IDerived["railPlanes"][number],
    read: (phase: number) => V3,
    count: number,
    tangent?: (phase: number) => V3,
    sample?: (index: number, phase: number) => V3,
  ): { sites: { phase: number; point: V3 }[]; crossings: IAutoMovieConstructionSplitBand.IRailCrossing[] } | string {
    const { planes } = source;
    const turn: number = 2 * Math.PI;
    const resolution: number = 8 * count;
    const step: number = turn / resolution;
    const distance = (p: V3, plane: IAutoMovieConstructionSkinCut.IPlane): number =>
      Vec.dot(Vec.sub(p, plane.point), plane.normal);
    const active = (p: V3): number => {
      let smallest: number = Infinity;
      let chosen: number = 0;
      for (const [i, { plane }] of planes.entries()) {
        const d: number = distance(p, plane);
        if (d < smallest) [smallest, chosen] = [d, i];
      }
      return chosen;
    };
    const sites = Array.from({ length: resolution }, (_, k) => ({ phase: step * k, point: sample === undefined ? read(step * k) : sample(k, step * k) }));
    const labels: number[] = sites.map(({ point }): number => active(point));
    const crossings: IAutoMovieConstructionSplitBand.IRailCrossing[] = [];
    for (let k: number = 0; k < resolution; ++k) {
      const [a, b]: [number, number] = [labels[k]!, labels[(k + 1) % resolution]!];
      if (a === b) continue;
      const { plane: A, label: from } = planes[a]!;
      const { plane: B, label: to } = planes[b]!;
      const normal: V3 = Vec.sub(A.normal, B.normal);
      const magnitude: number = Vec.norm(normal);
      if (!(magnitude > 0)) return `the child rail's fields ${from} and ${to} have no difference plane`;
      let [lo, hi]: [number, number] = [step * k, step * (k + 1)];
      for (;;) {
        const mid: number = (lo + hi) / 2;
        if (!(mid > lo && mid < hi)) break;
        const p: V3 = read(mid);
        if (distance(p, A) < distance(p, B)) lo = mid;
        else hi = mid;
      }
      if (tangent !== undefined && !(Vec.dot(normal, tangent(hi % turn)) > 0))
        return `the child rail is tangent to or reverses its source switch ${from} to ${to}`;
      const offset: number = Vec.dot(A.normal, A.point) - Vec.dot(B.normal, B.point);
      crossings.push({ sides: [from, to], phase: hi % turn,
        plane: { normal: Vec.scale(normal, 1 / magnitude), point: Vec.scale(normal, offset / (magnitude * magnitude)) },
      });
    }
    return { sites, crossings };
  }

  /** Compare the complete directed territorial cycle modulo its starting phase. */
  export function sameOrder(
    first: readonly IAutoMovieConstructionSplitBand.IRailCrossing[],
    second: readonly IAutoMovieConstructionSplitBand.IRailCrossing[],
  ): boolean {
    return first.length === second.length && (first.length === 0 || second.some((_, start): boolean =>
      first.every(({ sides: [from, to] }, k): boolean => {
        const [a, b] = second[(start + k) % second.length]!.sides;
        return a === from && b === to;
      }),
    ));
  }

  /**
   * The outward planes select the rail's actual arcs. A root where their
   * ordered signed distances exchange determines the corresponding fork.
   * Match feature boundaries first, then arclength inside each span.
   *
   * @see https://doi.org/10.1016/S0010-4485(98)00040-2 Feature-based contour matching interpolates by proportional length between corresponding boundaries.
   * @see https://doi.org/10.1145/142920.134001 A monotone feature matching keeps order and minimizes shape distortion. The correspondence here uses known feature provenance, not estimated polygon corners.
   */
  export function marks(
    source: IAutoMovieConstructionSplitCompose.IDerived["railPlanes"][number],
    read: (phase: number) => V3,
    plan: readonly { label: number; columns: number; point: V3 }[],
    count: number,
    sign: 1 | -1,
    tangent?: (phase: number) => V3,
    prior?: readonly IAutoMovieConstructionSplitBand.IRailCrossing[],
  ): IAutoMovieConstructionSplitBand.IGuidedRail | string {
    const prepared = switches(source, read, count, tangent);
    if (typeof prepared === "string") return prepared;
    const { sites, crossings } = prepared;
    const points: V3[] = sites.map(({ point }): V3 => point);
    const { shift } = source;
    const turn: number = 2 * Math.PI;
    if (prior !== undefined && !sameOrder(prior, crossings))
      return "the child rail relocation changes the order of its source switches";
    // A child shaft can already stand completely beyond a shifted seam, so
    // its rail has no crossing to inherit. Match those missing stations to
    // the owner's forks carried by the same physical translation as the
    // planes. Minimum squared displacement under cyclic order keeps the
    // rail's actual winding and exact observed switches.
    for (const { phase } of crossings) {
      const wrapped: number = phase % turn;
      if (!sites.some((site): boolean => site.phase === wrapped)) sites.push({ phase: wrapped, point: read(wrapped) });
    }
    sites.sort((a, b): number => sign * (a.phase - b.phase));
    const possible = plan.map((stretch, j): IAutoMovieConstructionSplitBand.IRailCrossing[] => {
      const previous: number = plan[(j + plan.length - 1) % plan.length]!.label;
      return crossings.filter(({ sides: [from, to] }): boolean => sign === 1
        ? from === previous && to === stretch.label
        : to === previous && from === stretch.label);
    });
    const costs: number[][] = plan.map((stretch, j): number[] => {
      const matches = possible[j]!;
      const expected: V3 = Vec.add(stretch.point, shift);
      return sites.map(({ phase, point }): number => {
        if (matches.length !== 0 && !matches.some((crossing): boolean => crossing.phase === phase)) return Infinity;
        const delta: V3 = Vec.sub(point, expected);
        return Vec.dot(delta, delta);
      });
    });
    const n: number = sites.length;
    let least: number = Infinity;
    let chosen: number[] = [];
    for (let a: number = 0; a < n; ++a) {
      if (!Number.isFinite(costs[0]![a])) continue;
      let previous: Float64Array = new Float64Array(n).fill(Infinity);
      previous[0] = costs[0]![a]!;
      const links: Int32Array[] = [];
      for (const cost of costs.slice(1)) {
        const next: Float64Array = new Float64Array(n).fill(Infinity);
        const parents: Int32Array = new Int32Array(n).fill(-1);
        let best: number = -1;
        for (let offset: number = 1; offset < n; ++offset) {
          if (best < 0 || previous[offset - 1]! < previous[best]!) best = offset - 1;
          next[offset] = previous[best]! + cost[(a + offset) % n]!;
          parents[offset] = best;
        }
        links.push(parents);
        previous = next;
      }
      for (let k: number = 1; k < n; ++k) {
        if (!(previous[k]! < least)) continue;
        least = previous[k]!;
        let at: number = k;
        const found: number[] = [at];
        for (const layer of [...links].reverse()) {
          at = layer[at]!;
          found.push(at);
        }
        chosen = found.reverse().map((offset): number => a + offset);
      }
    }
    if (chosen.length !== plan.length) return "the child rail's exact changes are out of loop order";
    let column: number = 0;
    const marks = chosen.map((index, j) => {
      const native: number = sites[index % n]!.phase;
      const phase: number = native + sign * turn * Math.floor(index / n);
      const crossing = possible[j]!.find(({ phase }): boolean => phase === native);
      const mark = { column, phase, ...(crossing === undefined ? {} : { crossing }) };
      column += plan[j]!.columns;
      return mark;
    });
    return { marks, points, crossings };
  }
}
