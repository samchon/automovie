import { AutoMovieNaturalSpline as S } from "../../../packages/engine/src/geometry/construction/AutoMovieNaturalSpline";
import { AutoMovieViewAxis } from "../../../packages/engine/src/geometry/construction/AutoMovieViewAxis";
import type { AutoMovieViewChain as Q } from "../../../packages/engine/src/geometry/construction/AutoMovieViewChain";
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

    /** Split depth of every quarter. */
    depth: number;

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
   * The supports and touch offsets go to the engine as the stored sparse
   * knots. The engine's split points, tangent angles and shoulders are not
   * stored: they are evaluated from the stored shares at every requested
   * station through `FamilyConicSection.input`, the same function the fit
   * used, and handed over as derived dense outlines.
   *
   * @param stored The authored definition.
   * @param stations Stations of the emitted layers and of the derived outlines, mm, increasing.
   */
  export function create(stored: IStored, stations: number[]): L.IResult {
    const sparse = (f: number): V.IOutline => ({ knots: stored.knots.map((station: number, m: number): V.IKnot => ({ site: "k" + m, station, value: stored.values[f]![m]! })) });
    const read: (s: number) => number[] = reader(stored);
    const sections: Q.IInput[] = stations.map((s: number): Q.IInput => C.input(read(s), stored.depth));
    const dense = (pick: (input: Q.IInput) => number): V.IOutline => ({ knots: stations.map((station: number, i: number): V.IKnot => ({ site: "d" + i, station, value: pick(sections[i]!) })) });
    const arcs: number = 2 ** stored.depth;
    const quarters = <X>(make: (q: number) => X): V.IQuarters<X> => [make(0), make(1), make(2), make(3)];
    const split = (q: number, j: number): V.ISplit => {
      const at: number = q * arcs + j;

      // Quarter q's tangents turn from its first guide's direction, (q + 1) pi / 2, by less than a quarter turn; one branch keeps the angle continuous along the station.
      const angle = (input: Q.IInput): number => {
        let value: number = Math.atan2(input.tangents[at]![1], input.tangents[at]![0]);
        while (value < ((q + 1) * Math.PI) / 2 - 1e-9) value += 2 * Math.PI;
        return value;
      };
      return { u: dense((input: Q.IInput): number => input.points[at]![0]), v: dense((input: Q.IInput): number => input.points[at]![1]), angle: dense(angle), shoulder: dense((input: Q.IInput): number => input.shoulders[at]!) };
    };
    const part: V = {
      name: stored.name,
      axis: axis(stored),
      stations,
      front: { positive: sparse(0), negative: sparse(1) },
      side: { positive: sparse(2), negative: sparse(3) },
      fullness: { kind: "top", shoulders: quarters((q: number): V.IOutline => (arcs > 1 ? dense((input: Q.IInput): number => input.shoulders[q * arcs]!) : sparse(8 + q))), touch: quarters((q: number): V.IOutline => sparse(4 + q)), ...(arcs > 1 ? { pieces: quarters((q: number): V.ISplit[] => Array.from({ length: arcs - 1 }, (_: unknown, j: number): V.ISplit => split(q, j + 1))) } : {}) },
      order: 32,
      samples: 128,
    };
    return L.create(part);
  }
}
