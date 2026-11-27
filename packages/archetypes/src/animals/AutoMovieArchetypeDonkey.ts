import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { AutoMovieArchetypeEquineEarProfiles } from "./AutoMovieArchetypeEquineEarProfiles";
import { EquineSegments } from "./EquineSegments";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { AutoMovieArchetypeHorse } from "./AutoMovieArchetypeHorse";

/** The weighed Veracruz donkeys. */
const VERACRUZ: string =
  "López-Yáñez et al. 2025, Rev Mex Cienc Pecu 16 (Supl 4):11, p. 15 and Table 1: 200 working donkeys, height 112.62 ± 5.63 cm, minimum 93, maximum 127, thoracic perimeter 121.2 cm, live weight on a portable large-animal scale 151.4 kg (https://www.scielo.org.mx/pdf/rmcp/v16s4/2448-6698-rmcp-16-s4-11-en.pdf)";

/** Constructs the donkey archetype from its recipe. */
export namespace AutoMovieArchetypeDonkey {
/**
 * A donkey with its tack: the horse's build (`AutoMovieArchetypeEquine.equid`)
 * at a donkey's size and proportions, under a riding saddle, in a driving
 * harness or under a pack saddle, with the horse's contacts.
 *
 * Its height at the withers is drawn over the range of 200 weighed working
 * donkeys (López-Yáñez et al. 2025); its heart girth is that height in the
 * sample's mean proportion, the paper giving no relation between its measures,
 * and its mass follows the two by the equids' one law
 * (`AutoMovieArchetypeEquine.mass`). Its bones are the horse's fractions of the
 * height, each measured one scaled by the American Mammoth Jackstock's surface
 * measure against the Thoroughbred's (`EquineSegments.lengths`), the one donkey
 * breed Brooks et al. 2010 measure in number, standing for the donkey. It rides
 * the horse's measured gaits scaled to its height (`createQuadruped.SPECIES`).
 * Ear L/W transfer the separate male Halari reference through the explicitly
 * provisional height ratios in AutoMovieArchetypeEquineEarProfiles. Plate
 * thickness and diagonal neutral pose are authored coarse geometry, not
 * Veracruz measurements.
 *
 * @param params The tack and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The donkey.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   or a tack that is not one of `AutoMovieArchetypeEquine.TACKS`.
 */
export function create(
  params: AutoMovieArchetypeEquine.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
  return AutoMovieArchetypeEquine.equid(
    AutoMovieArchetypeDonkey.PROFILE,
    params,
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension>(
      AutoMovieArchetypeDonkey.ARCHETYPE,
      AutoMovieArchetypeEquine.UNITS,
      seed,
      params,
    ),
  );
}
}

/** Companion constants and profile of {@link createDonkey}. */
export namespace AutoMovieArchetypeDonkey {
  /** The producer's name. */
  export const ARCHETYPE: string = "donkey";

  /**
   * A donkey's heart girth over its height at the withers: the Veracruz
   * sample's mean thoracic perimeter over its mean height, 121.2 over 112.62
   * cm.
   */
  export const GIRTH: number = 121.2 / 112.62;

  /**
   * The band of each dimension a donkey draws: its height over the weighed
   * sample's range, and the horse's tack and tempo, which the rider's hand and
   * foot and the gait's spread set, not the donkey's size.
   */
  export const BANDS: Readonly<
    Partial<Record<AutoMovieArchetypeEquine.Free, IAutoMovieArchetypeBand>>
  > = {
    withersHeight: AutoMovieArchetypeBand.metres(0.93, 1.27, VERACRUZ),
    stirrupDrop: HORSE_BANDS.stirrupDrop,
    stirrupWidth: HORSE_BANDS.stirrupWidth,
    tempo: HORSE_BANDS.tempo,
    breechingDrop: HORSE_BANDS.breechingDrop,
  };

  /**
   * The donkey's profile: its girth in the sample's proportion to its height,
   * and the jackstock's bone fractions.
   */
  export const PROFILE: AutoMovieArchetypeEquine.IProfile = {
    archetype: ARCHETYPE,
    names: {
      saddle: "saddle donkey",
      harness: "driving donkey",
      both: "postilion donkey",
      pack: "pack donkey",
    },
    bands: BANDS,
    girth: (withers: number): number => withers * GIRTH,
    body: {
      ...AutoMovieArchetypeHorse.BODY,
      lengths: EquineSegments.lengths(EquineSegments.BREEDS.mammothJackstock),
      head: {
        ...AutoMovieArchetypeHorse.BODY.head,
        ears: AutoMovieArchetypeEquineEarProfiles.donkey(),
      },
    },
  };
}
