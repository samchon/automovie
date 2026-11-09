import { type AutoMovieHumanHeadTape } from "./AutoMovieHumanHeadTape";
import { AutoMovieHumanHeadTapeSource } from "./AutoMovieHumanHeadTapeSource";

/** Actual unchanged ear attachment in the sagittal calibration-mm chart. */
type P2 = readonly [number, number];

/** A candidate is absent only when an explicit anatomical inequality rejects its plane. */
type Course = AutoMovieHumanHeadTape.ICourse;

/**
 * Posterior tape search at one explicitly supplied anterior brow-seat datum.
 * The personal brow seat is a placement convention, not inferred from the
 * circumference target. The lower boundary belongs to the actual upper-head
 * source; an optimum on that construction boundary remains unresolved.
 *
 * Each candidate is one complete course measurement on the native source
 * (`AutoMovieHumanHeadTapeSource.measure`), the expensive unit of this search,
 * so the search is organised to request as few of them as its resolution
 * allows.
 */
export namespace AutoMovieHumanHeadTapeBrow {
  /**
   * How the posterior anchor is searched.
   *
   * `complete` scans every original source station and knot midpoint of the
   * ownership interval and refines each observed local maximum: the search's
   * definition of the maximizing course. `continued` refines only the local
   * maximum next to a seed from a neighbouring member of the same source family,
   * and falls back to `complete` whenever the seed is not a local maximum of its
   * two neighbouring scan sites. A continued result is therefore a local
   * maximum; `AutoMovieHumanHeadTape.close` certifies its final member with
   * `complete` before publishing it.
   */
  export type Mode = "complete" | "continued";

