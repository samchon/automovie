/**
 * A buried section across a cut, fitted only as a continuation of the part's
 * own tube. The collar joins each kept skin tangent back to that tube inside
 * the observed cross-section. An applicability flag on the dividing surface
 * has no role in deciding whether a curve fits inside that cross-section.
 */
export namespace FamilyConicClosure {
  /** Point or direction of a section chart, mm. */
  export type P = [number, number];

  /** Maximum phase step and maximum kept-tangent turn of an end chord, radians. */
  export const CONTINUED_STEP: number = Math.PI / 180;

  /** The actual uncut chart and the transported outline of the nearest whole section. */
  export interface ISupport {
    /** Uncut section in the current chart. */
    section: readonly P[];

    /** Tube section in the same polar chart. */
    tube: readonly P[];
  }

  const TURN: number = 2 * Math.PI;
  const ROUND: number = 64 * Number.EPSILON;
  const wrap = (phase: number): number => ((phase % TURN) + TURN) % TURN;
  const cross = (a: P, b: P): number => a[0] * b[1] - a[1] * b[0];
  const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
  const mix = (a: P, b: P, t: number): P => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  const angle = (p: P): number => Math.atan2(p[1], p[0]);
  const ray = (phase: number): P => [Math.cos(phase), Math.sin(phase)];
  const point = (phase: number, r: number): P => [r * Math.cos(phase), r * Math.sin(phase)];

  /** The directed edges of one closed outline. */
  function edges(loop: readonly P[]): [P, P][] {
    return loop.map((p: P, k: number): [P, P] => [p, loop[(k + 1) % loop.length]!]);
  }

  /** Where a line meets a finite edge, in both line and edge coordinates. */
  function meet(a: P, d: P, b: P, e: P): [number, number] | null {
    const den: number = cross(d, e);
    if (Math.abs(den) <= ROUND * Math.hypot(...d) * Math.hypot(...e)) return null;
    const q: P = sub(b, a);
    return [cross(q, e) / den, cross(q, d) / den];
  }

  /** Include boundary points within the rounding of the section coordinates. */
  function inside(p: P, boundary: readonly [P, P][], error: number): boolean {
    let contained: boolean = false;
    for (const [a, b] of boundary) {
      const e: P = sub(b, a);
      const q: P = sub(p, a);
      if (
        Math.abs(cross(e, q)) <= error * Math.hypot(...e) &&
        p[0] >= Math.min(a[0], b[0]) - error &&
        p[0] <= Math.max(a[0], b[0]) + error &&
        p[1] >= Math.min(a[1], b[1]) - error &&
        p[1] <= Math.max(a[1], b[1]) + error
      )
        return true;
      if ((a[1] > p[1]) !== (b[1] > p[1]) &&
        p[0] < a[0] + e[0] * (p[1] - a[1]) / e[1])
        contained = !contained;
    }
    return contained;
  }

  /**
   * Admit an entire segment. Every crossing of the polygon's boundary
   * partitions it into intervals of constant inside/outside status.
   */
  function segment(a: P, b: P, boundary: readonly [P, P][], error: number): boolean {
    if (!inside(a, boundary, error) || !inside(b, boundary, error)) return false;
    const d: P = sub(b, a);
    const marks: number[] = [0, 1];
    for (const [p, q] of boundary) {
      const hit: [number, number] | null = meet(a, d, p, sub(q, p));
      if (hit !== null && hit[0] > 0 && hit[0] < 1 && hit[1] >= -ROUND && hit[1] <= 1 + ROUND)
        marks.push(hit[0]);
    }
    marks.sort((p: number, q: number): number => p - q);
    return marks.slice(1).every((t: number, i: number): boolean =>
      inside(mix(a, b, (t + marks[i]!) / 2), boundary, error),
    );
  }

