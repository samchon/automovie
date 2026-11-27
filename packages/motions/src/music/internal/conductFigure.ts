import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanConduct,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/internal/HumanFrame";

/** The alternatives of `ConductFigurePosture`'s site. */
type ConductFigurePosture = "root" | "yaw";

/** The record of `IConductFigure`'s site. */
interface IConductFigure {
  /** Each beat's ictus, world metres, in order. */
  ictus: IAutoMovieVector3[];

  /** The figure's top, where the preparation starts, world metres. */
  top: IAutoMovieVector3;
}

/**
 * A conducting figure laid in the performer's frontal plane: its centre a
 * forearm and six tenths of an upper arm ahead of the body, 0.1 m below the
 * shoulders and half a shoulder half-width toward the baton's side; each beat's
 * ictus at its meter's shares of the figure's half width (toward the body's
 * middle) and half height (`conductFigure.HALF`), cycling through the meter;
 * and the top at the figure's full half height above its centre.
 *
 * @param posture The entry's root and heading.
 * @param measure The performer's measure.
 * @param side The baton hand.
 * @param meter The meter whose figure is beaten.
 * @param count How many beats.
 * @returns The ictuses and the top, world metres.
 */
export function conductFigure(
  posture: Pick<IAutoMovieMotionHumanPosture, ConductFigurePosture>,
  measure: IAutoMovieMotionHumanBody["measure"],
  side: AutoMovieHumanSide,
  meter: IAutoMovieMotionHumanConduct.Meter,
  count: number,
): IConductFigure {
  const inward: number = side === "right" ? 1 : -1;
  const place: (x: number, y: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
  ): IAutoMovieVector3 =>
    HumanFrame.point(
      {
        origin: { x: posture.root.x, y: 0, z: posture.root.z },
        yaw: posture.yaw,
      },
      {
        x:
          -inward * measure.shoulderHalfWidth * 0.5 +
          inward * x * conductFigure.HALF,
        y: measure.shoulderHeight - 0.1 + y * conductFigure.HALF,
        z: measure.forearm + measure.upperArm * 0.6,
      },
    );
  const figure: readonly (readonly [number, number])[] =
    conductFigure.FIGURES[meter];
  const ictus: IAutoMovieVector3[] = [];
  for (let k: number = 0; k < count; ++k) {
    const share: readonly [number, number] = figure[k % figure.length]!;
    ictus.push(place(share[0], share[1]));
  }
  return { ictus, top: place(0, 1) };
}

/** The figures and their size. */
export namespace conductFigure {
  /**
   * Each meter's ictus points, `[in, up]` in shares of the figure's half width
   * and half height about its centre: Rudolf's figures (_The Grammar of
   * Conducting_, 3rd ed., 1995), each beat's ictus reached by its direction
   * from the one before (4/4: down to the first, in to the second, out to the
   * third, up to the fourth). The shares themselves are provisional.
   */
  export const FIGURES: Readonly<
    Record<
      IAutoMovieMotionHumanConduct.Meter,
      readonly (readonly [number, number])[]
    >
  > = {
    "2/4": [
      [0, -1],
      [-0.2, -0.4],
    ],
    "3/4": [
      [0, -1],
      [-1, -0.6],
      [-0.3, -0.2],
    ],
    "4/4": [
      [0, -1],
      [1, -0.6],
      [-1, -0.6],
      [-0.3, -0.2],
    ],
  };

  /**
   * The figure's half width and half height, metres: provisional, a forearm's
   * sweep.
   */
  export const HALF: number = 0.18;
}
