import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The heel's posterior corner: where the plantar contact's two edges leave the
 * floor and run round to the rearmost point of the heel, half a sector breadth
 * either side of the midline. Own centre: the calcaneal tuberosity's rearmost
 * point; the corner is a quarter ellipse in its own plane, from the contact's
 * rear end (on the floor, `END` foot lengths in front of the rearmost point)
 * up to the rearmost point (`HEIGHT` foot lengths over the floor): the exact
 * plane cuts read an exponent of 1.8 to 2.0 on every reference. Behind it the
 * edges continue up the Achilles (`AutoMovieHumanFootAchilles`). Every number
 * is a reference median over f1, f2, m1 and m2 awaiting a published value.
 */
export namespace AutoMovieHumanFootHeelCorner {
  /**
   * Half the breadth of the plantar sector behind the heel's contact, foot
   * breadths: half the contact's breadth where it closes (0.33 to 0.58 at
   * 0.075 of the length). Reference median.
   */
  export const HALF: number = 0.12;

  /**
   * The edge's knots from the contact's rear end round the corner.
   *
   * @param frame The foot's frame.
   * @param side -1 for the medial edge, 1 for the lateral.
   */
  export function knots(frame: AutoMovieHumanFootFrame.IFrame, side: -1 | 1): Vec3[] {
    const across: number = ACROSS + side * HALF;

    return Array.from({ length: CORNER_KNOTS + 1 }, (_: unknown, i: number): Vec3 => {
      const tau: number = (Math.PI / 2) * (i / CORNER_KNOTS);

      return frame.at(END - END * Math.sin(tau), across, (HEIGHT - HEIGHT * Math.cos(tau)) * frame.L);
    });
  }

  /**
   * The corner's height over the floor, mm: the height the edges rise to at
   * the rearmost point, over which their tangent and curvature hand over from
   * the floor's to the neighbours'.
   *
   * @param frame The foot's frame.
   */
  export function height(frame: AutoMovieHumanFootFrame.IFrame): number {
    return HEIGHT * frame.L;
  }
}

/** The contact's rear end along the foot, foot lengths. Reference median. */
const END: number = 0.06;

/** The rearmost point's height over the floor, foot lengths. Reference median. */
const HEIGHT: number = 0.09;

/** The corner's across place on the midline, foot breadths. Reference median. */
const ACROSS: number = 0.455;

/** Knots on the corner's quarter ellipse, intervals. Convention. */
const CORNER_KNOTS: number = 6;
