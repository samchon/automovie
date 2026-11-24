import { AutoMovieViewSection } from "@automovie/engine";
import type {
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanTrunkSolution,
  IAutoMovieHumanTrunkViewLaws,
} from "@automovie/interface";

import { AutoMovieHumanTrunkInguinalFold } from "../AutoMovieHumanTrunkInguinalFold";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import { AutoMovieHumanTrunkViewPart } from "./AutoMovieHumanTrunkViewPart";

/** Torso-only sites above the chest and the existing sampling-scale fold radius. */
export namespace AutoMovieHumanTrunkInterim {
  /**
   * The person's biacromial breadth supplies the acromion's lateral place.
   * ESTIMATE: the axilla stands one upper-arm tape radius medial to it.
   * Continue the chest wall depth to the axilla and transition to the owned
   * neck depth by a quintic step. Both ends have zero depth slope and
   * curvature. Use ellipse sections where no separate tape is supplied. The top
   * site takes its actual width and AP endpoints from the neck seat.
   *
   * @param solution The trunk solve's shoulder, chest and neck sites.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param back The person's prepared posterior outline, calibration mm.
   * @param breastSetback The chest wall's median setback, calibration mm.
   * @returns The upper sites, by rising height.
   */
  export function upperSites(
    solution: Pick<IAutoMovieHumanTrunkSolution, "seat"> & {
      /** Heights and lateral supports of the two bounding landmarks. */
      landmarks: Pick<
        IAutoMovieHumanTrunkSolution["landmarks"],
        "bustPoint" | "shoulder"
      >;
    },
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    back: (y: number) => number,
    breastSetback: number,
  ): IAutoMovieHumanTrunkViewLaws.ILaws["upper"] {
    const seat: IAutoMovieHumanTrunkSolution["seat"] = solution.seat;
    const axilla: number = measures.axillaHeight * scale;
    const chestDepth: number = measures.chestDepth * scale - breastSetback;
    const neckDepth: number = seat.front[0] - seat.back[0];
    const site = (
      site: string,
      y: number,
      half: number,
    ): IAutoMovieHumanTrunkViewLaws.ILaws["upper"][number] => {
      const t: number =
        y <= axilla ? 0 : Math.min(1, (y - axilla) / (seat.y - axilla));
      const q: number = t ** 3 * (10 - 15 * t + 6 * t ** 2);
      const posterior: number = back(y);
      return {
        site,
        y,
        half,
        front: posterior + chestDepth + q * (neckDepth - chestDepth),
        back: posterior,
        shoulder: AutoMovieViewSection.ELLIPSE,
      };
    };
    const chest: number = solution.landmarks.bustPoint[1];
    const gap: number = AutoMovieHumanTrunkViewPart.GAP;
    const shoulder: [number, number, number] = solution.landmarks.shoulder;
    const radius: number =
      (measures.upperArmCircumference * scale) / (2 * Math.PI);
    const upper: IAutoMovieHumanTrunkViewLaws.ILaws["upper"] = [
      site("axilla", axilla, shoulder[2] - radius),
      site("acromion", shoulder[1], shoulder[2]),
    ].filter(
      (site: IAutoMovieHumanTrunkViewLaws.ILaws["upper"][number]): boolean =>
        site.y > chest + gap && site.y < seat.y - gap,
    );
    return [
      ...upper,
      {
        site: "neck",
        y: seat.y,
        half: seat.width,
        front: seat.front[0],
        back: seat.back[0],
        shoulder: AutoMovieViewSection.ELLIPSE,
      },
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
    return AutoMovieHumanTrunkInguinalFold.softness(
      solution.pitch,
      AutoMovieHumanTrunkRows.MAX_GAP,
    );
  }
}
