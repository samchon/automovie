import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionPort,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { AutoMovieIllinois } from "./AutoMovieIllinois";

/**
 * Pass one cross meridian through an interior world guide. One scalar degree
 * of freedom is sufficient because the guide's section coordinate is kept.
 * The degree-six cross term is the lowest nonzero polynomial with value, first
 * and second derivative zero at both ends. The cubed positive cosine lends the
 * guide to its facing half turn and joins the opposite half with the same jets.
 *
 * @see https://doi.org/10.1002/nme.1620070405 Boundary-aligned interpolation.
 */
export function AutoMovieConstructionPortMeridian(
  surface: IAutoMovieSolidSurface,
  guide: IAutoMovieConstructionPort.IMeridian,
  scale: number,
  tolerance: number,
): IAutoMovieSolidSurface | string {
  const { domain, period } = surface;
  if (
    domain === undefined ||
    period === undefined ||
    !(Number.isFinite(period) && period > 0 && domain[0] < domain[1])
  )
    return "the guided meridian needs a finite periodic source range";
  const [from, to] = domain;
  const length: number = to - from;
  const rate: number = (2 * Math.PI) / period;
  const section: number = guide.section.value * scale;
  const read = (u: number) => ({ u, point: surface.jet(u, guide.clock).p });
  const residual = ({ point }: ReturnType<typeof read>): number =>
    point[guide.section.axis] - section;
  const anchor = AutoMovieIllinois.select(
    read,
    residual,
    [from, read(from)],
    [to, read(to)],
    tolerance,
    64,
  );
  if (
    anchor === null ||
    !(anchor.u > from && anchor.u < to) ||
    Math.abs(residual(anchor)) > tolerance
  )
    return "the cross meridian does not bracket its guide inside both boundaries";
  const t: number = (anchor.u - from) / length;
  const axis: 0 | 1 | 2 = guide.through.axis;
  const amplitude: number =
    (guide.through.value * scale - anchor.point[axis]) / (t * (1 - t)) ** 3;
  if (!Number.isFinite(amplitude)) return "the meridian guide is nonfinite";
  const add = (value: AutoMovieVector3Tuple, change: number): AutoMovieVector3Tuple => {
    const result: AutoMovieVector3Tuple = [...value];
    result[axis] += change;
    return result;
  };
  return {
    name: surface.name,
    orientation: surface.orientation,
    domain,
    period,
    jet(u: number, v: number): IAutoMovieSolidSurface.IJet {
      const jet: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
      const angle: number = (v - guide.clock) * rate;
      const c: number = Math.cos(angle);
      if (u === from || u === to || c <= 0) return jet;
      const w: number = (u - from) / length;
      const sin: number = Math.sin(angle);
      const q: number = w * (1 - w);
      const q1: number = 1 - 2 * w;
      const b: number = q ** 3;
      const bu: number = (3 * q * q * q1) / length;
      const buu: number = (6 * q * (q1 * q1 - q)) / (length * length);
      const a: number = amplitude * c ** 3;
      const av: number = -3 * amplitude * c * c * sin * rate;
      const avv: number = 3 * amplitude * c * (2 * sin * sin - c * c) * rate * rate;
      return {
        p: add(jet.p, a * b),
        u: add(jet.u, a * bu),
        v: add(jet.v, av * b),
        uu: add(jet.uu, a * buu),
        uv: add(jet.uv, av * bu),
        vv: add(jet.vv, avv * b),
      };
    },
  };
}
