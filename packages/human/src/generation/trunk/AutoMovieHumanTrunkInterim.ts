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
   * Torso-only axilla and acromion boundaries above the chest. The old
   * table's upper half-breadth includes the arms, so the shoulder's
   * public biacromial breadth supplies the acromion's lateral place; an upper-arm
   * circle radius medial to it defines the axilla attachment convention.
   * Front/back and quadrant fullness retain the existing outline table.
   * These anatomical knots do not by themselves bound the natural cubic
   * spans: their slope/curvature and reference comparison remain required.
   * The last site is the neck seat, the
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
    // The old table's upper breadth includes arms in its horizontal
    // envelope. Torso-only source landmarks instead use the shoulder point
    // set at public biacromial/2, and an axilla one upper-arm
    // circle radius medial to it. The latter is an explicit geometric
    // attachment convention, not a newly fitted anatomical ratio.
    const shoulder: [number, number, number] = solution.landmarks.shoulder;
    const radius: number = measures.upperArmCircumference * scale / (2 * Math.PI);
    const upper: AutoMovieHumanTrunkViews.ILaws["upper"] = [
      { ...table("axilla", measures.axillaHeight * scale), half: shoulder[2] - radius },
      { ...table("acromion", shoulder[1]), half: shoulder[2] },
    ].filter((site: AutoMovieHumanTrunkViews.ILaws["upper"][number]): boolean => site.y > chest + gap && site.y < seat.y - gap);
    return [
      ...upper,
      { site: "neck", y: seat.y, half: seat.width, front: seat.front[0], back: seat.back[0], shoulder: table("neck", seat.y).shoulder },
    ];
  }

  /**
   * Interim accessor: every fold's radius, the old crotch fold's softness
   * (`AutoMovieHumanTrunkInguinalFold.softness`): 1.25 times the larger of
   * sampling pitch and MAX_GAP. This is operational join softness, not a
   * measured fat thickness or an anatomical rolling radius. A source-owned
   * attachment chord and angle would define a geometric fillet separately.
   *
   * @param solution The old trunk's solve.
   * @returns The radius, calibration mm.
   */
  export function foldRadius(solution: IAutoMovieHumanTrunkSolution): number {
    return AutoMovieHumanTrunkInguinalFold.softness(solution.pitch, AutoMovieHumanTrunkRows.MAX_GAP);
  }
}
