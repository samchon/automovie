import { AutoMovieHumanBodyPlaces } from "../AutoMovieHumanBodyPlaces";
import { AutoMovieHumanTrunkInguinalFold } from "../AutoMovieHumanTrunkInguinalFold";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import type { IAutoMovieHumanTrunkSolution } from "../IAutoMovieHumanTrunkSolution";
import { AutoMovieHumanTrunkLandmarks } from "../AutoMovieHumanTrunkLandmarks";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";
import type { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";

/**
 * The trunk's interim accessors (#3044's rule for priors the campaign has
 * not yet replaced: read from the construction that produces them today,
 * listed as remaining, never refit; `log-body.md`, "Interim accessors"):
 * the trunk's forward places, its sites above the chest and every fold's
 * radius, each read on the old trunk's solve with no number of its own.
 */
export namespace AutoMovieHumanTrunkInterim {
  /**
   * Cervicale's and the perineum's forward places: forward of the ankle
   * centres' midpoint by their stature shares (`AutoMovieHumanBodyPlaces`,
   * estimated from the private reference set: no published source found).
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param ankles The two ankle centres' mean forward place, calibration mm.
   * @returns Both forward places, calibration mm.
   */
  export function places(measures: IAutoMovieHumanBodyMeasures, scale: number, ankles: number): { cervicale: number; perineum: number } {
    return {
      cervicale: ankles + AutoMovieHumanBodyPlaces.cervicale(measures) * scale,
      perineum: ankles + AutoMovieHumanBodyPlaces.perineum(measures) * scale,
    };
  }

  /**
   * The trunk's sites above the chest: one at every station of the trunk
   * outline table (`AutoMovieHumanReferenceOutlines.TRUNK`, estimated from
   * the private reference set: no published source carries the upper
   * trunk's outline) between the chest site and the neck seat, a layer
   * spacing clear of both (`AutoMovieHumanTrunkViewPart.GAP`; a closer site
   * leaves a thin interval the station rule prints as a ring). Two sites
   * alone (the axilla and the shoulder point) left the natural spline to
   * bridge the shoulders' near-level top to the neck, and it overshot into
   * lobes over the shoulders; the table's stations carry that slope knot by
   * knot. Each takes, at its share of crotch to cervicale, the half breadth, the front and
   * the back forward of cervicale's back point, each per stature, and the
   * shoulder the mean of the front and back quarters' (the table's 0 chord
   * to 1 box is the conic shoulder). The last site is the neck seat, the
   * neck's bottom ring, where the trunk takes the neck's ring by the head's
   * down event: its half width and its front and back midline points are the
   * ring's own (`AutoMovieHumanTrunkNeckSeat`), so the trunk's top meets the
   * ring it continues. Remaining: the neck seat's height is the old solve's.
   *
   * @param solution The old trunk's solve, for the heights and the neck seat.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param crotch The crotch's height, calibration mm.
   * @param stature The stature, calibration mm.
   * @param cervicale Cervicale's back point's forward place, calibration mm.
   * @returns The upper sites, by rising height.
   */
  export function upperSites(
    solution: IAutoMovieHumanTrunkSolution,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    crotch: number,
    stature: number,
    cervicale: number,
  ): AutoMovieHumanTrunkViews.ILaws["upper"] {
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const top: number = measures.cervicaleHeight * scale;
    const table = (site: string, y: number): AutoMovieHumanTrunkViews.ILaws["upper"][number] => {
      const share: number = (y - crotch) / (top - crotch);
      const read = (column: string): number => T.at(T.TRUNK, column, share);
      return {
        site,
        y,
        half: read("halfBreadth") * stature,
        front: cervicale + read("front") * stature,
        back: cervicale + read("back") * stature,
        shoulder: (read("shoulderFront") + read("shoulderBack")) / 2,
      };
    };
    const seat: IAutoMovieHumanTrunkSolution["seat"] = solution.seat;
    const chest: number = AutoMovieHumanTrunkLandmarks.at(crotch, top, AutoMovieHumanTrunkLandmarks.CHEST);
    const gap: number = AutoMovieHumanTrunkViewPart.GAP;
    const stations: number[] = T.TRUNK.rows
      .filter((r: AutoMovieHumanReferenceOutlines.IRow): boolean => r.values["halfBreadth"] !== undefined)
      .map((r: AutoMovieHumanReferenceOutlines.IRow): number => crotch + r.share * (top - crotch))
      .filter((y: number): boolean => y > chest + gap && y < seat.y - gap);
    return [
      ...stations.map((y: number): AutoMovieHumanTrunkViews.ILaws["upper"][number] => table(`upper ${((y - crotch) / (top - crotch)).toFixed(2)}`, y)),
      { site: "neck", y: seat.y, half: seat.width, front: seat.front[0], back: seat.back[0], shoulder: table("neck", seat.y).shoulder },
    ];
  }

  /**
   * Interim accessor: every fold's radius, the old crotch fold's softness
   * (`AutoMovieHumanTrunkInguinalFold.softness`). Owed law: the subcutaneous
   * layer at each fold.
   *
   * @param solution The old trunk's solve.
   * @returns The radius, calibration mm.
   */
  export function foldRadius(solution: IAutoMovieHumanTrunkSolution): number {
    return AutoMovieHumanTrunkInguinalFold.softness(solution.pitch, AutoMovieHumanTrunkRows.MAX_GAP);
  }
}
