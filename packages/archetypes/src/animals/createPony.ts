import {
  type Archetype,
  ArchetypeDrawSession,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { EquidSegments } from "./EquidSegments";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { createHorse } from "./createHorse";

/**
 * A pony of a measured breed, with its tack: the horse's build (`createHorse.equid`) at that breed's size and proportions, under a riding saddle or in a driving harness, with the horse's contacts.
 *
 * The breed is given or drawn whole from the seed (`ArchetypeDrawSession.model`, its figures `MEASURES`): a Shetland, a Welsh Mountain Pony, a Welsh Pony, a Dartmoor or a Connemara, each as Brooks et al. 2010's measured animals of that breed average (`EquidSegments.BREEDS`). Its height at the withers and its heart girth are its breed's, its mass follows them by the girth-squared-times-length law anchored on weighed warmbloods (`createHorse.mass`), and its bones are the horse's fractions of the height, each measured one scaled by its breed's surface measure against the Thoroughbred's (`EquidSegments.lengths`), so a pony is one breed's body, never a blend of two. Its mass is shared among its bones as the horse's is: Nauwelaerts et al. 2011 found that an equid's mass distribution does not change with size below 600 kg, so Kubo's horse shares hold for a pony. It rides as the horse does, its timing the horse's measured table scaled to its height by dynamic similarity (`QuadrupedGait.scale`).
 *
 * @param params The breed, the tack and any dimension the author fixes.
 * @param seed The seed that draws the breed and every dimension left free inside its band; absent, the Shetland, and each dimension the middle of its band.
 * @returns The pony.
 * @throws {ArchetypeRefusal} For a breed not in `MEASURES`, a fixed dimension outside its band (the height and the girth are the breed's own, so fixing either is refused), or a tack that is not one of `createHorse.TACKS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the pony shares with the horse, how its breed is chosen, how its size, proportions and mass shares are derived and how it rides.
 * @evidence contracts/development/implementation.md#principled-implementation The breed drawn whole over the measured breeds, then the horse's equid builder on that breed's profile: its own height and girth, its mass by `createHorse.mass`, bone fractions from its own measures (Brooks et al. 2010), and the horse's mass shares by Nauwelaerts et al. 2011's size-independence below 600 kg. The law gives the Shetland 174 kg, the Welsh Mountain Pony 250, the Dartmoor 255, the Welsh Pony 330 and the Connemara 427. The weighed ponies read beside it are checks, not anchors, their heights unread: van den Bogert's five of 165 to 240 kg (as Nauwelaerts et al. 2011 report) and Pearson et al. 1998's three of 174, 184 and 220 kg, so the Welsh Pony's and the Connemara's distance above them is no evidence against the law; breed pages give the Connemara about 300 to 450 kg, secondary.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pick the breed, then one call of `createHorse.equid` on its profile.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing between two breeds is produced. The humerus and the femur keep the horse's fractions, provisional as `EquidSegments.lengths` states; the standing angles and the head, neck and tail shapes are the horse's.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The equid builder's own.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the horse's builder, tack and gait table.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPony(
  params: createPony.IParams = {},
  seed?: number | string,
): Archetype<createHorse.Affordance, createHorse.Dimension> {
  const draw: ArchetypeDrawSession<createHorse.Dimension> = new ArchetypeDrawSession<createHorse.Dimension>(
    createPony.ARCHETYPE,
    createHorse.UNITS,
    seed,
    params,
  );
  const breed: ArchetypeDrawSession.IModel<createPony.Breed, createHorse.Dimension> = draw.model<createPony.Breed>(
    "breed",
    params.breed,
    createPony.MEASURES,
  );
  return createHorse.equid(createPony.profile(breed.name!, breed.figures), params, draw);
}

/**
 * Companion types, breeds and profile of {@link createPony}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each member is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the measured breeds, and the horse's equid profile with a breed's name, bands and bone fractions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pony's own data; its tack, contacts and dimensions are the horse's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A breed is built whole from its own means; no band runs across the breeds.
 */
export namespace createPony {
  /** The producer's name. */
  export const ARCHETYPE: string = "pony";

  /** The breeds: the Shetland, the Welsh Mountain Pony (Section A), the Welsh Pony (Section B), the Dartmoor and the Connemara. */
  export type Breed =
    | "shetland"
    | "welshMountain"
    | "welshPony"
    | "dartmoor"
    | "connemara";

  /** Each breed's read figures, the default first: its mean height at the withers and heart girth in Brooks et al. 2010's published rows (`EquidSegments.BREEDS`), in metres. */
  export const MEASURES: Readonly<Record<Breed, Readonly<Partial<Record<createHorse.Dimension, number>>>>> = {
    shetland: measures(EquidSegments.BREEDS.shetland),
    welshMountain: measures(EquidSegments.BREEDS.welshMountain),
    welshPony: measures(EquidSegments.BREEDS.welshPony),
    dartmoor: measures(EquidSegments.BREEDS.dartmoor),
    connemara: measures(EquidSegments.BREEDS.connemara),
  };

  /**
   * A breed's height at the withers and heart girth, metres.
   *
   * @param breed The breed's measures.
   * @returns The figures.
   */
  function measures(breed: EquidSegments.IBreed): Readonly<Partial<Record<createHorse.Dimension, number>>> {
    return {
      withersHeight: breed.withers * ArchetypeUnits.CENTIMETRE,
      girth: breed.girth * ArchetypeUnits.CENTIMETRE,
    };
  }

  /** The parameters: the breed, the tack, and any free dimension fixed to a value inside its band. */
  export interface IParams extends createHorse.IParams {
    /** The breed; drawn from the seed when absent. */
    breed?: Breed;
  }

  /** The band of each dimension a pony draws: the horse's tack and tempo, which the rider's hand and foot and the gait's spread set, not the pony's size; its height is its breed's (`MEASURES`). */
  export const BANDS: Readonly<Partial<Record<createHorse.Free, IArchetypeBand>>> = {
    stirrupDrop: HORSE_BANDS.stirrupDrop,
    stirrupWidth: HORSE_BANDS.stirrupWidth,
    tempo: HORSE_BANDS.tempo,
    breechingDrop: HORSE_BANDS.breechingDrop,
  };

  /**
   * A pony breed's profile: its name, bands, read figures and body, the horse's with its own bone fractions.
   *
   * @param breed The breed.
   * @param figures The breed's read figures (`MEASURES`).
   * @returns The profile.
   */
  export function profile(
    breed: Breed,
    figures: Readonly<Partial<Record<createHorse.Dimension, number>>>,
  ): createHorse.IProfile {
    return {
      archetype: ARCHETYPE,
      names: { saddle: "saddle pony", harness: "driving pony" },
      bands: BANDS,
      figures,
      girth: (): number => figures.girth!,
      body: {
        ...createHorse.BODY,
        lengths: EquidSegments.lengths(EquidSegments.BREEDS[breed]),
      },
    };
  }
}