  /**
   * Continue the tube and preserve both kept endpoint tangents. A local
   * tangent launch is blended back to the tube in log radius with a quintic
   * weight. Choose the largest supported launch from each end up to the middle
   * of the opening. A missing support or tangent returns its own refusal.
   *
   * @param exit Where the kept skin leaves, mm from the course point.
   * @param leaving Direction of travel at the exit.
   * @param entry Where the kept skin comes back.
   * @param arriving Direction of travel at the entry.
   * @param tube Radius of the whole section in this chart, mm.
   * @param support Actual polygonal support, when reading a cut section.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A tangent line supplies the endpoint log value and rate. The quintic has zero slope at both collar ends, admitting the kept tangent and rejoining the tube with its own tangent.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare exact angular breakpoints, select the two local collars, and admit the emitted chords. Each end chord is refined to the declared angular resolution of its kept tangent.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unsupported pocket, launch or chord is refused without a detached chord or a limited derivative.
   * @evidence contracts/development/implementation.md#efficient-algorithms Polygon edge intersections are computed once for the opening, with bounded phase samples between their breakpoints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller supplies the whole outline and the original section it already cut.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the closure's points alone.
   * @evidence contracts/development/common.md#meaningful-documentation States the tube and chart premises, exact kept endpoint data and boundary test.
   */
  export function continued(
    exit: P,
    leaving: P,
    entry: P,
    arriving: P,
    tube: (phase: number) => number,
    support?: ISupport,
  ): P[] | string {
    const start: number = angle(exit);
    const gap: number = wrap(angle(entry) - start);
    if (!(gap > 0)) return "the opening spans no phase";
    const end: number = start + gap;
    const advancing = (p: P, direction: P): boolean =>
      cross(p, direction) > ROUND * Math.hypot(...p) * Math.hypot(...direction);
    if (!advancing(exit, leaving)) return "the kept skin's exit does not advance around the course";
    if (!advancing(entry, arriving)) return "the kept skin's entry does not advance around the course";
    if (!positive(tube(start)) || !positive(tube(end))) return "the whole section has no radius at the opening's ends";
    const boundary: [P, P][] = support === undefined ? [] : edges(support.section);
    const outline: [P, P][] = support === undefined ? [] : edges(support.tube);
    if (support !== undefined && (boundary.length < 3 || outline.length < 3))
      return "the opening has no uncut section and whole tube outlines";
    const error: number = ROUND * Math.max(1, ...(support?.section ?? []).map((p: P): number => Math.hypot(...p)));
    const fits = (a: P, b: P): boolean =>
      support === undefined || segment(a, b, boundary, error);
    const marks: number[] = [0, gap];
    const mark = (p: P): void => {
      const at: number = wrap(angle(p) - start);
      if (at > ROUND && at < gap - ROUND) marks.push(at);
    };
    for (const [a] of [...boundary, ...outline]) mark(a);
    for (const [a, b] of outline) {
      const d: P = sub(b, a);
      for (const [p, q] of boundary) {
        const hit: [number, number] | null = meet(a, d, p, sub(q, p));
        if (hit !== null && hit.every((t: number): boolean => t >= 0 && t <= 1))
          mark(mix(a, b, hit[0]));
      }
    }
    const ends: [P, P, number, 1 | -1][] = [
      [exit, leaving, start, 1], [entry, arriving, end, -1],
    ];
    for (const [p, direction] of ends) {
      mark(direction);
      mark([-direction[0], -direction[1]]);
      for (const [a, b] of [...boundary, ...outline]) {
        const hit: [number, number] | null = meet(p, direction, a, sub(b, a));
        if (hit !== null && hit[1] >= 0 && hit[1] <= 1)
          mark(mix(a, b, hit[1]));
      }
    }
    const intervals: number[] = marks.sort((a: number, b: number): number => a - b)
      .filter((at: number, k: number): boolean => k === 0 || at - marks[k - 1]! > ROUND);
    if (intervals.slice(1).some((b: number, k: number): boolean => {
      const phase: number = start + (intervals[k]! + b) / 2;
      const radius: number = tube(phase);
      return !positive(radius) || !fits(point(phase, radius), point(phase, radius));
    }))
      return "the whole tube leaves the uncut section in the opening";

    const launches = ends.map(([p, direction, phase, sense]) => {
      const radius = (at: number): number => cross(p, direction) / cross(ray(at), direction);
      const r: number = Math.hypot(...p);
      const h: number = CONTINUED_STEP / 2;
      const difference: number = Math.log(tube(phase + h)) - Math.log(tube(phase - h));
      const rate: number = (p[0] * direction[0] + p[1] * direction[1]) / cross(p, direction);
      if (Math.abs(r - tube(phase)) <= ROUND * r && Math.abs(rate - difference / (2 * h)) <= ROUND)
        return { phase, sense, radius, width: 0 };
      const half: number = gap / 2;
      const ordered: number[] = intervals.map((at: number): number => sense === 1 ? at : gap - at)
        .filter((at: number): boolean => at > ROUND && at < half)
        .sort((a: number, b: number): number => a - b);
      let width: number = 0;
      for (const limit of [...ordered, half]) {
        const middle: number = phase + sense * (width + limit) / 2;
        const initial: number = radius(middle);
        const carried: number = tube(middle);
        if (
          !positive(initial) || !positive(carried) ||
          !fits(point(middle, initial), point(middle, carried))
        )
          break;
        width = limit;
      }
      return { phase, sense, radius, width: width > ROUND ? width : -1 };
    });
    const incompatible: number = launches.findIndex(({ width }): boolean => width < 0);
    if (incompatible >= 0)
      return "the kept " + (incompatible === 0 ? "exit" : "entry") + " tangent has no supported collar";

    const count: number = Math.max(2, Math.ceil(gap / CONTINUED_STEP));
    const sample: number[] = Array.from({ length: count + 1 }, (_, k: number): number => gap * k / count);
    if (support !== undefined) sample.push(...intervals);
    for (const { phase, sense, width } of launches)
      if (width > 0) {
        sample.push(phase - start + sense * width / 2);
        sample.push(phase - start + sense * width);
      }
    sample.sort((a: number, b: number): number => a - b);
    const value = (at: number): P | string => {
      const phase: number = start + at;
      const carried: number = tube(phase);
      if (!positive(carried)) return "the whole section has no radius inside the opening";
      const joined = launches.find(({ phase: endPhase, sense, width }): boolean =>
        (phase - endPhase) * sense < width,
      );
      let radius: number = carried;
      if (joined !== undefined) {
        const t: number = (phase - joined.phase) * joined.sense / joined.width;
        const weight: number = 1 - t * t * t * (10 + t * (-15 + 6 * t));
        const launch: number = joined.radius(phase);
        if (!positive(launch)) return "the tangent launch has no positive radius";
        radius = Math.exp(Math.log(carried) + weight * Math.log(launch / carried));
      }
      return point(phase, radius);
    };
    const samples: [number, P][] = [[0, exit]];
    for (const [i, at] of sample.entries()) {
      if (at <= ROUND || at >= gap - ROUND || (i > 0 && at - sample[i - 1]! <= ROUND)) continue;
      const p: P | string = value(at);
      if (typeof p === "string") return p;
      samples.push([at, p]);
    }
    samples.push([gap, entry]);

    for (const [endPoint, direction, , sense] of ends) {
      const [endAt, adjacent]: [number, [number, P]] =
        sense === 1 ? [0, samples[1]!] : [gap, samples.at(-2)!];
      let [at, p]: [number, P] = adjacent;
      while (true) {
        const chord: P = sense === 1 ? sub(p, endPoint) : sub(endPoint, p);
        const forward: number = chord[0] * direction[0] + chord[1] * direction[1];
        if (forward > 0 && Math.abs(Math.atan2(cross(direction, chord), forward)) <= CONTINUED_STEP)
          break;
        at = (endAt + at) / 2;
        if (Math.abs(endAt - at) <= ROUND)
          return "the kept " + (sense === 1 ? "exit" : "entry") + " tangent cannot be resolved by an emitted chord";
        const next: P | string = value(at);
        if (typeof next === "string") return next;
        p = next;
      }
      if (at !== adjacent[0]) samples.splice(sense === 1 ? 1 : samples.length - 1, 0, [at, p]);
    }
    const chain: P[] = samples.map(([, p]): P => p);
    if (!chain.slice(1).every((p: P, k: number): boolean => fits(chain[k]!, p)))
      return "an emitted closure chord leaves the uncut section";
    return chain.slice(1, -1);
  }

  function positive(radius: number): boolean {
    return Number.isFinite(radius) && radius > 0;
  }
}