  /**
   * Maximize the observed posterior course at a fixed original brow seat.
   *
   * A local maximum bracketed by two scan sites is refined by Brent's method
   * for a one-dimensional extremum without derivatives (R. P. Brent,
   * Algorithms for Minimization without Derivatives, 1973, ch. 5: golden-section
   * steps safeguarding successive parabolic interpolation). It replaces the
   * former pure golden-section refinement with the same termination: the
   * retained bracket is at most 1e-7 of the ownership span. Golden section
   * shrinks the bracket by 0.618 per measurement, about 33 measurements from a
   * two-site bracket; Brent's parabolic steps converge superlinearly near the
   * smooth maximum of the course length, and its golden safeguard keeps the
   * worst case near the golden-section count. Both locate the same local
   * maximum to that bracket; at the maximum the length is stationary, so the
   * course length differs between them by about half its second derivative
   * times the squared bracket, far below the closure's 1e-8 mm residual.
   * Inadmissible planes (below an ear attachment) read as minus infinity and
   * force golden steps, exactly as the comparisons of the former search did.
   */
  export function maximum(
    reader: AutoMovieHumanHeadTapeSource.IReader,
    first: number,
    brow: number,
    attachments: readonly P2[],
    seed?: readonly [number, number],
    mode: Mode = "complete",
  ): Course {
    if (
      !(
        reader.source.domain[0] <= first &&
        first < brow &&
        brow < reader.source.domain[1] &&
        attachments.every((point: P2): boolean => point.every(Number.isFinite))
      )
    )
      throw new Error(
        "Head brow tape has no ordered regular upper-source interval",
      );
    const span: number = brow - first;
    const cache: Map<number, Course | null> = new Map();
    let evaluations: number = 0;
    const evaluate: (back: number) => Course | null = (
      back: number,
    ): Course | null => {
      if (!(Number.isFinite(back) && back >= first && back <= brow))
        throw new Error(
          "Head brow tape candidate lies outside its upper-source ownership interval",
        );
      if (cache.has(back)) return cache.get(back)!;
      if (evaluations >= 512)
        throw new Error("Head brow tape numerical plane budget exhausted");
      evaluations++;
      const plane: AutoMovieHumanHeadTapeSource.IPlane =
        AutoMovieHumanHeadTapeSource.plane(reader, brow, back);
      if (
        attachments.some(
          (point: P2): boolean => plane.a + plane.b * point[0] < point[1],
        )
      ) {
        cache.set(back, null);
        return null;
      }
      // Candidates are compared by the one-panel-per-piece rule; the
      // published witness is re-measured by the former two-panel rule in
      // `finish`. Within one rule the error of each piece's Gauss-Legendre
      // rule is a smooth function of the plane, so comparing candidates by
      // the coarser rule moves the located maximum only by that error's
      // slope over the length's curvature there, and the published length
      // is the unchanged rule at the selected plane.
      const course: Course = {
        plane,
        ...AutoMovieHumanHeadTapeSource.measure(reader, plane, 1),
        coordinates: [0, (back - first) / span],
        resolution: 0,
        evaluations,
        unavailable: 0,
      };
      cache.set(back, course);
      return course;
    };
    let best: Course | null = null;
    const retain: (candidate: Course | null) => number = (
      candidate: Course | null,
    ): number => {
      if (
        candidate !== null &&
        (best === null || candidate.lengthMm > best.lengthMm)
      )
        best = candidate;
      return candidate?.lengthMm ?? -Infinity;
    };
    const knots: number[] = [
      ...new Set([
        first,
        brow,
        ...reader.part.stations.filter(
          (s: number): boolean => s > first && s < brow,
        ),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const grid: number[] = [
      ...new Set([
        ...knots,
        ...knots
          .slice(1)
          .map((s: number, i: number): number => (s + knots[i]!) / 2),
      ]),
    ].sort((a: number, b: number): number => a - b);

    // Continuation: the seed's neighbouring scan sites bracket the maximum
    // when the seed still beats both; any other outcome scans completely.
    if (mode === "continued" && seed !== undefined) {
      const target: number = first + seed[1] * span;
      const below: number | undefined = grid.filter((s: number): boolean => s < target).at(-1);
      const above: number | undefined = grid.find((s: number): boolean => s > target);
      if (below !== undefined && above !== undefined) {
        const centre: number = retain(evaluate(target));
        if (
          centre !== -Infinity &&
          centre >= retain(evaluate(below)) &&
          centre >= retain(evaluate(above))
        ) {
          refine(below, above);
          return finish();
        }
      }
    }
    const sites: number[] = [
      ...new Set([...grid, ...(seed === undefined ? [] : [first + seed[1] * span])]),
    ].sort((a: number, b: number): number => a - b);
    const coarse: (Course | null)[] = sites.map(evaluate);
    coarse.forEach(retain);
    for (let index: number = 0; index < sites.length; index++) {
      const candidate: Course | null = coarse[index]!;
      if (
        candidate === null ||
        candidate.lengthMm < (coarse[index - 1]?.lengthMm ?? -Infinity) ||
        candidate.lengthMm < (coarse[index + 1]?.lengthMm ?? -Infinity)
      )
        continue;
      refine(
        sites[Math.max(0, index - 1)]!,
        sites[Math.min(sites.length - 1, index + 1)]!,
      );
    }
    return finish();

    /** Brent's safeguarded parabolic search for the length maximum inside [low, high]. */
    function refine(low: number, high: number): void {
      // Minimize g = -length. The absolute tolerance makes the stopping test
      // |x - m| <= 2 tol - (b - a) / 2 imply b - a <= 4 tol = 1e-7 span, the
      // former golden-section resolution.
      const tolerance: number = 0.25e-7 * span;
      const golden: number = (3 - Math.sqrt(5)) / 2;
      const g: (x: number) => number = (x: number): number => -retain(evaluate(x));
      let a: number = low;
      let b: number = high;
      let x: number = a + golden * (b - a);
      let w: number = x;
      let v: number = x;
      let gx: number = g(x);
      let gw: number = gx;
      let gv: number = gx;
      let d: number = 0;
      let e: number = 0;
      for (let iteration: number = 0; iteration < 100; iteration++) {
        const m: number = (a + b) / 2;
        if (Math.abs(x - m) <= 2 * tolerance - (b - a) / 2) return;
        let parabolic: boolean = false;
        if (Math.abs(e) > tolerance && [gx, gw, gv].every(Number.isFinite)) {
          // Vertex of the parabola through (v, gv), (w, gw), (x, gx).
          const r: number = (x - w) * (gx - gv);
          let q: number = (x - v) * (gx - gw);
          let p: number = (x - v) * q - (x - w) * r;
          q = 2 * (q - r);
          if (q > 0) p = -p;
          q = Math.abs(q);
          const previous: number = e;
          e = d;
          if (Math.abs(p) < Math.abs(0.5 * q * previous) && p > q * (a - x) && p < q * (b - x)) {
            d = p / q;
            const u: number = x + d;
            if (u - a < 2 * tolerance || b - u < 2 * tolerance)
              d = m - x >= 0 ? tolerance : -tolerance;
            parabolic = true;
          }
        }
        if (!parabolic) {
          e = x >= m ? a - x : b - x;
          d = golden * e;
        }
        const u: number = Math.abs(d) >= tolerance ? x + d : x + (d >= 0 ? tolerance : -tolerance);
        const gu: number = g(u);
        if (gu <= gx) {
          if (u >= x) a = x;
          else b = x;
          v = w;
          gv = gw;
          w = x;
          gw = gx;
          x = u;
          gx = gu;
        } else {
          if (u < x) a = u;
          else b = u;
          if (gu <= gw || w === x) {
            v = w;
            gv = gw;
            w = u;
            gw = gu;
          } else if (gu <= gv || v === x || v === w) {
            v = u;
            gv = gu;
          }
        }
      }
      throw new Error("Head brow tape posterior search resolution unresolved");
    }

    /** Publish the best measured course with the existing boundary refusals. */
    function finish(): Course {
      const selected: Course | null = best as Course | null;
      if (selected === null)
        throw new Error(
          "No original upper-head brow course passes the actual ear attachments",
        );
      if (selected.coordinates[1] <= 2e-7)
        throw new Error(
          "Head brow tape maximum reaches its upper-head source ownership boundary",
        );
      return {
        ...selected,
        ...AutoMovieHumanHeadTapeSource.measure(reader, selected.plane, 2),
        evaluations,
        resolution: 1e-7,
      };
    }
  }
}
