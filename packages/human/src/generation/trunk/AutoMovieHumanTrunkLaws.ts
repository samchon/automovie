import { AutoMovieHumanBackProfile } from "../AutoMovieHumanBackProfile";
import { AutoMovieHumanChestWall } from "../AutoMovieHumanChestWall";
import { AutoMovieHumanLumbarSection } from "../AutoMovieHumanLumbarSection";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";

/**
 * The trunk's laws bound for a person (#3047), in calibration millimetres:
 * the back median's forward place from the rasterstereography back profile
 * (`AutoMovieHumanBackProfile`, relative to cervicale), the top hip's box
 * from the navel section's law (`AutoMovieHumanLumbarSection`), the
 * underbust's from the thorax without the breasts (`AutoMovieHumanChestWall`),
 * each a pure function of the person's measures, the published laws taking
 * world millimetres and the calibration scale applied on both sides.
 *
 * What is not yet a law is the caller's, named so it cannot pass unnoticed:
 * cervicale's forward place in the body frame (the back profile's datum), the
 * perineum's, and the sites above the chest (their half breadths and fronts).
 */
export namespace AutoMovieHumanTrunkLaws {
  /** The values still owed by laws, calibration mm. */
  export interface IPending {
    /** Cervicale's forward place in the body frame. */
    cervicale: number;

    /** The perineum's forward place. */
    perineum: number;

    /** The sites above the chest (`AutoMovieHumanTrunkViews.ILaws.upper`). */
    upper: AutoMovieHumanTrunkViews.ILaws["upper"];
  }

  /**
   * The trunk's laws for a person.
   *
   * @param measures The person's resolved measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param pending The values still owed by laws.
   * @returns The laws `AutoMovieHumanTrunkViews.of` reads.
   */
  export function of(measures: IAutoMovieHumanBodyMeasures, scale: number, pending: IPending): AutoMovieHumanTrunkViews.ILaws {
    const profile: AutoMovieHumanBackProfile.IProfile = AutoMovieHumanBackProfile.of(measures);
    const scaled = (b: { breadth: number; depth: number }): AutoMovieHumanTrunkViews.IBox => ({ breadth: b.breadth * scale, depth: b.depth * scale });
    return {
      back: (y: number): number => pending.cervicale + profile.at(y / scale)[0] * scale,
      lumbar: (girth: number): AutoMovieHumanTrunkViews.IBox => scaled(AutoMovieHumanLumbarSection.box(measures, girth / scale)),
      chestWall: (girth: number): AutoMovieHumanTrunkViews.IBox => scaled(AutoMovieHumanChestWall.box(measures, girth / scale)),
      perineum: pending.perineum,
      upper: pending.upper,
    };
  }
}
