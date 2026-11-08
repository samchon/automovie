import type { IAutoMovieConstructionKnownPortSource, IAutoMovieSolidSurface } from "@automovie/engine";

type Vec3 = [number, number, number];
type IJet = IAutoMovieSolidSurface.IJet;
type IMap = IAutoMovieConstructionKnownPortSource.IMap;

/**
 * The hip-root band with a declared crease: the known port's partition of
 * unity between the trunk side `P` (transverse 0) and the leg side `Q`
 * (transverse 1), `B = P + h (Q - P)`, whose weight is the engine band's
 * quintic smoothstep `S(v) = 10 v^3 - 15 v^4 + 6 v^5` (C2 to both sides) on
 * most clocks and the cubic `C(v) = v^3` (C2 to the trunk, C0 to the leg)
 * where the gluteal sulcus stands: `h = (1 - w(c)) S(v) + w(c) C(v)`.
 *
 * The sulcus is the skin fold where the buttock tucks into the thigh; f1_trunk's
 * gluteal contour arrives at the fold horizontal (its lower-buttock law), so
 * the trunk-side surface meets the vertical thigh at an angle there: a crease
 * by its own contract (C0), not a defect. Its extent `w(c)` is 1 from the
 * back midline (clock 0, the natal cleft's end of the seam) to the buttock
 * apex's clock, falls to 0 over {@link IInput.transition} toward the lateral
 * side by the quintic smoothstep, and rises again to 1 over the same span
 * before the clock returns to the back midline along the seam (the
 * posteromedial thigh); elsewhere the band is C2 to both sides.
 *
 * Every derivative is the composition's own: each side's field read through
 * its map by the chain rule to second order, and the weight's clock and
 * transverse derivatives by the product rule. Chart: (transverse, clock),
 * as the engine's known-port surface.
 */
export namespace AutoMovieHumanLegHipBand {
  /** The band's sides and crease. */
  export interface IInput {
    /** Name in diagnostics. */
    name: string;

    /** Trunk-side field and its map from (clock, transverse). */
    parent: { field: IAutoMovieSolidSurface; map: IMap };

    /** Leg-side field and its map from (clock, transverse). */
    child: { field: IAutoMovieSolidSurface; map: IMap };

    /** The buttock apex's clock, radians: the crease runs from clock 0 to here at full weight. */
    apex: number;

    /** The crease's fall to C2 on each side, radians of clock. */
    transition: number;

    /** Outward sign of (transverse x clock). */
    orientation: 1 | -1;
  }

  /** The band surface. */
  export function create(input: IInput): IAutoMovieSolidSurface {
    const P: (c: number, v: number) => IJet = (c: number, v: number): IJet => compose(input.parent.field, input.parent.map, c, v);
    const Q: (c: number, v: number) => IJet = (c: number, v: number): IJet => compose(input.child.field, input.child.map, c, v);
    return {
      name: input.name,
      orientation: input.orientation,
      period: 2 * Math.PI,
      domain: [0, 1],
      jet(v: number, c: number): IJet {
        const p: IJet = P(c, v);
        const q: IJet = Q(c, v);
        const [w, w1, w2]: [number, number, number] = weight(c, input.apex, input.transition);
        const [s, s1, s2]: [number, number, number] = [10 * v ** 3 - 15 * v ** 4 + 6 * v ** 5, 30 * v ** 2 - 60 * v ** 3 + 30 * v ** 4, 60 * v - 180 * v ** 2 + 120 * v ** 3];
        const [k, k1, k2]: [number, number, number] = [v ** 3, 3 * v ** 2, 6 * v];
        const h: number = (1 - w) * s + w * k;
        const hv: number = (1 - w) * s1 + w * k1;
        const hvv: number = (1 - w) * s2 + w * k2;
        const hc: number = w1 * (k - s);
        const hcc: number = w2 * (k - s);
        const hcv: number = w1 * (k1 - s1);
        // In the kernel chart, u is the transverse v and v is the clock c.
        const D: Vec3 = sub(q.p, p.p);
        const Dv: Vec3 = sub(q.u, p.u);
        const Dc: Vec3 = sub(q.v, p.v);
        const Dvv: Vec3 = sub(q.uu, p.uu);
        const Dcv: Vec3 = sub(q.uv, p.uv);
        const Dcc: Vec3 = sub(q.vv, p.vv);
        return {
          p: add(p.p, scale(D, h)),
          u: add(add(p.u, scale(D, hv)), scale(Dv, h)),
          v: add(add(p.v, scale(D, hc)), scale(Dc, h)),
          uu: add(add(add(p.uu, scale(D, hvv)), scale(Dv, 2 * hv)), scale(Dvv, h)),
          uv: add(add(add(add(p.uv, scale(D, hcv)), scale(Dv, hc)), scale(Dc, hv)), scale(Dcv, h)),
          vv: add(add(add(p.vv, scale(D, hcc)), scale(Dc, 2 * hc)), scale(Dcc, h)),
        };
      },
    };
  }

