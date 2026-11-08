import { AutoMovieHumanBackProfile } from "../AutoMovieHumanBackProfile";
import { AutoMovieHumanChestWall } from "../AutoMovieHumanChestWall";
import { AutoMovieHumanLumbarSection } from "../AutoMovieHumanLumbarSection";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";

/**
 * The trunk's laws bound for a person (#3047), in calibration millimetres:
 * the back median's forward place relative to cervicale's back point from
 * the trunk outline table between the crotch and cervicale
 * (`AutoMovieHumanReferenceOutlines.TRUNK`, per stature, estimated from the
 * private reference set) and on cervicale's tangent above it
 * (`AutoMovieHumanBackProfile`). The rasterstereography survey behind the
 * back profile publishes the curve's angles and the C7 to PSIS length, not
 * the line's forward places; the profile's places come from two circular
 * arcs split by the vertebral column's lengths, an assumption no source
 * gives for the skin line, so below cervicale the table's estimate stands
 * in for the unpublished places. The table reads the median section's back
 * extreme, which at the buttock is the gluteal apex (the caller stands the
 * base in front of it by the gluteal amplitude).
 * The other laws: the top hip's box
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
    /** One shared chest/bust-apex height; retained course-placement proxy, calibration mm. */
    chest: number;

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
   * @param crotch The crotch's height, calibration mm, where the table's span starts.
   * @param pending The values still owed by laws.
   * @returns The laws `AutoMovieHumanTrunkViews.of` reads.
   */
  export function of(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    crotch: number,
    pending: IPending,
  ): AutoMovieHumanTrunkViews.ILaws {
    const profile: AutoMovieHumanBackProfile.IProfile =
      AutoMovieHumanBackProfile.of(measures);
    const top: number = measures.cervicaleHeight * scale;
    const stature: number = measures.stature * scale;
    const T: typeof AutoMovieHumanReferenceOutlines =
      AutoMovieHumanReferenceOutlines;
    const scaled = (b: {
      breadth: number;
      depth: number;
    }): AutoMovieHumanTrunkViews.IBox => ({
      breadth: b.breadth * scale,
      depth: b.depth * scale,
    });
    return {
      chest: pending.chest,
      backStations: T.TRUNK.rows.map(
        (
          row: AutoMovieHumanReferenceOutlines.IRow,
        ): { site: string; y: number } => ({
          site: `back.shape.${row.share}`,
          y: crotch + row.share * (top - crotch),
        }),
      ),
      back: (y: number): number =>
        pending.cervicale +
        (y >= top
          ? profile.at(y / scale)[0] * scale
          : T.at(T.TRUNK, "back", (y - crotch) / (top - crotch)) * stature),
      lumbar: (girth: number): AutoMovieHumanTrunkViews.IBox =>
        scaled(AutoMovieHumanLumbarSection.box(measures, girth / scale)),
      chestWall: (girth: number): AutoMovieHumanTrunkViews.IBox =>
        scaled(AutoMovieHumanChestWall.box(measures, girth / scale)),
      perineum: pending.perineum,
      upper: pending.upper,
    };
  }
}
