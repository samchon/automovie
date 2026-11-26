import { type AutoMovieArchetype } from "../core/index";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { createMule as createMuleImplementation } from "./internal/createMule";
import { AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand } from "../core";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { createHorse } from "./createHorse";
import { AutoMovieArchetypeEquineEarProfiles } from "./AutoMovieArchetypeEquineEarProfiles";

/** Public operations for Auto Movie Archetype Mule. */
export namespace AutoMovieArchetypeMule {
  /**
   * A mule with its tack: the horse's build (`AutoMovieArchetypeEquine.equid`) at
   * a mule's size, under a riding saddle, in a driving harness or under a pack
   * saddle, with the horse's contacts.
   *
   * The mule is given or drawn whole by sex
   * (`AutoMovieArchetypeDrawSession.model`, its figures `MEASURES`): the mean
   * female or male of 94 weighed working mules (Velásquez Mosquera et al. 2020),
   * its height at the withers, heart girth and weighed mass all that sex's, so a
   * mule is one sex's body, never a blend. Its bones are the horse's fractions of
   * the height, provisional: no study measures a mule's segments. It rides the
   * horse's measured gaits scaled to its height (`createQuadruped.SPECIES`). The
   * added ear plates transfer a separate same-sex Araucan donor's paired
   * ear-length/breadth/height means, as AutoMovieArchetypeEquineEarProfiles
   * documents. Their thickness and diagonal neutral pose are authored rectangular
   * proxies, not anatomy.
   *
   * @param params The sex, the tack and any dimension the author fixes.
   * @param seed The seed that draws the sex and every dimension left free inside
   *   its band; absent, the female, and each dimension the middle of its band.
   * @returns The mule.
   * @throws {AutoMovieArchetypeRefusal} For a sex not in `MEASURES`, a fixed
   *   dimension outside its band (the height is the sex's own, so fixing it is
   *   refused), or a tack that is not one of `AutoMovieArchetypeEquine.TACKS`.
   */
  export function create(params?: AutoMovieArchetypeMule.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
    return createMuleImplementation(params, seed);
  }

  /** The producer's name. */
  export const ARCHETYPE: string = "mule";

  /** The sexes. */
  export type Sex = "female" | "male";

  /**
   * Each sex's read figures, the default first: Velásquez Mosquera, Corrales
   * Alvarez and Bespalhok Jacometo 2020, Acta Sci Anim Sci 42:e46379, p. 3,
   * Table 1, means of 55 females and 39 males, each weighed: height at the
   * withers 130.40 and 135.28 cm, thoracic perimeter 147.85 and 152.58 cm, body
   * weight 275.36 and 298.88 kg
   * (https://www.redalyc.org/journal/3031/303162575011/303162575011.pdf).
   */
  export const MEASURES: Readonly<
    Record<
      Sex,
      Readonly<Partial<Record<AutoMovieArchetypeEquine.Dimension, number>>>
    >
  > = {
    female: {
      withersHeight: 130.4 * AutoMovieArchetypeUnits.CENTIMETRE,
      girth: 147.85 * AutoMovieArchetypeUnits.CENTIMETRE,
      mass: 275.36,
    },
    male: {
      withersHeight: 135.28 * AutoMovieArchetypeUnits.CENTIMETRE,
      girth: 152.58 * AutoMovieArchetypeUnits.CENTIMETRE,
      mass: 298.88,
    },
  };

  /**
   * The parameters: the sex, the tack, and any free dimension fixed to a value
   * inside its band.
   */
  export interface IParams extends AutoMovieArchetypeEquine.IParams {
    /** The sex; drawn from the seed when absent. */
    sex?: Sex;
  }

  /**
   * The band of each dimension a mule draws: the horse's tack and tempo, which
   * the rider's hand and foot and the gait's spread set, not the mule's size;
   * its height is its sex's (`MEASURES`).
   */
  export const BANDS: Readonly<
    Partial<Record<AutoMovieArchetypeEquine.Free, IAutoMovieArchetypeBand>>
  > = {
    stirrupDrop: HORSE_BANDS.stirrupDrop,
    stirrupWidth: HORSE_BANDS.stirrupWidth,
    tempo: HORSE_BANDS.tempo,
    breechingDrop: HORSE_BANDS.breechingDrop,
  };

  /**
   * A mule sex's profile: unchanged read body/mass and explicitly transferred
   * ear plates.
   *
   * @param figures The sex's read figures (`MEASURES`).
   * @param sex Ear donor sex, female for the legacy one-argument profile call.
   * @returns The profile.
   */
  export function profile(
    figures: Readonly<
      Partial<Record<AutoMovieArchetypeEquine.Dimension, number>>
    >,
    sex: Sex = "female",
  ): AutoMovieArchetypeEquine.IProfile {
    return {
      archetype: ARCHETYPE,
      names: {
        saddle: "saddle mule",
        harness: "driving mule",
        both: "postilion mule",
        pack: "pack mule",
      },
      bands: BANDS,
      figures,
      girth: (): number => figures.girth!,
      mass: figures.mass!,
      body: {
        ...createHorse.BODY,
        head: {
          ...createHorse.BODY.head,
          ears: AutoMovieArchetypeEquineEarProfiles.mule(sex),
        },
      },
    };
  }}
