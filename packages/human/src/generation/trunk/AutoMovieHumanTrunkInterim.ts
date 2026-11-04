import { AutoMovieHumanBodyPlaces } from "../AutoMovieHumanBodyPlaces";
import { AutoMovieHumanTrunkInguinalFold } from "../AutoMovieHumanTrunkInguinalFold";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSection } from "../IAutoMovieHumanTrunkSection";
import type { IAutoMovieHumanTrunkSolution } from "../IAutoMovieHumanTrunkSolution";
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
   * Interim accessor: the trunk's sites above the chest (the axilla, the
   * shoulder point, the neck seat), each the old column's half width and
   * depth there, its front the landed back profile plus that depth, its
   * shoulder the old quadrants' superellipse read as a conic: a superellipse
   * `|x|^n + |z|^n = 1` crosses its box's diagonal at `2^(-1/n)` of the
   * corner and the conic at `(1 + r) / 2`, so `r = 2^(1 - 1/n) - 1` (the
   * ellipse's `sqrt(2) - 1` at `n = 2`), `n` the mean of the old front and
   * back squareness. The last site stands at the neck seat, the neck's
   * bottom ring, where the trunk takes the neck's ring by the head's down
   * event. Owed laws: the upper trunk's front profile, the neck base's box,
   * the acromion's soft tissue.
   *
   * @param solution The old trunk's solve.
   * @param laws The trunk's laws, for the back profile.
   * @returns The upper sites.
   */
  export function upperSites(solution: IAutoMovieHumanTrunkSolution, laws: AutoMovieHumanTrunkViews.ILaws): AutoMovieHumanTrunkViews.ILaws["upper"] {
    const heights: [string, number][] = [
      ["axilla", solution.landmarks.axilla],
      ["shoulder", solution.landmarks.shoulder[1]],
      ["neck", solution.seat.y],
    ];
    return heights.map(([site, y]: [string, number]): AutoMovieHumanTrunkViews.ILaws["upper"][number] => {
      const s: IAutoMovieHumanTrunkSection = solution.column.at(y);
      const n: number = (s.squareFront + s.squareBack) / 2;
      return { site, y, half: s.width, front: laws.back(y) + (s.front - s.back), shoulder: 2 ** (1 - 1 / n) - 1 };
    });
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
