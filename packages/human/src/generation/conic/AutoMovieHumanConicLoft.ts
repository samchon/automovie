import { AutoMovieNaturalSpline, AutoMovieViewAxis, AutoMovieViewLoft, type IAutoMovieLoftRelief, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanConicSection } from "./AutoMovieHumanConicSection";

/**
 * A conic family as it is authored, and its generation through the engine's
 * view loft.
 *
 * A family is one part's tape wall: along a jointed course every section is
 * an `AutoMovieHumanConicSection` whose fields are natural cubics through
 * their values at a few shared station knots. Reliefs carry what lies inside
 * that wall. Nothing else defines the part's surface.
 */
export namespace AutoMovieHumanConicLoft {
  /** A point or direction in the figure's absolute frame: millimetres, forward +X, up +Y, left +Z. */
  export type V3 = [number, number, number];

  /** The complete authored definition of one part. */
  export interface IFamily {
    /** Chain name. */
    name: string;

    /** Course centres: the first end, the joints and the last end, mm. */
    centres: V3[];

    /** Half arclength of the turn at each interior centre, mm. */
    halves: number[];

    /** The chart's `u` direction at the first segment before it is squared to the course. */
    up: V3;

    /** The anchors every section is read through. */
    layout: AutoMovieHumanConicSection.ILayout;

    /** Shared station knots, arclength from the first centre, mm. */
    knots: number[];

    /** Knot values by section field then knot. */
    values: number[][];

    /** Reliefs composed onto the wall; absent means none. */
    reliefs?: IAutoMovieLoftRelief[];

    /** Where the part closes in a point, toward its first knot and toward its last; null leaves that end an open section. */
    tips?: [ITip | null, ITip | null];
  }

  /**
   * One closed end of a part.
   *
   * Between `from` and `tip` the part is its section at `from` shrunk by one factor, with that section's tangent angles and shoulders kept. The
   * factor is a conic in the plane of station and size: with `d` the distance to the tip and `H` that of `from`, `g^2 = A d + B d^2`, the ellipse
   * or hyperbola on the course that stands upright at the tip (`A > 0`), reaches 1 at `from` and leaves `from` at the wall's own taper there, so
   * the cap continues the wall without a crease. With `q = H mu`, `mu` the wall's relative growth per millimetre away from the tip, and
   * `x = sqrt(d / H)`, that is `g = x sqrt(2 (1 - q) + (2 q - 1) x^2)`; `q = 1/2` is the paraboloid.
   */
  export interface ITip {
    /** Station of the last section the fields own, between the first and the last knot, mm. */
    from: number;

    /** Station of the point, mm. */
    tip: number;
  }

  /**
   * Knots of a cap between its end section and its tip, besides those two. Where the tube's taper meets the cap's law the outlines' natural
   * cubics ripple, and the ripple falls by about 0.27 per knot; twelve leave 1e-7 of it at the pole, where a section is small enough for any
   * coordinate out of proportion to break its chain.
   */
  const CAP_KNOTS: number = 12;

  /**
   * When a station is added midway between two: the model's section there stands off the mean of the two by more than `length` mm in a point's
   * coordinate or by more than `share` in a tangent's angle, rad, or a shoulder. No interval is cut below `least` mm. At a tenth of these
   * tolerances nearly every interval was cut whatever spacing was asked for, and the body's skin held 580,000 triangles at any setting.
   */
  const REFINE: { length: number; share: number; least: number } = { length: 0.5, share: 0.05, least: 0.25 };

  /**
   * Largest distance between two neighbouring phases of a part's rings at its widest section, mm; a part has at least 48 phases. With 128
   * phases for every part the trunk's stood 4 mm apart at the head and 9 mm at the hips, wider than its relief nets' 2.5 to 3 mm, which showed
   * as steps, while a finger's stood half a millimetre apart.
   */
  const PHASE_MM: number = 4;

  /** The part's course as the engine reads it. */
  export function axis(family: Pick<IFamily, "centres" | "halves" | "up">): AutoMovieViewAxis.IAxis {
    const made: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(family.centres, family.halves, family.up);
    if (typeof made === "string") throw new Error("course: " + made);
    return made;
  }

  /** The family's field vector at one station. */
  export function reader(family: Pick<IFamily, "knots" | "values">): (s: number) => number[] {
    const splines: AutoMovieNaturalSpline.ISpline[] = family.values.map((field: number[]): AutoMovieNaturalSpline.ISpline => AutoMovieNaturalSpline.create(family.knots, field));
    return (s: number): number[] => splines.map((spline: AutoMovieNaturalSpline.ISpline): number => AutoMovieNaturalSpline.evaluate(spline, s));
  }

