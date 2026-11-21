import {
  type Archetype,
  ArchetypeDrawSession,
  ArchetypeRefusal,
} from "../core";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { createHorse } from "./createHorse";

/** Withers height over mature height at birth, about 60% (Horse & Hound, a secondary estimate), and at weaning, 84% at six months (Lawrence 2003, as Kentucky Equine Research reports it). */
const HEIGHT: Readonly<IEnds> = { birth: 0.6, weaning: 0.84 };

/** Distal limb length over mature length: an authored, provisional 0.85 at birth, and 1 / 1.06 at weaning (Anderson and McIlwraith 2004: 5 to 7% more growth from weaning to three years, the middle taken). */
const DISTAL: Readonly<IEnds> = { birth: 0.85, weaning: 1 / 1.06 };

/** The trunk's growth over the height's: authored and provisional. */
const TRUNK: number = 0.9;

/** Heart girth over withers height: the horse producer's default figures' ratio, 2.04 m over 1.72 m. */
const GIRTH: number = 2.04 / 1.72;

/** A growth fraction at birth and at weaning. */
interface IEnds {
  /** At birth. */
  birth: number;

  /** At weaning. */
  weaning: number;
}

/**
 * A foal from birth to weaning: the horse's body at a fraction of a mature horse's height, its distal limbs relatively longer, its trunk relatively shorter.
 *
 * The withers height follows the foal's age between two cited points, linearly between them: about 60% of mature height at birth (Horse & Hound, a secondary estimate) and 84% at six months (Lawrence 2003, as Kentucky Equine Research reports it). The distal limb (cannon and pastern) is nearer its mature length: 1 / 1.06 of it at weaning, since it grows only 5 to 7% more from weaning to three years (Anderson and McIlwraith 2004, Equine Vet J 36:563), and an authored, provisional 0.85 at birth. The proximal limb bones grow with the height; the trunk is an authored, provisional 0.9 of the height's share. Each bone's fraction of the withers height is the horse's (`createHorse.LENGTHS`) scaled by its growth over the height's, so the foal's limbs are longer and its trunk shorter for its height than an adult's. It is a horse to every consumer (its archetype is the horse's) and rides on the horse's gait table, scaled to its own height; its model is named a foal. Weaning is taken at 183 days.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each growth curve, its source or that it is authored and provisional, how the bone fractions follow and the age range.
 * @evidence contracts/development/implementation.md#principled-implementation The horse's equid builder on a foal profile whose height and bone fractions are the growth curves at the age.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the age, build the profile, build the equid.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An age outside birth to weaning refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over the horse's build.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the horse's body, builder and tack.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The producer retains nothing.
 */
export function createFoal(
  params: createFoal.IParams = {},
  seed?: number | string,
): Archetype<createHorse.Affordance, createHorse.Dimension> {
  const age: number = params.age ?? 0;
  if (!(Number.isFinite(age) && age >= 0 && age <= createFoal.WEANING))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: createFoal.ARCHETYPE,
      axis: "age",
      value: age,
      feasible: { min: 0, max: createFoal.WEANING },
      reason: `a foal's age is measured from birth to weaning at ${createFoal.WEANING} days`,
      fix: "Give an age in days from 0 to weaning.",
    });
  const mature: number = params.mature ?? createFoal.MATURE;
  const growth: createFoal.IGrowth = createFoal.growth(age);
  const withers: number = mature * growth.withers;
  const draw: ArchetypeDrawSession<createHorse.Dimension> =
    new ArchetypeDrawSession<createHorse.Dimension>(
      createHorse.PROFILE.archetype,
      createHorse.UNITS,
      seed,
      {},
    );
  draw.derive("withersHeight", withers);
  return createHorse.equid(
    createFoal.profile(withers, growth),
    { tack: params.tack ?? "bare", id: params.id },
    draw,
  );
}

/**
 * Companion types, growth and profile of {@link createFoal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation An age in days and growth fractions of mature size.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The foal's own data; its tack, contacts and dimensions are the horse's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The provisional fractions are named as such.
 */
export namespace createFoal {
  /** The producer's name. */
  export const ARCHETYPE: string = "foal";

  /** Weaning, days from birth: six months. */
  export const WEANING: number = 183;

  /** The mature height at the withers a foal grows toward when none is given, metres: Kubo et al. 1992's thoroughbreds. */
  export const MATURE: number = 1.62;

  /**
   * The parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Days and metres.
   * @evidence contracts/development/design.md#principled-representation An age, a mature height and the horse's tack and id.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `createFoal` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IParams {
    /** Days from birth, 0 to `WEANING`; 0 when absent. */
    age?: number;

    /** The mature height at the withers, metres; `MATURE` when absent. */
    mature?: number;

    /** What the foal wears; `bare` when absent. */
    tack?: createHorse.Tack;

    /** The model's id. */
    id?: string;
  }

  /**
   * Growth fractions of mature size at an age.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member is a fraction of the mature size.
   * @evidence contracts/development/design.md#principled-representation Three fractions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `growth`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the end values and their sources.
   * @evidence contracts/development/implementation.md#principled-implementation Linear interpolation between the birth and weaning values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One share.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by the producer.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * A foal's profile at a height and growth: the horse's body with its bone fractions scaled by each bone's growth over the height's.
   *
   * @param withers The foal's height at the withers, metres.
   * @param growth Its growth fractions.
   * @returns The profile.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the scaling.
   * @evidence contracts/development/implementation.md#principled-implementation A bone's fraction of the height is the adult's times its growth over the height's growth: proximal bones grow with the height, so theirs is unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One profile record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the horse's body.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh profile.
   */
  export function profile(
    withers: number,
    growth: IGrowth,
  ): createHorse.IProfile {
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
      archetype: createHorse.PROFILE.archetype,
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
        ...createHorse.BODY,
        lengths: {
          fore: scale(createHorse.LENGTHS.fore),
          hind: scale(createHorse.LENGTHS.hind),
          trunk: (createHorse.LENGTHS.trunk * growth.trunk) / growth.withers,
        },
      },
    };
  }
}
