import { AutoMovieHumanPositivePairSolve } from "./AutoMovieHumanPositivePairSolve";

/**
 * A positive C2 hand-axis map through the wrist, middle-finger base and tip.
 * Landmark coordinates belong to the source surface; their distances belong to
 * the person's independent palm and hand measurements.
 */
export namespace AutoMovieHumanHandLongitudinal {
  /** Source-surface coordinates, in increasing order along the hand. */
  export interface ILandmarks {
    /** Owned wrist-crease station; clinical bony-landmark equivalence is not assumed. */
    wrist: number;

    /** Station where digit III separates from both neighbouring fingers. */
    base: number;

    /** Dactylion III station. */
    tip: number;
  }

  /** The axis map and its differential, in millimetres. */
  export interface IMap {
    /** Position relative to the owned wrist-crease station. */
    point: (station: number) => number;

    /** Positive local length scale. */
    slope: (station: number) => number;

    /** Derivative of the local length scale. */
    curvature: (station: number) => number;

    /** Source station at a mapped position. */
    inverse: (position: number) => number;
  }

  /** Independent final-surface distances from the owned wrist crease, mm. */
  export interface IMeasures {
    /** Distance to the middle-finger base. */
    palm: number;

    /** Distance to the middle fingertip. */
    length: number;
  }

  /**
   * Close projected surface lengths after the hand's transverse axes move.
   * The observer supplies final geometry distances, not the map's anchor values.
   * Solving palm and finger spans as positive controls preserves their order.
   */
  export function fit(source: ILandmarks, wanted: IMeasures, observe: (map: IMap) => IMeasures): IMap {
    const controls: AutoMovieHumanPositivePairSolve.Pair = AutoMovieHumanPositivePairSolve.solve(
      [wanted.palm, wanted.length - wanted.palm],
      [wanted.palm, wanted.length - wanted.palm],
      ([palm, finger]: AutoMovieHumanPositivePairSolve.Pair): AutoMovieHumanPositivePairSolve.Pair => {
        const measured: IMeasures = observe(create(source, palm, palm + finger));
        return [measured.palm, measured.length - measured.palm];
      },
    );
    return create(source, controls[0], controls[0] + controls[1]);
  }

  /**
   * Interpolate independent measured endpoints without fitted length ratios.
   * Each quintic span has the same positive endpoint slope and zero endpoint
   * curvature. The slope is the lesser secant, making all six Bernstein control
   * ordinates ordered and therefore excluding folds and endpoint overshoots.
   */
  export function create(source: ILandmarks, palm: number, length: number): IMap {
    if (
      ![source.wrist, source.base, source.tip, palm, length].every(Number.isFinite) ||
      !(source.wrist < source.base && source.base < source.tip && palm > 0 && length > palm)
    )
      throw new Error("Hand landmarks and measured lengths must increase");

    const x: readonly number[] = [source.wrist, source.base, source.tip];
    const y: readonly number[] = [0, palm, length];
    const slope: number = Math.min(palm / (x[1]! - x[0]!), (length - palm) / (x[2]! - x[1]!));

    /** Read the quintic span or its linear continuation through the wrist/tip. */
    const read: (station: number, derivative: 0 | 1 | 2) => number = (station: number, derivative: 0 | 1 | 2): number => {
      if (station <= x[0]!) return derivative === 0 ? (station - x[0]!) * slope : derivative === 1 ? slope : 0;
      if (station >= x[2]!) return derivative === 0 ? y[2]! + (station - x[2]!) * slope : derivative === 1 ? slope : 0;
      const i: number = station <= x[1]! ? 0 : 1;
      const span: number = x[i + 1]! - x[i]!;
      const t: number = (station - x[i]!) / span;
      const remainder: number = y[i + 1]! - y[i]! - slope * span;
      if (derivative === 1) return slope + remainder * 30 * t * t * (1 - t) * (1 - t) / span;
      if (derivative === 2) return remainder * 60 * t * (1 - t) * (1 - 2 * t) / (span * span);
      return y[i]! + slope * (station - x[i]!) + remainder * t * t * t * (10 + t * (-15 + 6 * t));
    };

    return {
      point: (station: number): number => read(station, 0),
      slope: (station: number): number => read(station, 1),
      curvature: (station: number): number => read(station, 2),
      inverse: (position: number): number => {
        if (position <= 0) return x[0]! + position / slope;
        if (position >= length) return x[2]! + (position - length) / slope;
        let low: number = x[0]!;
        let high: number = x[2]!;
        for (let i: number = 0; i < 52; i++) {
          const middle: number = (low + high) / 2;
          if (read(middle, 0) < position) low = middle;
          else high = middle;
        }
        return (low + high) / 2;
      },
    };
  }
}
