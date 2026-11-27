import {
  type AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeRefusal,
} from "../core/index";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { HORSE_BANDS } from "./equine/HORSE_BANDS";
import { AutoMovieArchetypeHorse } from "./AutoMovieArchetypeHorse";

/*
 * Withers height over mature height at birth, about 60% (Horse & Hound, a
 * secondary estimate), and at weaning, 84% at six months (Lawrence 2003, as
 * Kentucky Equine Research reports it).
 */
const HEIGHT: Readonly<IEnds> = { birth: 0.6, weaning: 0.84 };

/*
 * Distal limb length over mature length: an authored, provisional 0.85 at
 * birth, and 1 / 1.06 at weaning (Anderson and McIlwraith 2004: 5 to 7% more
 * growth from weaning to three years, the middle taken).
 */
const DISTAL: Readonly<IEnds> = { birth: 0.85, weaning: 1 / 1.06 };

/*
 * The trunk's growth over the height's: authored and provisional.
 */
const TRUNK: number = 0.9;

/*
 * Heart girth over withers height: the horse producer's default figures' ratio,
 * 2.04 m over 1.72 m.
 */
const GIRTH: number = 2.04 / 1.72;

/**
 * Constructs the foal archetype from its recipe.
 *
 * Companion types, growth and profile of {@link createFoal}.
 */
export namespace AutoMovieArchetypeFoal {
/**
 * A foal from birth to weaning: the horse's body at a fraction of a mature
 * horse's height, its distal limbs relatively longer, its trunk relatively
 * shorter.
 *
 * The withers height follows the foal's age between two cited points, linearly
 * between them: about 60% of mature height at birth (Horse & Hound, a secondary
 * estimate) and 84% at six months (Lawrence 2003, as Kentucky Equine Research
 * reports it). The distal limb (cannon and pastern) is nearer its mature
 * length: 1 / 1.06 of it at weaning, since it grows only 5 to 7% more from
 * weaning to three years (Anderson and McIlwraith 2004, Equine Vet J 36:563),
 * and an authored, provisional 0.85 at birth. The proximal limb bones grow with
 * the height; the trunk is an authored, provisional 0.9 of the height's share.
 * Each bone's fraction of the withers height is the horse's
 * (`createHorse.LENGTHS`) scaled by its growth over the height's, so the foal's
 * limbs are longer and its trunk shorter for its height than an adult's. It is
 * a horse to every consumer (its archetype is the horse's) and rides on the
 * horse's gait table, scaled to its own height; its model is named a foal.
 * Weaning is taken at 183 days.
 *
 * @param params The age in days, the mature withers height in metres, the tack
 *   and the id; each is optional.
 * @param seed The seed that draws the horse's free dimensions other than the
 *   withers height, which the age fixes; absent, each takes the middle of its
 *   band.
 * @returns The foal, with the horse's affordances and dimensions.
 * @throws {AutoMovieArchetypeRefusal} For an age below 0 or above 183 days.
 */
export function create(
  params: AutoMovieArchetypeFoal.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
  const age: number = params.age ?? 0;
  if (!(age >= 0 && age <= AutoMovieArchetypeFoal.WEANING))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: AutoMovieArchetypeFoal.ARCHETYPE,
      axis: "age",
      value: age,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: AutoMovieArchetypeFoal.WEANING,
        unit: "days",
      },
      reason: `a foal's age is measured from birth to weaning at ${AutoMovieArchetypeFoal.WEANING} days`,
      fix: "Give an age in days from 0 to weaning.",
    });
  const mature: number = params.mature ?? AutoMovieArchetypeFoal.MATURE;
  const growth: AutoMovieArchetypeFoal.IGrowth = AutoMovieArchetypeFoal.growth(age);
  const withers: number = mature * growth.withers;
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension>(
      AutoMovieArchetypeHorse.PROFILE.archetype,
      AutoMovieArchetypeEquine.UNITS,
      seed,
      {},
    );
  draw.derive("withersHeight", withers);
  return AutoMovieArchetypeEquine.equid(
    AutoMovieArchetypeFoal.profile(withers, growth),
    { tack: params.tack ?? "bare", id: params.id },
    draw,
  );
}
  /** The producer's name. */
  export const ARCHETYPE: string = "foal";

  /** Weaning, days from birth: six months. */
  export const WEANING: number = 183;

  /**
   * The mature height at the withers a foal grows toward when none is given,
   * metres: Kubo et al. 1992's thoroughbreds.
   */
  export const MATURE: number = 1.62;

  /** The parameters. */
  export interface IParams {
    /** Days from birth, 0 to `WEANING`; 0 when absent. */
    age?: number;

    /** The mature height at the withers, metres; `MATURE` when absent. */
    mature?: number;

    /** What the foal wears; `bare` when absent. */
    tack?: AutoMovieArchetypeEquine.Tack;

    /** The model's id. */
    id?: string;
  }

  /** Growth fractions of mature size at an age. */
  export interface IGrowth {
    /** The withers height's. */
    withers: number;

    /** The distal limb's, cannon and pastern. */
    distal: number;

    /** The trunk's. */
    trunk: number;
  }

  /**
   * The growth fractions at an age, linear between birth and weaning.
   *
   * @param age Days from birth, 0 to `WEANING`.
   * @returns The fractions.
   */
  export function growth(age: number): IGrowth {
    const u: number = age / WEANING;
    const withers: number = HEIGHT.birth + (HEIGHT.weaning - HEIGHT.birth) * u;
    return {
      withers,
      distal: DISTAL.birth + (DISTAL.weaning - DISTAL.birth) * u,
      trunk: TRUNK * withers,
    };
  }

  /**
   * A foal's profile at a height and growth: the horse's body with its bone
   * fractions scaled by each bone's growth over the height's.
   *
   * @param withers The foal's height at the withers, metres.
   * @param growth Its growth fractions.
   * @returns The profile.
   */
  export function profile(
    withers: number,
    growth: IGrowth,
  ): AutoMovieArchetypeEquine.IProfile {
    const distal: number = growth.distal / growth.withers;
    const scale = (
      bones: readonly [number, number, number, number],
    ): readonly [number, number, number, number] => [
      bones[0],
      bones[1],
      bones[2] * distal,
      bones[3] * distal,
    ];
    const girth: number = withers * GIRTH;
    return {
      archetype: AutoMovieArchetypeHorse.PROFILE.archetype,
      names: { saddle: "foal", harness: "foal", both: "foal", pack: "foal" },
      bands: {
        stirrupDrop: HORSE_BANDS.stirrupDrop,
        stirrupWidth: HORSE_BANDS.stirrupWidth,
        tempo: HORSE_BANDS.tempo,
        breechingDrop: HORSE_BANDS.breechingDrop,
      },
      figures: { withersHeight: withers, girth },
      girth: (): number => girth,
      body: {
        ...AutoMovieArchetypeHorse.BODY,
        lengths: {
          fore: scale(AutoMovieArchetypeHorse.LENGTHS.fore),
          hind: scale(AutoMovieArchetypeHorse.LENGTHS.hind),
          trunk: (AutoMovieArchetypeHorse.LENGTHS.trunk * growth.trunk) / growth.withers,
        },
      },
    };
  }
}

/*
 * A growth fraction at birth and at weaning.
 */
interface IEnds {
  /*
   * At birth.
   */
  birth: number;

  /*
   * At weaning.
   */
  weaning: number;
}
