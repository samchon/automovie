import { AutoMovieHumanConicSection } from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanNail,
  IAutoMovieHumanSegmentFrame,
} from "@automovie/interface";

/** Closed-form skin and digit inputs shared by the nail law and placement scenarios. */
export namespace HumanNailFixture {
  /** Collect every failed observation from one timed scenario. */
  export function observations(): {
    failures: string[];
    near: (label: string, got: number, want: number, tolerance: number) => void;
    finish: () => void;
  } {
    const failures: string[] = [];
    const near = (label: string, got: number, want: number, tolerance: number): void => {
      if (!(Math.abs(got - want) <= tolerance)) failures.push(`${label}: ${got} against ${want} within ${tolerance}`);
    };
    const finish = (): void => {
      if (failures.length > 0) throw new Error("nail:\n" + failures.join("\n"));
    };
    return { failures, near, finish };
  }

  /** Build the analytic closing bar with its frame and nail proportions. */
  export function madeBar(): {
    high: number;
    broad: number;
    length: number;
    turned: number;
    fold: number;
    thickness: number;
    close: number;
    skin: (long: number) => IAutoMovieHumanNail.ISkin;
    proportions: IAutoMovieHumanNail.IProportions;
    segment: IAutoMovieHumanNail.IFrame;
  } {
    const [high, broad, length, turned, fold, thickness]: [number, number, number, number, number, number] = [2.5, 3.5, 10, 0.2, 0.46, 0.47];
    // The closing quarter circle is 4.6 mm long: short enough that the proximal fold stands on the straight bar (1.2 mm before its end), and long enough that three cells of the net (1.38 mm) before the tip the top has fallen 0.71 mm, over
    // the fold the relief needs there, so the plate's line is not raised and the frame stays unpitched.
    const close: number = 4.6;
    const root = (x: number): number => Math.sign(x) * Math.abs(x) ** 0.25;
    // The station solver queries one phase repeatedly. Reuse that exact angular section value.
    let lastPhase: number = NaN;
    let vertical: number = 0;
    let lateral: number = 0;
    const skin = (long: number): IAutoMovieHumanNail.ISkin => ({
      first: 0,
      tip: long + (close * Math.PI) / 2,
      point: (station: number, phase: number): number[] => {
        const turn: number = Math.max(0, station - long) / close;
        if (phase !== lastPhase) {
          lastPhase = phase;
          vertical = root(Math.cos(phase));
          lateral = root(Math.sin(phase));
        }
        const scale: number = Math.cos(turn);
        return [Math.min(station, long) + close * Math.sin(turn), high * scale * vertical, broad * scale * lateral];
      },
    });
    const proportions: IAutoMovieHumanNail.IProportions = { width: 0.7, aspect: 0.91, radius: 0.7, thickness, fold, lunula: 1, wrap: 1 };
    const segment: IAutoMovieHumanNail.IFrame = { origin: [0, 0, 0], distal: [1, 0, 0], dorsal: [0, Math.cos(turned), Math.sin(turned)] };
    return { high, broad, length, turned, fold, thickness, close, skin, proportions, segment };
  }

  /** Build the round source family and its displaced distal frame. */
  export function circularDigit(): {
    family: IAutoMovieHumanConicLoft.IFamily;
    posed: IAutoMovieHumanSegmentFrame;
  } {
    const family: IAutoMovieHumanConicLoft.IFamily = {
      name: "finger.index",
      centres: [[-40, 0, -6], [-40, 0, 24]],
      halves: [],
      up: [0, 1, 0],
      layout: AutoMovieHumanConicSection.limb(0),
      knots: [0, 7, 15, 23],
      values: [4, 0, 0, 4, -4, 0, 0, -4, ...new Array<number>(4).fill(Math.SQRT2 - 1)]
        .map((x: number): number[] => [x, x, x, x]),
      tips: [null, { from: 23, tip: 26 }],
    };
    const posed: IAutoMovieHumanSegmentFrame = { origin: [-40, 0, 0], axes: [[0, -1, 0], [0, 0, -1], [1, 0, 0]] };
    return { family, posed };
  }
}
