import {
  type AutoMovieConstructionSplitCourses,
  AutoMovieIllinois,
} from "@automovie/engine";
import type { IAutoMovieSolidSurface as Surface } from "@automovie/interface";

import type { AutoMovieHumanPelvicSplit } from "./AutoMovieHumanPelvicSplit";

/** Register the true pelvic median to each held medial thigh arc. */
export namespace AutoMovieHumanPelvicRegistration {
  /** The original sewn boundary and both literal arc endpoints. */
  type Source = Exclude<
    ReturnType<typeof AutoMovieHumanPelvicSplit.source>,
    string
  >;

  /** Geometry of the already prepared original split courses. */
  type Courses = Exclude<
    ReturnType<typeof AutoMovieConstructionSplitCourses.prepare>,
    string
  >;

  /** A true receiving-field parameter and its exact physical correspondence. */
  export interface IRegistration {
    /** The held original point/two-jet, native address and its rate. */
    receive(t: number): { q: Surface.IJet; phase: number; rate: number };

    /** Invert the registration at one unchanged receiving address. */
    sourceAtChild(t: number): number;

    /** World AP coordinates of the two actual receiving endpoints. */
    physicalX: readonly [number, number];

    /** Read a held receiving point/two-jet at its physical AP coordinate. */
    atPhysicalX(x: number): Surface.IJet;
  }

  /**
   * Keep both exact fork correspondences and their original rates. Map the
   * original clock's projected saddle point to the same physical AP location on
   * the receiving contour. The three constraints are wearer-owned.
   *
   * @see https://doi.org/10.1137/0905021 Fritsch and Butland's two-secants derivative.
   */
  export function prepare(source: Source, raw: Courses): IRegistration[] {
    const first = source.guide.at(0).p[0];
    const last = source.guide.at(1).p[0];
    const apex = source.guide.at(0.5).p[0];
    const span = last - first;
    const xMid = (apex - first) / span;
    const turn = 2 * Math.PI;
    const wrap = (value: number) => ((value % turn) + turn) % turn;
    return raw.jets.map(({ edges }, owner) => {
      const { clock, station, field, part } = source.rails[owner]!;
      const inner = edges.find((edge) => edge.seam !== undefined);
      if (inner === undefined)
        throw new Error(`${part.name} has no original medial arc`);
      const endpoint = (t: number) => {
        const course = inner.course(t);
        return { p: course.controls.at(-1)!, native: course.phase };
      };
      const [front, back] = [endpoint(0), endpoint(1)].sort(
        (a, b) => (a.p[0] - b.p[0]) * Math.sign(span),
      ) as [ReturnType<typeof endpoint>, ReturnType<typeof endpoint>];
      const firstPhase = front.native;
      const nativeWidth = wrap(back.native - firstPhase);
      const nativeSpan =
        wrap(endpoint(0.5).native - firstPhase) < nativeWidth
          ? nativeWidth
          : nativeWidth - turn;
      const receivingSpan = back.p[0] - front.p[0];
      const qMid = (apex - front.p[0]) / receivingSpan;
      if (
        !(
          0 < xMid &&
          xMid < 1 &&
          0 < qMid &&
          qMid < 1 &&
          receivingSpan * span > 0 &&
          nativeSpan !== 0
        )
      )
        throw new Error(
          `${part.name} original median and receiving arcs are not homologous`,
        );
      const normalized = (t: number) => {
        const { p, d } = source.guide.at(t);
        const q = clock.read(clock.phase(p));
        const rate = clock.rate(p, d) / clock.rate(q.p, q.v);
        return {
          q,
          phase: q.phase,
          rate,
          x: (q.p[0] - front.p[0]) / receivingSpan,
          dx: (rate * q.v[0]) / receivingSpan,
        };
      };
      const composed = monotone(normalized(0.5).x, qMid);
      const point = field.pointAt(station);
      const tolerance =
        Number.EPSILON * Math.max(Math.abs(front.p[0]), Math.abs(back.p[0]));
      const receive = (x: number, dx: number) => {
        const target = front.p[0] + receivingSpan * x;
        const q =
          x === 0
            ? 0
            : x === 1
              ? 1
              : AutoMovieIllinois.root(
                  (u) => point(firstPhase + nativeSpan * u)[0] - target,
                  0,
                  1,
                  tolerance,
                  100,
                );
        if (q === null)
          throw new Error(
            `${part.name} has no original medial point at world X ${target}`,
          );
        const phase = firstPhase + nativeSpan * q;
        const j = field.jet(station, phase);
        return { q: j, phase, rate: (receivingSpan * dx) / j.v[0] };
      };
      return {
        physicalX: [front.p[0], back.p[0]],
        atPhysicalX: (x) => receive((x - front.p[0]) / receivingSpan, 0).q,
        receive(t) {
          const original = normalized(t);
          if (t === 0 || t === 1) return original;
          const [x, slope] = composed(original.x);
          return receive(x, slope * original.dx);
        },
        sourceAtChild(t) {
          if (t === 0 || t === 1) return t;
          const actual = normalized(t).x;
          const site = AutoMovieIllinois.root(
            (s) => composed(normalized(s).x)[0] - actual,
            0,
            1,
            Number.EPSILON,
            100,
          );
          if (site === null)
            throw new Error(
              `${part.name} has no original registered grid inverse at ${t}`,
            );
          return site;
        },
      };
    });
  }

  /** Fit only the one three-point clock, with unit endpoint derivatives. */
  function monotone(x: number, y: number) {
    const a = y / x;
    const b = (1 - y) / (1 - x);
    const aWeight = 2 - x;
    const bWeight = 1 + x;
    const middle = (aWeight + bWeight) / (aWeight / a + bWeight / b);
    const ranges = [
      [0, x, 0, y, 1, middle],
      [x, 1, y, 1, middle, 1],
    ] as const;
    const read = ranges.map(([x0, x1, y0, y1, r0, r1]) => {
      const h = x1 - x0;
      const B = (3 * (y1 - y0)) / h - r0 - r1;
      const c = r0 - 2 * B + r1;
      const live = (t: number) =>
        r0 * (1 - t) ** 2 + 2 * B * t * (1 - t) + r1 * t ** 2;
      const vertex = (r0 - B) / c;
      const minimum =
        c > 0 && vertex > 0 && vertex < 1 ? live(vertex) : Math.min(r0, r1);
      if (!(0 < minimum))
        throw new Error("The original pelvic correspondence does not advance");
      return (u: number): [number, number] => {
        if (u === x0) return [y0, r0];
        if (u === x1) return [y1, r1];
        const t = (u - x0) / h;
        return [y0 + h * t * (r0 + t * (B - r0 + (c * t) / 3)), live(t)];
      };
    });
    return (u: number) => read[u < x ? 0 : 1]!(u);
  }
}