  /** The crease weight and its first two clock derivatives. */
  export function weight(c0: number, apex: number, transition: number): [number, number, number] {
    const c: number = ((c0 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const fall: (x: number) => [number, number, number] = (x: number): [number, number, number] => {
      if (x <= 0) return [1, 0, 0];
      if (x >= 1) return [0, 0, 0];
      return [1 - (10 * x ** 3 - 15 * x ** 4 + 6 * x ** 5), -(30 * x ** 2 - 60 * x ** 3 + 30 * x ** 4), -(60 * x - 180 * x ** 2 + 120 * x ** 3)];
    };
    if (c <= apex) return [1, 0, 0];
    if (c <= apex + transition) {
      const [f, f1, f2]: [number, number, number] = fall((c - apex) / transition);
      return [f, f1 / transition, f2 / (transition * transition)];
    }
    if (c >= 2 * Math.PI - transition) {
      const [f, f1, f2]: [number, number, number] = fall((2 * Math.PI - c) / transition);
      return [f, -f1 / transition, f2 / (transition * transition)];
    }
    return [0, 0, 0];
  }

  /** A field read through its map, to second order: (clock, transverse) -> world, in the kernel's (transverse, clock) chart. */
  function compose(field: IAutoMovieSolidSurface, map: IMap, c: number, v: number): IJet {
    const m: IAutoMovieConstructionKnownPortSource.IJet | null = map.jet(c, v);
    if (m === null) throw new Error("A hip band map has no jet here");
    const f: IJet = field.jet(m.p[0], m.p[1]);
    const F: { p: Vec3; a: Vec3; b: Vec3; aa: Vec3; ab: Vec3; bb: Vec3 } = { p: vec(f.p), a: vec(f.u), b: vec(f.v), aa: vec(f.uu), ab: vec(f.uv), bb: vec(f.vv) };
    // Map derivatives: u = d/dclock, v = d/dtransverse; components [a, b] in the field's chart.
    const [ac, bc]: number[] = m.u;
    const [av, bv]: number[] = m.v;
    const [acc, bcc]: number[] = m.uu;
    const [acv, bcv]: number[] = m.uv;
    const [avv, bvv]: number[] = m.vv;
    const first: (x: number, y: number) => Vec3 = (x: number, y: number): Vec3 => add(scale(F.a, x), scale(F.b, y));
    const second: (x1: number, y1: number, x2: number, y2: number, x12: number, y12: number) => Vec3 = (x1: number, y1: number, x2: number, y2: number, x12: number, y12: number): Vec3 =>
      add(add(add(scale(F.aa, x1 * x2), scale(F.ab, x1 * y2 + x2 * y1)), scale(F.bb, y1 * y2)), first(x12, y12));
    return {
      p: F.p,
      u: first(av!, bv!),
      v: first(ac!, bc!),
      uu: second(av!, bv!, av!, bv!, avv!, bvv!),
      uv: second(av!, bv!, ac!, bc!, acv!, bcv!),
      vv: second(ac!, bc!, ac!, bc!, acc!, bcc!),
    };
  }
}

function vec(a: readonly number[]): Vec3 {
  return [a[0]!, a[1]!, a[2]!];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}
