import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeDrawSession,
  type IAutoMovieArchetypeBand,
} from "../core";
import { AutoMovieArchetypeEquineEarProfiles } from "./AutoMovieArchetypeEquineEarProfiles";
import { EquineSegments } from "./EquineSegments";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { createHorse } from "./createHorse";

/** The weighed Veracruz donkeys. */
const VERACRUZ: string =
  "López-Yáñez et al. 2025, Rev Mex Cienc Pecu 16 (Supl 4):11, p. 15 and Table 1: 200 working donkeys, height 112.62 ± 5.63 cm, minimum 93, maximum 127, thoracic perimeter 121.2 cm, live weight on a portable large-animal scale 151.4 kg (https://www.scielo.org.mx/pdf/rmcp/v16s4/2448-6698-rmcp-16-s4-11-en.pdf)";

/**
 * A donkey with its tack: the horse's build (`createHorse.equid`) at a donkey's size and proportions, under a riding saddle, in a driving harness or under a pack saddle, with the horse's contacts.
 *
 * Its height at the withers is drawn over the range of 200 weighed working donkeys (López-Yáñez et al. 2025); its heart girth is that height in the sample's mean proportion, the paper giving no relation between its measures, and its mass follows the two by the equids' one law (`createHorse.mass`). Its bones are the horse's fractions of the height, each measured one scaled by the American Mammoth Jackstock's surface measure against the Thoroughbred's (`EquineSegments.lengths`), the one donkey breed Brooks et al. 2010 measure in number, standing for the donkey. It rides the horse's measured gaits scaled to its height (`createQuadruped.SPECIES`).
 * Ear L/W transfer the separate male Halari reference through the explicitly
 * provisional height ratios in AutoMovieArchetypeEquineEarProfiles. Plate thickness and diagonal
 * neutral pose are authored coarse geometry, not Veracruz measurements.
 *
 * @param params The tack and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The donkey.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band, or a tack that is not one of `createHorse.TACKS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the donkey shares with the horse, and how its size, proportions and mass are derived.
 * @evidence contracts/development/implementation.md#principled-implementation One drawn height over the weighed sample's stated range, the girth at the sample's mean ratio to it and the mass by the equids' one law, so the three measures of one donkey agree: the law gives 148 kg at the sample's mean height against its weighed 151.4 kg. Bone fractions from the jackstock's measures (Brooks et al. 2010).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `createHorse.equid` on `PROFILE`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Height, girth and mass are never drawn as three independent bands. The humerus and femur keep the horse's fractions, provisional as EquineSegments states; standing controls, mass shares and head/neck/tail stay unchanged. Optional ear L/W use AutoMovieArchetypeEquineEarProfiles' separate male Halari reference under an explicit provisional height transfer; plate thickness and pose are authored geometry, not Veracruz measurements.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The equid builder's own.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the horse's builder, tack and gait table.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createDonkey(
  params: Omit<createHorse.IParams, "breed"> = {},
  seed?: number | string,
): AutoMovieArchetype<createHorse.Affordance, createHorse.Dimension> {
  return createHorse.equid(
    createDonkey.PROFILE,
    params,
    new AutoMovieArchetypeDrawSession<createHorse.Dimension>(
      createDonkey.ARCHETYPE,
      createHorse.UNITS,
      seed,
      params,
    ),
  );
}

/**
 * Companion constants and profile of {@link createDonkey}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation The horse's equid profile with the donkey's name, bands, girth and bone fractions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The donkey's own data; its tack, contacts and dimensions are the horse's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One drawn measure, the others following it.
 */
export namespace createDonkey {
  /** The producer's name. */
  export const ARCHETYPE: string = "donkey";

  /** A donkey's heart girth over its height at the withers: the Veracruz sample's mean thoracic perimeter over its mean height, 121.2 over 112.62 cm. */
  export const GIRTH: number = 121.2 / 112.62;

  /** The band of each dimension a donkey draws: its height over the weighed sample's range, and the horse's tack and tempo, which the rider's hand and foot and the gait's spread set, not the donkey's size. */
  export const BANDS: Readonly<
    Partial<Record<createHorse.Free, IAutoMovieArchetypeBand>>
  > = {
    withersHeight: AutoMovieArchetypeBand.metres(0.93, 1.27, VERACRUZ),
    stirrupDrop: HORSE_BANDS.stirrupDrop,
    stirrupWidth: HORSE_BANDS.stirrupWidth,
    tempo: HORSE_BANDS.tempo,
    breechingDrop: HORSE_BANDS.breechingDrop,
  };

  /** The donkey's profile: its girth in the sample's proportion to its height, and the jackstock's bone fractions. */
  export const PROFILE: createHorse.IProfile = {
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
      ...createHorse.BODY,
      lengths: EquineSegments.lengths(EquineSegments.BREEDS.mammothJackstock),
      head: {
        ...createHorse.BODY.head,
        ears: AutoMovieArchetypeEquineEarProfiles.donkey(),
      },
    },
  };
}
