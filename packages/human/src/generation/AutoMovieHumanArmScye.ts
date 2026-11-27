import { AutoMovieLoftChain } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmScye,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanBranchEvent,
  IAutoMovieHumanBranchSplit,
  IAutoMovieHumanLimbRootStrip,
  IAutoMovieLoftChain,
} from "@automovie/interface";

import { AutoMovieHumanLimbRootStrip } from "./AutoMovieHumanLimbRootStrip";
import { AutoMovieHumanHandSide } from "./AutoMovieHumanHandSide";
import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

const { mean, TWO_PI }: typeof AutoMovieHumanHandVector =
  AutoMovieHumanHandVector;
const { sided }: typeof AutoMovieHumanHandSide = AutoMovieHumanHandSide;

/**
 * The arm's scye: its arc of the shoulder ring, the bottom layer of the
 * shoulders' chain `upper` between the anterior and posterior axillary guides,
 * as the arm reads it in the left frame. The trunk owns the ring (the event
 * `upper` down, split `arm.<side>`) and publishes it here with its jet down
 * across the ring, which the arm's root strip copies.
 */
export namespace AutoMovieHumanArmScye {
  /** Samples of the arc. */
  const SAMPLES: number = 128;

  /**
   * Step of the one-sided differences of the shoulders' chain at its bottom
   * ring, calibration mm: three steps span under a millimetre, well inside the
   * chain's last station span, where its station spline is one cubic.
   */
  export const STEP: number = 0.25;

  /**
   * The arc of a side.
   *
   * @param calibration Calibration holding `upper` and its event.
   * @param side Side.
   * @returns The ring in the left frame.
   */
  export function of(
    calibration: IAutoMovieHumanBodyCalibration,
    side: "left" | "right",
  ): IAutoMovieHumanArmScye.IRing {
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const upper: IAutoMovieLoftChain | undefined = calibration.chains.find(
      (c: IAutoMovieLoftChain): boolean => c.name === "upper",
    );
    const event: IAutoMovieHumanBranchEvent | undefined =
      calibration.events.find(
        (e: IAutoMovieHumanBranchEvent): boolean =>
          e.parent === "upper" && e.direction === "down",
      );
    const split: IAutoMovieHumanBranchSplit | undefined = event?.splits.find(
      (s: IAutoMovieHumanBranchSplit): boolean => s.child === `arm.${side}`,
    );
    if (upper === undefined || split === undefined)
      throw new Error(`The shoulders hold no arc for arm.${side}`);

    const phases: number[] = split.arcs.flatMap(
      ([from, to]: [number, number]): number[] => {
        const span: number = to >= from ? to - from : to + TWO_PI - from;
        return Array.from(
          { length: SAMPLES },
          (_: unknown, i: number): number => from + (span * i) / SAMPLES,
        );
      },
    );
    const bottom: number = upper.layers[0]!.y;

    // The rings a run down from the bottom ring: a negative run reads the
    // chain above it, where it exists.
    const rows: Map<number, AutoMovieVector3Tuple[]> = new Map<
      number,
      AutoMovieVector3Tuple[]
    >();
    const row: (run: number) => AutoMovieVector3Tuple[] = (
      run: number,
    ): AutoMovieVector3Tuple[] => {
      let found: AutoMovieVector3Tuple[] | undefined = rows.get(run);
      if (found === undefined)
        rows.set(
          run,
          (found = AutoMovieLoftChain.ring(upper, bottom - run, phases).map(
            (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple => sided(p, sign),
          )),
        );
      return found;
    };
    const jets: IAutoMovieHumanLimbRootStrip.IJet[] = phases.map(
      (_: number, i: number): IAutoMovieHumanLimbRootStrip.IJet =>
        AutoMovieHumanLimbRootStrip.edge(
          (run: number): AutoMovieVector3Tuple => row(run)[i]!,
          0,
          -STEP,
        ),
    );
    const ring: AutoMovieVector3Tuple[] = jets.map(
      (j: IAutoMovieHumanLimbRootStrip.IJet): AutoMovieVector3Tuple => j.point,
    );
    const centre: AutoMovieVector3Tuple = [
      mean(ring, 0),
      mean(ring, 1),
      mean(ring, 2),
    ];
    const radius: number =
      ring.reduce(
        (s: number, p: AutoMovieVector3Tuple): number =>
          s + Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]),
        0,
      ) / ring.length;

    return {
      centre,
      radius,
      outline: ring.map((p: AutoMovieVector3Tuple): [number, number] => [
        p[0],
        p[2],
      ]),
      points: ring,
      jets,
    };
  }
}