  /**
   * The engine's view part of a family.
   *
   * The engine reads a section as four guides on its box with conic pieces
   * between them. Those guide coordinates, touch offsets, piece points,
   * tangent angles and shoulders are not authored: at every requested
   * station they are resolved from the family's fields through
   * `AutoMovieHumanConicSection.resolve` and handed over as derived outlines
   * with one knot per station.
   *
   * @param family The authored definition.
   * @param stations Stations of the emitted layers and of the derived outlines, mm, increasing.
   */
  export function part(family: IFamily, requested: number[]): IAutoMovieViewPart {
    const read: (s: number) => number[] = reader(family);
    const [bottom, top]: [ITip | null, ITip | null] = family.tips ?? [null, null];

    // The fields own the stations between the caps; each cap starts on a station of its own.
    const owned: number[] = [
      ...(bottom === null ? [] : [bottom.from]),
      ...requested.filter((s: number): boolean => (bottom === null || s > bottom.from) && (top === null || s < top.from)),
      ...(top === null ? [] : [top.from]),
    ];

    // The engine reads every derived number between two stations by its own spline, not through the section model, so where the model's
    // section turns faster than that reading follows, the engine's chain loses an arc though the model's never does. Wherever the model's
    // section midway between two stations stands off the mean of their two by more than the tolerances, the midway station is added.
    const resolved: Map<number, AutoMovieHumanConicSection.IChain> = new Map();
    const at = (s: number): AutoMovieHumanConicSection.IChain => {
      let chain: AutoMovieHumanConicSection.IChain | undefined = resolved.get(s);
      if (chain === undefined) resolved.set(s, (chain = AutoMovieHumanConicSection.resolve(read(s), family.layout)));
      return chain;
    };
    const between = (a: number, b: number): number[] => {
      if (b - a <= 2 * REFINE.least) return [];
      const middle: number = (a + b) / 2;
      const [low, mid, high]: AutoMovieHumanConicSection.IChain[] = [at(a), at(middle), at(b)];
      const off: boolean = mid!.input.points.some((p: AutoMovieHumanConicSection.P, k: number): boolean => {
        const turn = (t: AutoMovieHumanConicSection.P): number => Math.atan2(t[1], t[0]);
        const swing: number = turn(high!.input.tangents[k]!) - turn(low!.input.tangents[k]!);
        const lean: number = turn(mid!.input.tangents[k]!) - turn(low!.input.tangents[k]!) - (swing - 2 * Math.PI * Math.round(swing / (2 * Math.PI))) / 2;
        return (
          Math.abs(p[0] - (low!.input.points[k]![0] + high!.input.points[k]![0]) / 2) > REFINE.length ||
          Math.abs(p[1] - (low!.input.points[k]![1] + high!.input.points[k]![1]) / 2) > REFINE.length ||
          Math.abs(lean - 2 * Math.PI * Math.round(lean / (2 * Math.PI))) > REFINE.share ||
          Math.abs(mid!.input.shoulders[k]! - (low!.input.shoulders[k]! + high!.input.shoulders[k]!) / 2) > REFINE.share
        );
      });
      return off ? [...between(a, middle), middle, ...between(middle, b)] : [];
    };
    const stations: number[] = owned.flatMap((s: number, i: number): number[] => (i === 0 ? [s] : [...between(owned[i - 1]!, s), s]));
    const chains: AutoMovieHumanConicSection.IChain[] = stations.map(at);
    const count: number = chains[0]!.input.points.length;
    const guides: number[] = chains[0]!.guides;
    if (guides.length !== 4) throw new Error("the layout names " + guides.length + " engine guides instead of four");

    // The wall's taper at a cap's first section: the relative growth of the mean of its four extents over a millimetre away from the tip,
    // times the cap's length, held to [0, 0.95] so the cap neither flares nor loses its upright tangent at the tip.
    const taper = (end: ITip): number => {
      const size = (s: number): number => {
        const chain: AutoMovieHumanConicSection.IChain = AutoMovieHumanConicSection.resolve(read(s), family.layout);
        return chain.guides.reduce((sum: number, g: number, q: number): number => sum + Math.abs(chain.input.points[g]![q % 2]), 0);
      };
      const inward: number = Math.sign(end.from - end.tip);
      return Math.min(0.95, Math.max(0, (size(end.from + inward) / size(end.from) - 1) * Math.abs(end.from - end.tip)));
    };

    // A coordinate is zero at a tip; an angle or a shoulder keeps the cap's first section's value there. The cap's own knots stand at equal
    // steps of the root of the distance to the tip, the engine's pole parameter, each that section scaled by the tip's conic factor.
    const cap = (end: ITip, value: number, length: boolean, site: string): IAutoMovieViewPart.IKnot[] => {
      const q: number = taper(end);
      return Array.from({ length: CAP_KNOTS + 1 }, (_: unknown, k: number): IAutoMovieViewPart.IKnot => {
        const x: number = k / (CAP_KNOTS + 1);
        return { site: site + "." + k, station: end.tip + (end.from - end.tip) * x * x, value: length ? value * x * Math.sqrt(2 * (1 - q) + (2 * q - 1) * x * x) : value };
      });
    };
    const closing = (pick: (chain: AutoMovieHumanConicSection.IChain) => number, length: boolean): IAutoMovieViewPart.IOutline => ({
      knots: [
        ...(bottom === null ? [] : cap(bottom, pick(chains[0]!), length, "tip.bottom")),
        ...stations.map((station: number, i: number): IAutoMovieViewPart.IKnot => ({ site: "s" + i, station, value: pick(chains[i]!) })),
        ...(top === null ? [] : cap(top, pick(chains.at(-1)!), length, "tip.top").reverse()),
      ],
    });
    const outline = (pick: (chain: AutoMovieHumanConicSection.IChain) => number): IAutoMovieViewPart.IOutline => closing(pick, true);
    const share = (pick: (chain: AutoMovieHumanConicSection.IChain) => number): IAutoMovieViewPart.IOutline => closing(pick, false);
    const quarters = <X>(make: (q: number) => X): IAutoMovieViewPart.IQuarters<X> => [make(0), make(1), make(2), make(3)];

    // A tangent angle is kept on one branch along the station so its outline never jumps by a turn.
    const angle = (at: number): IAutoMovieViewPart.IOutline => {
      let previous: number = NaN;
      return share((chain: AutoMovieHumanConicSection.IChain): number => {
        let value: number = Math.atan2(chain.input.tangents[at]![1], chain.input.tangents[at]![0]);
        if (Number.isFinite(previous)) value += 2 * Math.PI * Math.round((previous - value) / (2 * Math.PI));
        previous = value;
        return value;
      });
    };
    const pieces = (q: number): IAutoMovieViewPart.ISplit[] => {
      const out: IAutoMovieViewPart.ISplit[] = [];
      for (let at: number = (guides[q]! + 1) % count; at !== guides[(q + 1) % 4]!; at = (at + 1) % count) {
        const index: number = at;
        out.push({ u: outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.points[index]![0]), v: outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.points[index]![1]), angle: angle(index), shoulder: share((chain: AutoMovieHumanConicSection.IChain): number => chain.input.shoulders[index]!) });
      }
      return out;
    };
    const coordinate = (q: number, axisIndex: 0 | 1): IAutoMovieViewPart.IOutline => outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.points[guides[q]!]![axisIndex]);

    // Phases round the part: its widest section's girth, as the ellipse on its half extents (Ramanujan's perimeter), at `PHASE_MM` apart.
    const girth: number = Math.max(
      ...chains.map((chain: AutoMovieHumanConicSection.IChain): number => {
        const [a, b]: number[] = [0, 1].map((c: number): number => (Math.max(...chain.input.points.map((p: AutoMovieHumanConicSection.P): number => p[c]!)) - Math.min(...chain.input.points.map((p: AutoMovieHumanConicSection.P): number => p[c]!))) / 2);
        return Math.PI * (3 * (a! + b!) - Math.sqrt((3 * a! + b!) * (a! + 3 * b!)));
      }),
    );

    // And no farther apart than the finest relief net's columns, as the layers are cut to its rows: a net shows only what the rings sample.
    const finest: number = Math.min(Infinity, ...(family.reliefs ?? []).map((relief: IAutoMovieLoftRelief): number => (relief.phases[1] - relief.phases[0]) / (relief.columns - 3)));
    return {
      name: family.name,
      axis: axis(family),
      stations: [...(bottom === null ? [] : [bottom.tip]), ...stations, ...(top === null ? [] : [top.tip])],
      ...(bottom === null && top === null ? {} : { pole: bottom === null ? ("top" as const) : top === null ? ("bottom" as const) : ("both" as const) }),
      front: { positive: coordinate(0, 0), negative: coordinate(2, 0) },
      side: { positive: coordinate(1, 1), negative: coordinate(3, 1) },
      fullness: { kind: "top", shoulders: quarters((q: number): IAutoMovieViewPart.IOutline => share((chain: AutoMovieHumanConicSection.IChain): number => chain.input.shoulders[guides[q]!]!)), touch: quarters((q: number): IAutoMovieViewPart.IOutline => coordinate(q, q % 2 === 0 ? 1 : 0)), pieces: quarters(pieces) },
      order: 32,
      samples: Math.max(48, 8 * Math.ceil(Math.max(girth / PHASE_MM, (2 * Math.PI) / finest) / 8)),
      ...(family.reliefs === undefined || family.reliefs.length === 0 ? {} : { reliefs: family.reliefs }),
    };
  }

  /**
   * The family's twin across the median plane `z = 0`, as a family of its own.
   *
   * The course and the chart seed are reflected. A course's chart is `v = u x t`, so the reflected course charts the
   * reflected section with `v` negated, which also reverses its travel: the twin's anchors are the original's in reverse
   * order from the first, each extreme with its `v` negated, and the arc after the twin's anchor `j` is the original's arc
   * before its anchor `K - j`. A relief keeps its stations and heights and takes the negated phase window, the reflected
   * axis and its columns in reverse.
   *
   * @param family A family whose layout is not itself a mirror layout and has no inflection anchor.
   * @param name The twin's chain name.
   */
  export function mirror(family: IFamily, name: string): IFamily {
    const anchors: AutoMovieHumanConicSection.IAnchor[] = family.layout.anchors;
    const K: number = anchors.length;
    if (family.layout.mirror || anchors.some((anchor: AutoMovieHumanConicSection.IAnchor): boolean => anchor.kind === "i")) throw new Error("mirror: the layout of " + family.name + " cannot be reflected");
    const { at, shoulders }: { at: number[]; shoulders: number } = AutoMovieHumanConicSection.offsets(family.layout);
    const values: number[][] = [];
    for (let j: number = 0; j < K; ++j) {
      const k: number = (K - j) % K;
      const anchor: AutoMovieHumanConicSection.IAnchor = anchors[k]!;
      values.push([...family.values[at[k]!]!]);
      if (anchor.kind !== "m" && anchor.mid !== true) values.push(family.values[at[k]! + 1]!.map((v: number): number => -v));
    }
    for (let j: number = 0; j < K; ++j) values.push([...family.values[shoulders + (K - j - 1)]!]);
    const flip = (v: V3): V3 => [v[0], v[1], -v[2]];
    return {
      name,
      centres: family.centres.map(flip),
      halves: [...family.halves],
      up: flip(family.up),
      layout: { mirror: false, anchors: anchors.map((_: AutoMovieHumanConicSection.IAnchor, j: number): AutoMovieHumanConicSection.IAnchor => anchors[(K - j) % K]!) },
      knots: [...family.knots],
      values,
      ...(family.tips === undefined ? {} : { tips: [family.tips[0], family.tips[1]] as [ITip | null, ITip | null] }),
      ...(family.reliefs === undefined
        ? {}
        : {
            reliefs: family.reliefs.map((relief: IAutoMovieLoftRelief): IAutoMovieLoftRelief => {
              const turn: number = relief.phases[1] > 0 ? 2 * Math.PI : 0;
              const reverse = (net: number[]): number[] => net.map((_: number, i: number): number => net[i - (i % relief.columns) + relief.columns - 1 - (i % relief.columns)]!);
              return { ...relief, name: relief.name + ".mirror", phases: [turn - relief.phases[1], turn - relief.phases[0]], axis: flip(relief.axis), heights: reverse(relief.heights), ...(relief.shift === undefined ? {} : { shift: reverse(relief.shift) }),
                // The twin's phases run the other way, so its turning direction is the reflected one negated.
                ...(relief.turn === undefined ? {} : { turn: flip(relief.turn).map((x: number): number => -x) as [number, number, number] }),
              };
            }),
          }),
    };
  }

  /** Loft a family through the engine. */
  export function create(family: IFamily, stations: number[]): AutoMovieViewLoft.IResult {
    return AutoMovieViewLoft.create(part(family, stations));
  }
}
