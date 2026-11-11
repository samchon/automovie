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

    /**
     * Stations where the part closes in a point, before its first knot and past its last, mm; null leaves that end an open section. Between
     * the end knot and its tip every section coordinate falls to zero in the engine's pole parameter, the root of the distance to the tip, with
     * the end section's tangent angles and shoulders kept, so the cap is that section shrunk to a rounded point.
     */
    tips?: [number | null, number | null];
  }

  /**
   * Knots of a cap between its end section and its tip, besides those two. Where the tube's taper meets the cap's law the outlines' natural
   * cubics ripple, and the ripple falls by about 0.27 per knot; twelve leave 1e-7 of it at the pole, where a section is small enough for any
   * coordinate out of proportion to break its chain.
   */
  const CAP_KNOTS: number = 12;

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
  export function part(family: IFamily, stations: number[]): IAutoMovieViewPart {
    const read: (s: number) => number[] = reader(family);
    const chains: AutoMovieHumanConicSection.IChain[] = stations.map((s: number): AutoMovieHumanConicSection.IChain => AutoMovieHumanConicSection.resolve(read(s), family.layout));
    const count: number = chains[0]!.input.points.length;
    const guides: number[] = chains[0]!.guides;
    if (guides.length !== 4) throw new Error("the layout names " + guides.length + " engine guides instead of four");
    const [bottom, top]: [number | null, number | null] = family.tips ?? [null, null];

    // A coordinate is zero at a tip; an angle or a shoulder keeps the end section's value there.
    // Between an end and its tip the cap's own knots stand at equal steps of the root of the distance to the tip, each the end section scaled by
    // that root's share, so every coordinate of a cap section falls by one factor and the section stays the end section's shape.
    const cap = (end: number, tip: number, value: number, length: boolean, site: string): IAutoMovieViewPart.IKnot[] =>
      Array.from({ length: CAP_KNOTS + 1 }, (_: unknown, k: number): IAutoMovieViewPart.IKnot => {
        const share: number = k / (CAP_KNOTS + 1);
        return { site: site + "." + k, station: tip + (end - tip) * share * share, value: length ? value * share : value };
      });
    const closing = (pick: (chain: AutoMovieHumanConicSection.IChain) => number, length: boolean): IAutoMovieViewPart.IOutline => ({
      knots: [
        ...(bottom === null ? [] : cap(stations[0]!, bottom, pick(chains[0]!), length, "tip.bottom")),
        ...stations.map((station: number, i: number): IAutoMovieViewPart.IKnot => ({ site: "s" + i, station, value: pick(chains[i]!) })),
        ...(top === null ? [] : cap(stations.at(-1)!, top, pick(chains.at(-1)!), length, "tip.top").reverse()),
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
    return {
      name: family.name,
      axis: axis(family),
      stations: [...(bottom === null ? [] : [bottom]), ...stations, ...(top === null ? [] : [top])],
      ...(bottom === null && top === null ? {} : { pole: bottom === null ? ("top" as const) : top === null ? ("bottom" as const) : ("both" as const) }),
      front: { positive: coordinate(0, 0), negative: coordinate(2, 0) },
      side: { positive: coordinate(1, 1), negative: coordinate(3, 1) },
      fullness: { kind: "top", shoulders: quarters((q: number): IAutoMovieViewPart.IOutline => share((chain: AutoMovieHumanConicSection.IChain): number => chain.input.shoulders[guides[q]!]!)), touch: quarters((q: number): IAutoMovieViewPart.IOutline => coordinate(q, q % 2 === 0 ? 1 : 0)), pieces: quarters(pieces) },
      order: 32,
      samples: 128,
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
      ...(family.tips === undefined ? {} : { tips: [family.tips[0], family.tips[1]] as [number | null, number | null] }),
      ...(family.reliefs === undefined
        ? {}
        : {
            reliefs: family.reliefs.map((relief: IAutoMovieLoftRelief): IAutoMovieLoftRelief => {
              const turn: number = relief.phases[1] > 0 ? 2 * Math.PI : 0;
              const reverse = (net: number[]): number[] => net.map((_: number, i: number): number => net[i - (i % relief.columns) + relief.columns - 1 - (i % relief.columns)]!);
              return { ...relief, name: relief.name + ".mirror", phases: [turn - relief.phases[1], turn - relief.phases[0]], axis: flip(relief.axis), heights: reverse(relief.heights), ...(relief.shift === undefined ? {} : { shift: reverse(relief.shift) }) };
            }),
          }),
    };
  }

  /** Loft a family through the engine. */
  export function create(family: IFamily, stations: number[]): AutoMovieViewLoft.IResult {
    return AutoMovieViewLoft.create(part(family, stations));
  }
}
