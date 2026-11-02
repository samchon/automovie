import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanLimbFrame } from "./AutoMovieHumanLimbFrame";

/** Emit one section's complete two-jet from the same neighboring surface field. */
export namespace AutoMovieHumanSectionJets {
  /**
   * The three samples have distinct physical stations; `here` may be their
   * middle or endpoint. Lagrange differentiation handles the unequal spacing
   * after a curved source is mapped into its actual bone frame. Coefficients,
   * out-of-plane lift and every frame component use the same two derivatives.
   */
  export function layer(
    here: AutoMovieHumanLimbFrame.ISample,
    other: AutoMovieHumanLimbFrame.ISample,
    last: AutoMovieHumanLimbFrame.ISample,
    order: number,
  ): IAutoMovieHumanLoftChain.ILayer {
    const samples: AutoMovieHumanLimbFrame.ISample[] = [here, other, last].sort(
      (a: AutoMovieHumanLimbFrame.ISample, b: AutoMovieHumanLimbFrame.ISample): number => a.station - b.station,
    );
    const x: number[] = samples.map((sample: AutoMovieHumanLimbFrame.ISample): number => sample.station - here.station);
    if (!(x[1]! > x[0]! && x[2]! > x[1]!)) throw new Error("Section jets need three distinct physical stations");
    const values: number[][] = samples.map((sample: AutoMovieHumanLimbFrame.ISample): number[] => {
      const controls: ReturnType<typeof AutoMovieHumanLimbFrame.controls> = AutoMovieHumanLimbFrame.controls(sample, order);
      return [...controls.coefficients, ...controls.lift, ...sample.frame.origin, ...sample.frame.u, ...sample.frame.v];
    });
    const own: number[] = values[samples.indexOf(here)]!;
    const weights: number[][] = [[], []];
    for (let i: number = 0; i < 3; i++) {
      const j: number = (i + 1) % 3;
      const k: number = (i + 2) % 3;
      const denominator: number = (x[i]! - x[j]!) * (x[i]! - x[k]!);
      weights[0]!.push(-(x[j]! + x[k]!) / denominator);
      weights[1]!.push(2 / denominator);
    }
    const derivatives: number[][] = weights.map((weight: number[]): number[] => own.map(
      (_: number, k: number): number => weight.reduce((sum: number, w: number, i: number): number => sum + w * (values[i]![k]! - own[k]!), 0),
    ));
    const first: number[] = derivatives[0]!;
    const second: number[] = derivatives[1]!;
    const frame: (values: number[]) => AutoMovieHumanLoftFrame.IFrame = (values: number[]): AutoMovieHumanLoftFrame.IFrame => ({
      origin: [values[3 * order]!, values[3 * order + 1]!, values[3 * order + 2]!],
      u: [values[3 * order + 3]!, values[3 * order + 4]!, values[3 * order + 5]!],
      v: [values[3 * order + 6]!, values[3 * order + 7]! , values[3 * order + 8]!],
    });
    return {
      y: here.station, frame: here.frame,
      frameSlopes: frame(first), frameCurvatures: frame(second),
      coefficients: own.slice(0, 2 * order),
      slopes: first.slice(0, 2 * order), curvatures: second.slice(0, 2 * order),
      lift: own.slice(2 * order, 3 * order),
      liftSlopes: first.slice(2 * order, 3 * order), liftCurvatures: second.slice(2 * order, 3 * order),
    };
  }
}
