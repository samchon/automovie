import { AutoMovieLoftChain, AutoMovieNaturalSpline, AutoMovieViewAxis, AutoMovieViewLoft, type IAutoMovieLoftRelief, type IAutoMovieViewPart } from "@automovie/engine";

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

    /**
     * Largest distance between two neighbouring phases at the part's widest section, mm; absent, `PHASE_MM`. A small part whose skin turns
     * within a few millimetres takes a finer pitch: at 4 mm the ear's thin rim was sampled by three phases and its edge drew a row of teeth.
     */
    pitch?: number;

    /**
     * Largest turn of a ring's tangent between two neighbouring phases, radians; absent, the phases are uniform. With it the phases are
     * spaced by how fast the rings turn as well as by `pitch`: at every phase the density is the most any ring asks there, its length over
     * `pitch` or its turn over this, so a sharp edge that only some sections have (a sole's) takes its phases close together where it
     * stands, and the rest of the part keeps its spacing. f1's leg on uniform phases set by its thigh's girth turned by up to 0.83 rad
     * between two of them round the forefoot's outer edge, which showed as level stripes.
     */
    turn?: number;
  }

  /**
   * One closed end of a part.
   *
   * Between `from` and `tip` the part is its section at `from` shrunk by one factor, with that section's tangent angles and shoulders kept. With
   * `t = d / H`, `d` the distance to the tip and `H` that of `from`, the factor is `g = sqrt(P(t))` for the cubic `P(t) = a t + b t^2 + c t^3`:
   * upright at the tip (`a > 0`, so `g` grows as `sqrt(t)`), 1 at `from`, leaving `from` at the wall's own taper `q = H mu` (`mu` the wall's
   * relative growth per millimetre away from the tip) and bending there as the wall bends (`g'' = k`, the wall's relative second derivative
   * times `H^2`), so the cap continues the wall without a crease in its slope or its curvature. Those three conditions at `t = 1`, `P = 1`,
   * `P' = 2 q` and `P'' = 2 q^2 + 2 k`, give `c = (1 - q)^2 + k`, `b = 2 q - 1 - 2 c` and `a = 1 - b - c = 2 (1 - q) + c`; `c` is held at 0
   * or more, which keeps `P` positive on the cap. With `c = 0` this is the conic `P = 2 (1 - q) t + (2 q - 1) t^2`, which bends by
   * `-(1 - q)^2` at `from`: the earlier law, which met the slope of every wall but not its bend and left a ring round every finger's and toe's
   * tip, where the wall runs on straight.
   */
  export interface ITip {
    /** Station of the last section the fields own, between the first and the last knot, mm. */
    from: number;

    /** Station of the point, mm. */
    tip: number;

    /**
     * The end is not the figure's skin: buried inside another part, as a digit's root inside its limb, or under the digits merged onto it,
     * as a hand's or a foot's closed end. It closes as the conic (`c = 0`), the slimmest the law allows, instead of bending on as its wall
     * bends: the fuller cap brought the foot's end 5.9 mm below the sole and moved where the outer digits come out of their limbs' ends.
     */
    covered?: boolean;

    /**
     * How many rings the cap is meshed in between its first section and its tip; absent, one at each of its knots (`CAP_KNOTS`). A dome
     * turns its normal through a quarter turn over its rings, and twelve showed as a bullseye of flat bands on a toe's tip.
     */
    rings?: number;
  }

  /**
   * Knots of a cap between its end section and its tip, besides those two. Where the tube's taper meets the cap's law the outlines' natural
   * cubics ripple, and the ripple falls by about 0.27 per knot; twelve leave 1e-7 of it at the pole, where a section is small enough for any
   * coordinate out of proportion to break its chain.
   */
  const CAP_KNOTS: number = 12;

  /**
   * Bounds of a cap's taper `q` (`ITip`): below 1 the tip stands upright, and at 0 the cap leaves a wall that still widens toward its tip
   * level instead of widening on. Allowed to widen on (to -0.5), the nose's cap swelled 14 % past its bulb and the nostrils' cuts came out
   * through its sides: a cap that widens on extrapolates past the skin the wall was fitted to.
   */
  const TAPER: { least: number; most: number } = { least: 0, most: 0.95 };

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
    // times the cap's length, held to [TAPER.least, TAPER.most].
    const size = (s: number): number => {
      const chain: AutoMovieHumanConicSection.IChain = AutoMovieHumanConicSection.resolve(read(s), family.layout);
      return chain.guides.reduce((sum: number, g: number, q: number): number => sum + Math.abs(chain.input.points[g]![q % 2]), 0);
    };
    const taper = (end: ITip): number => {
      const inward: number = Math.sign(end.from - end.tip);
      return Math.min(TAPER.most, Math.max(TAPER.least, (size(end.from + inward) / size(end.from) - 1) * Math.abs(end.from - end.tip)));
    };

    // The wall's bend at a cap's first section in the cap's own measure: the second difference of the mean extent over millimetres away from
    // the tip, relative to the extent, times the square of the cap's length.
    const bend = (end: ITip): number => {
      const inward: number = Math.sign(end.from - end.tip);
      const [s0, s1, s2]: number[] = [0, 1, 2].map((k: number): number => size(end.from + k * inward));
      return ((s2! - 2 * s1! + s0!) / s0!) * (end.from - end.tip) ** 2;
    };

    // The cap's knots and its rings both stand at equal steps of the root of the distance to the tip, the engine's pole parameter.
    const capShares: number[] = Array.from({ length: CAP_KNOTS + 1 }, (_: unknown, k: number): number => k / (CAP_KNOTS + 1));

    // A coordinate is zero at a tip; an angle or a shoulder keeps the cap's first section's value there. Each cap knot is that section scaled
    // by the tip's factor (`ITip`).
    const cap = (end: ITip, value: number, length: boolean, site: string): IAutoMovieViewPart.IKnot[] => {
      const q: number = taper(end);
      const c: number = end.covered === true ? 0 : Math.max(0, (1 - q) ** 2 + bend(end));
      const b: number = 2 * q - 1 - 2 * c;
      const a: number = 1 - b - c;
      return capShares.map((x: number, k: number): IAutoMovieViewPart.IKnot => {
        const t: number = x * x;
        return { site: site + "." + k, station: end.tip + (end.from - end.tip) * t, value: length ? value * Math.sqrt(t * (a + t * (b + t * c))) : value };
      });
    };

    // The cap's rings: without them the engine meshed a cap from its first section straight to its pole, a cone ending in a flat disc.
    const rings = (end: ITip): number[] =>
      (end.rings === undefined ? capShares : Array.from({ length: end.rings + 1 }, (_: unknown, k: number): number => k / (end.rings! + 1))).slice(1).map((x: number): number => end.tip + (end.from - end.tip) * x * x);
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
    const made: IAutoMovieViewPart = {
      name: family.name,
      axis: axis(family),
      stations: [...(bottom === null ? [] : [bottom.tip, ...rings(bottom)]), ...stations, ...(top === null ? [] : [...rings(top).reverse(), top.tip])],
      ...(bottom === null && top === null ? {} : { pole: bottom === null ? ("top" as const) : top === null ? ("bottom" as const) : ("both" as const) }),
      front: { positive: coordinate(0, 0), negative: coordinate(2, 0) },
      side: { positive: coordinate(1, 1), negative: coordinate(3, 1) },
      fullness: { kind: "top", shoulders: quarters((q: number): IAutoMovieViewPart.IOutline => share((chain: AutoMovieHumanConicSection.IChain): number => chain.input.shoulders[guides[q]!]!)), touch: quarters((q: number): IAutoMovieViewPart.IOutline => coordinate(q, q % 2 === 0 ? 1 : 0)), pieces: quarters(pieces) },
      order: 32,
      samples: Math.max(48, 8 * Math.ceil(Math.max(girth / (family.pitch ?? PHASE_MM), (2 * Math.PI) / finest) / 8)),
      ...(family.reliefs === undefined || family.reliefs.length === 0 ? {} : { reliefs: family.reliefs }),
    };
    if (family.turn === undefined) return made;

    // Phases spaced by turn: read on the part's own lofted chain, whose phase is its sections' B-spline parameter, not their conics' polar
    // angle. Read on the conics, the phases of a flat section 40 by 5 mm clustered where its conics turn and its rings still turned by
    // 0.46 rad between two of them, against 0.1 asked.
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(made);
    if (loft.chain === null) return made;
    const phases: number[] = spaced(loft.chain, stations, family.pitch ?? PHASE_MM, family.turn, finest);
    return { ...made, samples: phases.length, phases };
  }

  /** Phases round a ring that `spaced` reads its length and turn on. */
  const SPACING_SAMPLES: number = 1024;

  /**
   * A part's ring phases spaced by its rings' length and turn (`IFamily.turn`).
   *
   * Every station's ring of the lofted chain is read at `SPACING_SAMPLES` phases. Over each step between two of them the density is the
   * largest any ring asks for: its chord over `pitch`, its turn there over `turn`, or the step over `finest`, the finest relief net's
   * column. The phases stand at equal shares of that density's integral from phase 0, a multiple of 8 of them and at least 48, as the
   * uniform rule's count is.
   *
   * @param chain The part lofted on uniform phases.
   * @param stations The stations its fields own, mm.
   * @param pitch Largest distance between neighbouring phases, mm.
   * @param turn Largest turn between neighbouring phases, radians.
   * @param finest Finest relief net's column, radians.
   */
  function spaced(chain: NonNullable<AutoMovieViewLoft.IResult["chain"]>, stations: readonly number[], pitch: number, turn: number, finest: number): number[] {
    const M: number = SPACING_SAMPLES;
    const step: number = (2 * Math.PI) / M;
    const density: number[] = new Array<number>(M).fill(step / finest);
    const unit = (a: readonly number[], b: readonly number[]): number[] => {
      const d: number[] = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
      const l: number = Math.hypot(d[0]!, d[1]!, d[2]!);
      return d.map((x: number): number => x / l);
    };
    for (const s of stations) {
      const ring: number[][] = Array.from({ length: M }, (_: unknown, j: number): number[] => AutoMovieLoftChain.point(chain, s, j * step));
      if (ring.some((p: number[]): boolean => !p.every(Number.isFinite))) continue;
      // Over the step from sample j to j + 1: its chord, and the larger of the turns at its two ends.
      const turns: number[] = ring.map((b: number[], j: number): number => {
        const [u, w]: number[][] = [unit(ring[(j + M - 1) % M]!, b), unit(b, ring[(j + 1) % M]!)];
        return Math.acos(Math.max(-1, Math.min(1, u[0]! * w[0]! + u[1]! * w[1]! + u[2]! * w[2]!)));
      });
      for (let j: number = 0; j < M; ++j) {
        const [b, c]: number[][] = [ring[j]!, ring[(j + 1) % M]!];
        const chord: number = Math.hypot(c[0]! - b[0]!, c[1]! - b[1]!, c[2]! - b[2]!);
        density[j] = Math.max(density[j]!, chord / pitch, Math.max(turns[j]!, turns[(j + 1) % M]!) / turn);
      }
    }
    const total: number = density.reduce((sum: number, x: number): number => sum + x, 0);
    const count: number = Math.max(48, 8 * Math.ceil(total / 8));
    const phases: number[] = [];
    let below: number = 0;
    for (let j: number = 0, k: number = 0; j < M && k < count; ++j) {
      // The phases whose share of the integral falls in this step, read linearly within it.
      while (k < count && (total * k) / count <= below + density[j]! + 1e-12) {
        phases.push((j + ((total * k) / count - below) / density[j]!) * step);
        ++k;
      }
      below += density[j]!;
    }
    return phases;
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
      layout: { mirror: false, anchors: anchors.map((_: AutoMovieHumanConicSection.IAnchor, j: number): AutoMovieHumanConicSection.IAnchor => anchors[(K - j) % K]!), ...(family.layout.least === undefined ? {} : { least: family.layout.least }) },
      knots: [...family.knots],
      values,
      ...(family.tips === undefined ? {} : { tips: [family.tips[0], family.tips[1]] as [ITip | null, ITip | null] }),
      ...(family.pitch === undefined ? {} : { pitch: family.pitch }),
      ...(family.turn === undefined ? {} : { turn: family.turn }),
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
