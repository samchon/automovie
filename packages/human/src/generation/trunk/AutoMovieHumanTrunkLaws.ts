import type {
  IAutoMovieHumanBackProfile,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanTrunkLaws,
  IAutoMovieHumanTrunkViewLaws,
} from "@automovie/interface";

import { AutoMovieHumanBackProfile } from "../AutoMovieHumanBackProfile";
import { AutoMovieHumanChestWall } from "../AutoMovieHumanChestWall";
import { AutoMovieHumanLumbarSection } from "../AutoMovieHumanLumbarSection";

/**
 * Trunk laws in calibration millimetres. The person's posture and stature place
 * the median back from cervicale through the thoracic and lumbar arcs and onto
 * the sacral tangent (`AutoMovieHumanBackProfile`). Ohlendorf et al. measured
 * the angles and the C7-to-PSIS chord. The two circular arcs are the named
 * geometric estimate of their side-view curve. The other laws: the top hip's
 * box from the navel section's law (`AutoMovieHumanLumbarSection`), the
 * underbust's from the thorax without the breasts (`AutoMovieHumanChestWall`),
 * each a pure function of the person's measures, the published laws taking
 * world millimetres and the calibration scale applied on both sides.
 *
 * What is not yet a law is the caller's, named so it cannot pass unnoticed:
 * cervicale's forward place in the body frame (the back profile's datum), the
 * perineum's, and the sites above the chest (their half breadths and fronts).
 */
export namespace AutoMovieHumanTrunkLaws {
  /**
   * The trunk's laws for a person.
   *
   * @param measures The person's resolved measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param crotch The crotch's height, calibration mm, below the trunk
   *   stations.
   * @param pending The values still owed by laws.
   * @returns The laws `AutoMovieHumanTrunkViews.of` reads.
   */
  export function of(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    crotch: number,
    pending: IAutoMovieHumanTrunkLaws.IPending,
  ): IAutoMovieHumanTrunkViewLaws.ILaws {
    const profile: IAutoMovieHumanBackProfile.IProfile =
      AutoMovieHumanBackProfile.of(measures);
    const top: number = measures.cervicaleHeight * scale;
    const scaled = (b: {
      breadth: number;
      depth: number;
    }): IAutoMovieHumanTrunkViewLaws.IBox => ({
      breadth: b.breadth * scale,
      depth: b.depth * scale,
    });
    return {
      chest: pending.chest,
      backStations: profile.knots
        .map(({ name, y }): { site: string; y: number } => ({
          site: `back.${name}`,
          y: y * scale,
        }))
        .filter(({ y }): boolean => crotch < y && y < top)
        .sort((a, b): number => a.y - b.y),
      back: (y: number): number =>
        pending.cervicale + profile.at(y / scale)[0] * scale,
      lumbar: (girth: number): IAutoMovieHumanTrunkViewLaws.IBox =>
        scaled(AutoMovieHumanLumbarSection.box(measures, girth / scale)),
      chestWall: (girth: number): IAutoMovieHumanTrunkViewLaws.IBox =>
        scaled(AutoMovieHumanChestWall.box(measures, girth / scale)),
      perineum: pending.perineum,
      upper: pending.upper,
    };
  }
}
