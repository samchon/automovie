import { AutoMovieNaturalSpline as S } from "../../../packages/engine/src/geometry/construction/AutoMovieNaturalSpline";
import { AutoMovieViewAxis } from "../../../packages/engine/src/geometry/construction/AutoMovieViewAxis";
import { AutoMovieViewLoft as L } from "../../../packages/engine/src/geometry/construction/AutoMovieViewLoft";
import type { IAutoMovieViewPart as V } from "../../../packages/engine/src/geometry/construction/IAutoMovieViewPart";
import { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * A stored conic family and its regeneration through the engine's actual
 * view loft: the complete path from authored numbers to a surface, with no
 * observation in it.
 */
export namespace FamilyConicLoft {
  /** A point or direction, millimetres or unit, in absolute reference coordinates. */
  export type V3 = [number, number, number];

  /** The complete authored definition of one part. */
  export interface IStored {
    /** Chain name. */
    name: string;

    /** Course centres: the first end, the joints and the last end, mm. */
    centres: V3[];

    /** Half arclength of the turn at each interior centre, mm. */
    halves: number[];

    /** The chart's `u` direction at the first segment before it is squared to the course. */
    up: V3;

    /** The anchors every section is read through. */
    layout: C.ILayout;

    /** Shared station knots, arclength from the first centre, mm. */
    knots: number[];

    /** Knot values by `FamilyConicSection` field then knot. */
    values: number[][];
  }

  /** The part's course as the engine reads it. */
  export function axis(stored: Pick<IStored, "centres" | "halves" | "up">): AutoMovieViewAxis.IAxis {
    const made: AutoMovieViewAxis.IAxis | string = AutoMovieViewAxis.jointed(stored.centres, stored.halves, stored.up);
    if (typeof made === "string") throw new Error("course: " + made);
    return made;
  }

  /** The family's field vector at one station. */
  export function reader(stored: IStored): (s: number) => number[] {
    const splines: S.ISpline[] = stored.values.map((field: number[]): S.ISpline => S.create(stored.knots, field));
    return (s: number): number[] => splines.map((spline: S.ISpline): number => S.evaluate(spline, s));
  }

  /**
   * Build the engine's view part and loft it.
   *
   * The engine reads a section as four guides on its box with conic pieces
   * between them. Those guide coordinates, touch offsets, piece points,
   * tangent angles and shoulders are not stored: at every requested station
   * they are resolved from the stored fields through
   * `FamilyConicSection.resolve`, the same function the fit used, and handed
   * over as derived outlines with one knot per station.
   *
   * @param stored The authored definition.
   * @param stations Stations of the emitted layers and of the derived outlines, mm, increasing.
   */
  export function create(stored: IStored, stations: number[]): L.IResult {
    const read: (s: number) => number[] = reader(stored);
    const chains: C.IChain[] = stations.map((s: number): C.IChain => C.resolve(read(s), stored.layout));
    const count: number = chains[0]!.input.points.length;
    const guides: number[] = chains[0]!.guides;
    if (guides.length !== 4) throw new Error("the layout names " + guides.length + " engine guides instead of four");
    const outline = (pick: (chain: C.IChain) => number): V.IOutline => ({ knots: stations.map((station: number, i: number): V.IKnot => ({ site: "s" + i, station, value: pick(chains[i]!) })) });
    const quarters = <X>(make: (q: number) => X): V.IQuarters<X> => [make(0), make(1), make(2), make(3)];

    // A tangent angle is kept on one branch along the station so its outline never jumps by a turn.
    const angle = (at: number): V.IOutline => {
      let previous: number = NaN;
      return outline((chain: C.IChain): number => {
        let value: number = Math.atan2(chain.input.tangents[at]![1], chain.input.tangents[at]![0]);
        if (Number.isFinite(previous)) value += 2 * Math.PI * Math.round((previous - value) / (2 * Math.PI));
        previous = value;
        return value;
      });
    };
    const pieces = (q: number): V.ISplit[] => {
      const out: V.ISplit[] = [];
      for (let at: number = (guides[q]! + 1) % count; at !== guides[(q + 1) % 4]!; at = (at + 1) % count) {
        const index: number = at;
        out.push({ u: outline((chain: C.IChain): number => chain.input.points[index]![0]), v: outline((chain: C.IChain): number => chain.input.points[index]![1]), angle: angle(index), shoulder: outline((chain: C.IChain): number => chain.input.shoulders[index]!) });
      }
      return out;
    };
    const coordinate = (q: number, axisIndex: 0 | 1): V.IOutline => outline((chain: C.IChain): number => chain.input.points[guides[q]!]![axisIndex]);
    const part: V = {
      name: stored.name,
      axis: axis(stored),
      stations,
      front: { positive: coordinate(0, 0), negative: coordinate(2, 0) },
      side: { positive: coordinate(1, 1), negative: coordinate(3, 1) },
      fullness: { kind: "top", shoulders: quarters((q: number): V.IOutline => outline((chain: C.IChain): number => chain.input.shoulders[guides[q]!]!)), touch: quarters((q: number): V.IOutline => coordinate(q, q % 2 === 0 ? 1 : 0)), pieces: quarters(pieces) },
      order: 32,
      samples: 128,
    };
    return L.create(part);
  }
}
