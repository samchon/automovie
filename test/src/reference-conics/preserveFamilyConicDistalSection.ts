import {
  AutoMovieLoftAdmissionError,
  AutoMovieLoftSectionNative as Native,
  AutoMovieLoftViewRead as Read,
  AutoMovieLoftViewSource as Source,
} from "@automovie/engine";
import type {
  IAutoMovieLoftSectionConnect,
  IAutoMovieViewPart,
  AutoMovieVector2Tuple as P2,
} from "@automovie/interface";

/**
 * Appending a pole changes the native length coordinate of capped outlines.
 * Keep the old source through its last preceding measured cut, then join the
 * cap source by the quintic Hermite step (both endpoint jets vanish). At each
 * phase this is a convex blend of two positive radii on the same ray. An
 * existing original section retains its own point and full jet wherever it is
 * active.
 */
export function preserveFamilyConicDistalSection(
  open: IAutoMovieViewPart,
  capped: IAutoMovieViewPart,
  retained: number,
  from: number,
): IAutoMovieLoftSectionConnect.IOriginal {
  const reader = (view: IAutoMovieViewPart) => {
    const prepared = Source.create(view);
    if (prepared?.source == null)
      throw new AutoMovieLoftAdmissionError(
        `No native cap field for ${view.name}`,
      );
    const scalar = Read.prepare(prepared.source);
    const original = view.originalSection;
    const active = (
      s: number,
    ): IAutoMovieLoftSectionConnect.IOriginal | undefined =>
      original !== undefined &&
      s >= original.domain[0] &&
      s < original.domain[1]
        ? original
        : undefined;
    return {
      point: (s: number, p: number) =>
        active(s)?.point(s, p) ?? Native.point(need(scalar.values(s)))(p),
      phase: (s: number, p: number) =>
        active(s)?.phase(s, p) ?? Native.phase(need(scalar.values(s)))(p),
      jet: (s: number, p: number) =>
        active(s)?.jet(s, p) ?? Native.jet(need(scalar.jets(s)))(p),
    };
  };
  const old = reader(open);
  const end = reader(capped);
  const need = <T>(value: T | string): T => {
    if (typeof value === "string") throw new AutoMovieLoftAdmissionError(value);
    return value;
  };
  const blend = (a: P2, b: P2, w: number): P2 => [
    a[0] + w * (b[0] - a[0]),
    a[1] + w * (b[1] - a[1]),
  ];
  const width: number = from - retained;
  const weight = (s: number): number => {
    const t: number = (s - retained) / width;
    return t ** 3 * (10 + t * (-15 + 6 * t));
  };
  return {
    name: open.name,
    domain: [open.stations[0]!, from],
    point: (s, p) => {
      if (s >= from) return end.point(s, p);
      const a = old.point(s, p);
      return s <= retained ? a : blend(a, end.point(s, p), weight(s));
    },
    phase: (s, p) => {
      if (s >= from) return end.phase(s, p);
      const a = old.phase(s, p);
      if (s <= retained) return a;
      const b = end.phase(s, p),
        w = weight(s);
      return {
        p: blend(a.p, b.p, w),
        t: blend(a.t, b.t, w),
        tt: blend(a.tt, b.tt, w),
      };
    },
    jet: (s, p) => {
      if (s >= from) return end.jet(s, p);
      const a = old.jet(s, p);
      if (s <= retained) return a;
      const b = end.jet(s, p),
        w = weight(s);
      const t: number = (s - retained) / width;
      const d: number = (30 * t ** 2 * (1 - t) ** 2) / width;
      const dd: number = (60 * t * (1 - t) * (1 - 2 * t)) / width ** 2;
      const product = (x: P2, y: P2, u: P2, v: P2): P2 => {
        const value: P2 = blend(x, y, w);
        return [value[0] + d * (v[0] - u[0]), value[1] + d * (v[1] - u[1])];
      };
      const ss: P2 = product(a.ss, b.ss, a.s, b.s);
      return {
        p: blend(a.p, b.p, w),
        t: blend(a.t, b.t, w),
        tt: blend(a.tt, b.tt, w),
        s: product(a.s, b.s, a.p, b.p),
        st: product(a.st, b.st, a.t, b.t),
        ss: [
          ss[0] + d * (b.s[0] - a.s[0]) + dd * (b.p[0] - a.p[0]),
          ss[1] + d * (b.s[1] - a.s[1]) + dd * (b.p[1] - a.p[1]),
        ],
      };
    },
  };
}
