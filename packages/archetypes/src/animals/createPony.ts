import {
  type Archetype,
  ArchetypeBand,
  ArchetypeDraw,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { EquidSegments } from "./EquidSegments";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { createHorse } from "./createHorse";

/**
 * A pony of a measured breed, with its tack: the horse's build (`createHorse.equid`) at that breed's size and proportions, under a riding saddle or in a driving harness, with the horse's contacts.
 *
 * The breed is given or drawn whole from the seed (`ArchetypeDraw.pick`): a Shetland, a Welsh Mountain Pony, a Welsh Pony, a Dartmoor or a Connemara, each as Brooks et al. 2010's measured animals of that breed average (`EquidSegments.BREEDS`). Its height at the withers and its heart girth are its breed's, and its bones are the horse's fractions of the height, each measured one scaled by its breed's surface measure against the Thoroughbred's (`EquidSegments.lengths`), so a pony is one breed's body, never a blend of two. Its mass is shared among its bones as the horse's is: Nauwelaerts et al. 2011 found that an equid's mass distribution does not change with size below 600 kg, so Kubo's horse shares hold for a pony. It rides as the horse does, its timing the horse's measured table scaled to its height by dynamic similarity (`QuadrupedGait.scale`).
 *
 * @param params The breed, the tack and any dimension the author fixes.
 * @param seed The seed that draws the breed and every dimension left free inside its band; absent, the Shetland, and each dimension the middle of its band.
 * @returns The pony.
 * @throws {ArchetypeRefusal} For a breed not in `BREEDS`, a fixed dimension outside its band (the height and the girth are the breed's own), or a tack that is not one of `createHorse.TACKS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the pony shares with the horse, how its breed is chosen, how its size, proportions and mass shares are derived and how it rides.
 * @evidence contracts/development/implementation.md#principled-implementation The breed drawn whole over the measured breeds, then the horse's equid builder on that breed's profile: its own height and girth, bone fractions from its own measures (Brooks et al. 2010), the horse's mass shares by Nauwelaerts et al. 2011's size-independence below 600 kg, and the mass band of van den Bogert's ponies.
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
  const breed: createPony.Breed = ArchetypeDraw.pick(
    createPony.ARCHETYPE,
    "breed",
    params.breed,
    createPony.BREEDS,
    seed,
  );
  return createHorse.equid(createPony.profile(breed), params, seed);
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

  /** Every breed, the default first. */
  export const BREEDS: readonly Breed[] = [
    "shetland",
    "welshMountain",
    "welshPony",
    "dartmoor",
    "connemara",
  ];

  /** The parameters: the breed, the tack, and any free dimension fixed to a value inside its band. */
  export interface IParams extends createHorse.IParams {
    /** The breed; drawn from the seed when absent. */
    breed?: Breed;
  }

  /**
   * The band of each free dimension of a pony of a breed: the breed's own height at the withers and heart girth, the mass of van den Bogert's ponies, and the horse's tack and tempo, which the rider's hand and foot and the gait's spread set, not the pony's size.
   *
   * @param breed The breed.
   * @returns The bands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each band's source.
   * @evidence contracts/development/implementation.md#principled-implementation The breed's means as single values, the mass as the measured sample's spread.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The horse's bands with three replaced.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function, called once per pony.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bands(
    breed: Breed,
  ): Readonly<Record<createHorse.Dimension, IArchetypeBand>> {
    const measured: EquidSegments.IBreed = EquidSegments.BREEDS[breed];
    const source: string = `the ${breed} breed's mean in Brooks et al. 2010's published rows (\`EquidSegments.BREEDS\`)`;
    const withers: number = measured.withers * ArchetypeUnits.CENTIMETRE;
    const girth: number = measured.girth * ArchetypeUnits.CENTIMETRE;
    return {
      ...HORSE_BANDS,
      withersHeight: ArchetypeBand.metres(withers, withers, `the height at the withers, ${source}`),
      girth: ArchetypeBand.metres(girth, girth, `the heart girth, ${source}`),
      mass: ArchetypeBand.of(
        "kg",
        165,
        240,
        "van den Bogert 1989's five ponies, \"One study used five ponies with mass 165–240 kg\", as Nauwelaerts, Allen, Lane and Clayton 2011, J Anat 218:500, Introduction, report it (https://pmc.ncbi.nlm.nih.gov/articles/PMC3089746)",
      ),
    };
  }

  /**
   * A pony breed's profile: its name, bands and body, the horse's with its own bone fractions.
   *
   * @param breed The breed.
   * @returns The profile.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it gives.
   * @evidence contracts/development/implementation.md#principled-implementation The breed's bands and its own measures' bone fractions on the horse's body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to refuse.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `bands` and `EquidSegments.lengths`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function profile(breed: Breed): createHorse.IProfile {
    return {
      archetype: ARCHETYPE,
      names: { saddle: "saddle pony", harness: "driving pony" },
      bands: bands(breed),
      body: {
        ...createHorse.BODY,
        lengths: EquidSegments.lengths(EquidSegments.BREEDS[breed]),
      },
    };
  }
}
