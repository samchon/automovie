import {
  type AutoMovieArchetype,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { EquineSegments } from "./EquineSegments";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { createHorse } from "./createHorse";

/**
 * A pony of a measured breed, with its tack: the horse's build
 * (`AutoMovieArchetypeEquine.equid`) at that breed's size and proportions,
 * under a riding saddle, in a driving harness or under a pack saddle, with the
 * horse's contacts.
 *
 * The breed is given or drawn whole from the seed
 * (`AutoMovieArchetypeDrawSession.model`, its figures `MEASURES`): a Shetland,
 * a Welsh Mountain Pony, a Welsh Pony, a Dartmoor or a Connemara, each as
 * Brooks et al. 2010's measured animals of that breed average
 * (`EquineSegments.BREEDS`). Its height at the withers and its heart girth are
 * its breed's, its mass follows them by the girth-squared-times-length law
 * anchored on weighed warmbloods (`AutoMovieArchetypeEquine.mass`), and its
 * bones are the horse's fractions of the height, each measured one scaled by
 * its breed's surface measure against the Thoroughbred's
 * (`EquineSegments.lengths`), so a pony is one breed's body, never a blend of
 * two. Its mass is shared among its bones as the horse's is: Nauwelaerts et al.
 * 2011 found that an equid's mass distribution does not change with size below
 * 600 kg, so Kubo's horse shares hold for a pony. It rides as the horse does,
 * its timing the horse's measured table scaled to its height by dynamic
 * similarity (`AutoMovieArchetypeQuadrupedGait.scale`).
 *
 * @param params The breed, the tack and any dimension the author fixes.
 * @param seed The seed that draws the breed and every dimension left free
 *   inside its band; absent, the Shetland, and each dimension the middle of its
 *   band.
 * @returns The pony.
 * @throws {AutoMovieArchetypeRefusal} For a breed not in `MEASURES`, a fixed
 *   dimension outside its band (the height and the girth are the breed's own,
 *   so fixing either is refused), or a tack that is not one of
 *   `AutoMovieArchetypeEquine.TACKS`.
 */
export function createPony(
  params: createPony.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension>(
      createPony.ARCHETYPE,
      AutoMovieArchetypeEquine.UNITS,
      seed,
      params,
    );
  const breed: AutoMovieArchetypeDrawSession.IModel<
    createPony.Breed,
    AutoMovieArchetypeEquine.Dimension
  > = draw.model<createPony.Breed>("breed", params.breed, createPony.MEASURES);
  return AutoMovieArchetypeEquine.equid(
    createPony.profile(breed.name!, breed.figures),
    params,
    draw,
  );
}

/** Companion types, breeds and profile of {@link createPony}. */
export namespace createPony {
  /** The producer's name. */
  export const ARCHETYPE: string = "pony";

  /**
   * The breeds: the Shetland, the Welsh Mountain Pony (Section A), the Welsh
   * Pony (Section B), the Dartmoor and the Connemara.
   */
  export type Breed =
    | "shetland"
    | "welshMountain"
    | "welshPony"
    | "dartmoor"
    | "connemara";

  /**
   * Each breed's read figures, the default first: its mean height at the
   * withers and heart girth in Brooks et al. 2010's published rows
   * (`EquineSegments.BREEDS`), in metres.
   */
  export const MEASURES: Readonly<
    Record<
      Breed,
      Readonly<Partial<Record<AutoMovieArchetypeEquine.Dimension, number>>>
    >
  > = {
    shetland: measures(EquineSegments.BREEDS.shetland),
    welshMountain: measures(EquineSegments.BREEDS.welshMountain),
    welshPony: measures(EquineSegments.BREEDS.welshPony),
    dartmoor: measures(EquineSegments.BREEDS.dartmoor),
    connemara: measures(EquineSegments.BREEDS.connemara),
  };

  /**
   * A breed's height at the withers and heart girth, metres.
   *
   * @param breed The breed's measures.
   * @returns The figures.
   */
  function measures(
    breed: EquineSegments.IBreed,
  ): Readonly<Partial<Record<AutoMovieArchetypeEquine.Dimension, number>>> {
    return {
      withersHeight: breed.withers * AutoMovieArchetypeUnits.CENTIMETRE,
      girth: breed.girth * AutoMovieArchetypeUnits.CENTIMETRE,
    };
  }

  /**
   * The parameters: the breed, the tack, and any free dimension fixed to a
   * value inside its band.
   */
  export interface IParams extends AutoMovieArchetypeEquine.IParams {
    /** The breed; drawn from the seed when absent. */
    breed?: Breed;
  }

  /**
   * The band of each dimension a pony draws: the horse's tack and tempo, which
   * the rider's hand and foot and the gait's spread set, not the pony's size;
   * its height is its breed's (`MEASURES`).
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
   * A pony breed's profile: its name, bands, read figures and body, the horse's
   * with its own bone fractions.
   *
   * @param breed The breed.
   * @param figures The breed's read figures (`MEASURES`).
   * @returns The profile.
   */
  export function profile(
    breed: Breed,
    figures: Readonly<
      Partial<Record<AutoMovieArchetypeEquine.Dimension, number>>
    >,
  ): AutoMovieArchetypeEquine.IProfile {
    return {
      archetype: ARCHETYPE,
      names: {
        saddle: "saddle pony",
        harness: "driving pony",
        both: "postilion pony",
        pack: "pack pony",
      },
      bands: BANDS,
      figures,
      girth: (): number => figures.girth!,
      body: {
        ...createHorse.BODY,
        lengths: EquineSegments.lengths(EquineSegments.BREEDS[breed]),
      },
    };
  }
}
