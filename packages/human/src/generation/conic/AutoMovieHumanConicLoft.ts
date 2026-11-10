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
  }

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
    const outline = (pick: (chain: AutoMovieHumanConicSection.IChain) => number): IAutoMovieViewPart.IOutline => ({ knots: stations.map((station: number, i: number): IAutoMovieViewPart.IKnot => ({ site: "s" + i, station, value: pick(chains[i]!) })) });
    const quarters = <X>(make: (q: number) => X): IAutoMovieViewPart.IQuarters<X> => [make(0), make(1), make(2), make(3)];

    // A tangent angle is kept on one branch along the station so its outline never jumps by a turn.
    const angle = (at: number): IAutoMovieViewPart.IOutline => {
      let previous: number = NaN;
      return outline((chain: AutoMovieHumanConicSection.IChain): number => {
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
        out.push({ u: outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.points[index]![0]), v: outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.points[index]![1]), angle: angle(index), shoulder: outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.shoulders[index]!) });
      }
      return out;
    };
    const coordinate = (q: number, axisIndex: 0 | 1): IAutoMovieViewPart.IOutline => outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.points[guides[q]!]![axisIndex]);
    return {
      name: family.name,
      axis: axis(family),
      stations,
      front: { positive: coordinate(0, 0), negative: coordinate(2, 0) },
      side: { positive: coordinate(1, 1), negative: coordinate(3, 1) },
      fullness: { kind: "top", shoulders: quarters((q: number): IAutoMovieViewPart.IOutline => outline((chain: AutoMovieHumanConicSection.IChain): number => chain.input.shoulders[guides[q]!]!)), touch: quarters((q: number): IAutoMovieViewPart.IOutline => coordinate(q, q % 2 === 0 ? 1 : 0)), pieces: quarters(pieces) },
      order: 32,
      samples: 128,
      ...(family.reliefs === undefined || family.reliefs.length === 0 ? {} : { reliefs: family.reliefs }),
    };
  }

  /** Loft a family through the engine. */
  export function create(family: IFamily, stations: number[]): AutoMovieViewLoft.IResult {
    return AutoMovieViewLoft.create(part(family, stations));
  }
}
