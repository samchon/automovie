import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanNaturalSpline } from "../../lofting/AutoMovieHumanNaturalSpline";
import type { AutoMovieHumanViewAxis } from "../../lofting/AutoMovieHumanViewAxis";

/**
 * The trunk's axis: the level plane at every height, its origin on the
 * median plane at the side profiles' mid-depth.
 *
 * The trunk's tapes and breadths are horizontal by their definitions (ISO
 * 8559-1 5.3.4 to 5.3.13; ANSUR II chest, waist and hip breadth and depth), so
 * its sections are level and its station is world height, as
 * `AutoMovieHumanViewAxis.horizontal` gives. That axis holds its origin at
 * `x = 0`, and the view-to-section operator needs the origin strictly inside
 * each station's box (a polar section about a point outside it does not
 * exist); with the posture inputs moving the trunk forward or back over the
 * feet, `x = 0` is not inside every person's lower trunk. So the origin runs
 * on `c(y) = (front(y) + back(y)) / 2`, the natural cubic spline of the side
 * profiles' mid-depth at the trunk's sites, which lies inside every box whose
 * profiles are apart, and the chart axes stay `u = +X`, `v = +Z` with the
 * normal `v x u = +Y`. The plane is C2 in height because `c` is, and the
 * operator carries its station derivatives by the natural spline of its
 * components (`AutoMovieHumanSeamStation.continuous`), exact for this cubic.
 */
export namespace AutoMovieHumanTrunkLevelAxis {
  /** One knot of the mid-depth curve. */
  export interface IKnot {
    /** Height, mm, strictly increasing over the knots. */
    y: number;

    /** Forward place of the mid-depth on the median plane, mm. */
    x: number;
  }

  /**
   * The axis through the mid-depth knots.
   *
   * @param knots At least two knots by strictly increasing height.
   * @returns The level axis; past the end knots the origin continues along the spline's straight end tangent.
   */
  export function create(knots: readonly IKnot[]): AutoMovieHumanViewAxis.IAxis {
    const spline: AutoMovieHumanNaturalSpline.ISpline = AutoMovieHumanNaturalSpline.create(
      knots.map((k: IKnot): number => k.y),
      knots.map((k: IKnot): number => k.x),
    );
    return {
      at: (station: number): AutoMovieHumanLoftFrame.IFrame => ({
        origin: [AutoMovieHumanNaturalSpline.evaluate(spline, station), station, 0],
        u: [1, 0, 0],
        v: [0, 0, 1],
      }),
    };
  }
}
