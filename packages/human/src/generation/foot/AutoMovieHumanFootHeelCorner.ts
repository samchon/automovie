import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootFrame,
} from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";

/**
 * The heel's posterior corner: where the plantar contact's two edges leave the
 * floor and run round to the rearmost point of the heel, half a sector breadth
 * either side of the midline. Own centre: the calcaneal tuberosity's rearmost
 * point; the corner is a quarter ellipse in its own plane, from the contact's
 * rear end (on the floor, `END` foot lengths in front of the rearmost point)
 * up to the rearmost point. The quarter ellipse preserves horizontal
 * contact at the floor and a vertical tangent at the heel's rear wall.
 */
export namespace AutoMovieHumanFootHeelCorner {
  /**
   * ESTIMATE: the plantar sector at the rear occupies one quarter of
   * foot breadth, centred on the longitudinal course.
   */
  export const HALF: number = 1 / 8;

  /** ESTIMATE: rear contact starts one third of the heel-to-ankle distance ahead of the heel wall. */
  export const END: number = AutoMovieHumanFootPlaces.ANKLE / 3;

  /**
   * The edge's knots from the contact's rear end round the corner.
   *
   * @param frame The foot's frame.
   * @param side -1 for the medial edge, 1 for the lateral.
   */
  export function knots(
    frame: IAutoMovieHumanFootFrame.IFrame,
    side: -1 | 1,
  ): AutoMovieVector3Tuple[] {
    const across: number = 1 / 2 + side * HALF;
    const rise: number = height(frame);

    return Array.from(
      { length: CORNER_KNOTS + 1 },
      (_: unknown, i: number): AutoMovieVector3Tuple => {
        const tau: number = (Math.PI / 2) * (i / CORNER_KNOTS);

        return frame.at(
          END - END * Math.sin(tau),
          across,
          rise * (1 - Math.cos(tau)),
        );
      },
    );
  }

  /**
   * The corner's height over the floor, mm: the height the edges rise to at
   * the rearmost point, over which their tangent and curvature hand over from
   * the floor's to the neighbours'.
   *
   * @param frame The foot's frame.
   */
  export function height(frame: IAutoMovieHumanFootFrame.IFrame): number {
    return AutoMovieHumanFootPlaces.dorsum(frame.L, 0);
  }
}

/** Six equal angular intervals sample the corner's quarter ellipse. */
const CORNER_KNOTS: number = 6;
