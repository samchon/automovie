import { AutoMovieLoftViewFullSource, AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanBoundSection, AutoMovieHumanConicLoft, AutoMovieHumanConicSection } from "@automovie/human";
import type { AutoMovieVector2Tuple, IAutoMovieLoftSectionJet } from "@automovie/interface";

/**
 * @evidence contracts/development/testing.md#behavioral-verification The original span owns nonradial bound coordinates in the native preview, raw point and solid surface source.
 * @evidence contracts/development/testing.md#independent-expectations The inherited ellipse in (s,phi) is a simple varying-station loop with two stations at some phases. Native radii are 2 at the protected mark and exactly 3 along the inherited boundary, irrespective of the sampled compatibility rings.
 * @evidence contracts/development/testing.md#distinguishing-cases The old unbound stock has radius 2 at the same hidden-source clocks. A replacement whose protected total2 changes is refused before publication.
 * @evidence contracts/development/testing.md#execution-ownership One made local source and a direct in-process loft.
 */
export function test_human_bound_original_section(): void {
  type P = AutoMovieVector2Tuple;
  const count = 16, turn = 2 * Math.PI, step = turn / count, protectedFrom = 7.25, mark = 8.5;
  const shares = new Array<number>(4).fill(Math.SQRT2 - 1);
  const family = {
    name: "bound.round", centres: [[0, 0, 0], [0, 10, 0]] as [[number, number, number], [number, number, number]],
    halves: [], up: [1, 0, 0] as [number, number, number], knots: [0, 5, 10],
    layout: AutoMovieHumanConicSection.limb(0), values: [2, 0, 0, 2, -2, 0, 0, -2, ...shares].map((x) => [x, x, x]),
  };
  const original = AutoMovieHumanConicLoft.part(family, [0, 3, 5, 7.5, mark, 10]);
  const point = (radius: number, p: number): P => [radius * Math.cos(p), radius * Math.sin(p)];
  const stock = {
    point: (_s: number, p: number): P => point(2, p),
    phase: (_s: number, p: number) => ({ p: point(2, p), t: point(2, p + Math.PI / 2), tt: point(-2, p) }),
    jet: (_s: number, p: number): IAutoMovieLoftSectionJet =>
      ({ ...stock.phase(_s, p), s: [0, 0], ss: [0, 0], st: [0, 0] }),
  };
  const boundary = (t: number) => {
    const s = 6 + Math.cos(t), p = 0.4 * Math.sin(t), d = 0.4 * Math.cos(t), dd = -p;
    const normal = point(3, p), tangent = point(3, p + Math.PI / 2);
    return { address: { point: [s, p] as P, first: [-Math.sin(t), d] as P, second: [-Math.cos(t), dd] as P },
      position: { point: normal, first: tangent.map((a) => a * d) as P,
        second: tangent.map((a, k) => a * dd - normal[k]! * d * d) as P } };
  };
  const zero = (): IAutoMovieLoftSectionJet => ({ p: [0, 0], s: [0, 0], t: [0, 0], ss: [0, 0], st: [0, 0], tt: [0, 0] });
  const arcs = Array.from({ length: count }, (_, i) => ({ clock: [(i - 1) * step, (i + 1) * step] as [number, number],
    along: (Math.abs(Math.sin(i * step)) > Math.abs(Math.cos(i * step)) ? 0 : 1) as 0 | 1, width: 0.05 }));
  const make = (support: typeof arcs) => AutoMovieHumanBoundSection.create({
    name: "bound.round", domain: [0, mark], protectedFrom, stock, boundary, arcs: support, guide: zero,
  });
  const span = make(arcs);
  // The station derivative of 6 + cos(clock) changes sign inside the first arc.
  const folds = [{ ...arcs[0]!, along: 0 as const }, ...arcs.slice(1)];
  let refusal: string = "";
  try { make(folds); } catch (error: unknown) { refusal = error instanceof Error ? error.message : ""; }
  if (!refusal.includes("no directed transverse inverse") || !refusal.includes('"along":0') ||
      !refusal.includes('"clock":0') || !refusal.includes('"second":[-1,0]'))
    throw new Error("a stationary original address did not retain its analytic failing clock and jets");
  const actual = { ...original, originalSection: span };
  const direct = AutoMovieLoftViewFullSource.create(actual), old = AutoMovieLoftViewFullSource.create(original);
  const loft = AutoMovieViewLoft.create(actual), surface = loft.surface;
  if (surface === null || loft.chain?.originalSection !== span || !loft.original?.every((row) => row.field === span))
    throw new Error("the original field did not become the authority all the way through loft and preview: " + JSON.stringify(loft.diagnostics));
  const close = (a: readonly number[], b: readonly number[]): boolean =>
    a.length === b.length && a.every((v, i) => Math.abs(v - b[i]!) <= 1e-9);
  for (let i = 0; i < 2 * count; ++i) {
    const t = (i + 0.5) * step / 2, owner = boundary(t), [s, p] = owner.address.point;
    const [x, y] = owner.position.point, f = original.axis.at(s);
    const expected = f.origin.map((v, k) => v + x * f.u[k]! + y * f.v[k]!);
    if (!close(direct.point(s, p), expected) || !close(surface.jet(s, p).p, expected) || close(old.point(s, p), expected))
      throw new Error("the actual owner did not bind a held angle reversal in both source readers");
    const a = span.jet(s, p), [ds, dp] = owner.address.first, [dds, ddp] = owner.address.second;
    const first = a.s.map((v, k) => ds * v + dp * a.t[k]!);
    const second = a.ss.map((v, k) => ds * ds * v + 2 * ds * dp * a.st[k]! + dp * dp * a.tt[k]! + dds * a.s[k]! + ddp * a.t[k]!);
    if (!close(first, owner.position.first) || !close(second, owner.position.second))
      throw new Error("the analytic child chart derivatives do not differentiate the original master");
    if (!Object.keys(old.jet(mark, p)).every((k) => {
      const key = k as keyof ReturnType<typeof old.jet>;
      return close(surface.jet(mark, p)[key], old.jet(mark, p)[key]);
    })) throw new Error("the original protected source has changed");
  }
  const wrong = { ...span, jet: (s: number, p: number) => s === mark ? { ...span.jet(s, p), ss: [1, 0] as P } : span.jet(s, p) };
  if (AutoMovieViewLoft.create({ ...actual, originalSection: wrong }).chain !== null)
    throw new Error("an original span changed a protected second derivative and was still admitted");
}
