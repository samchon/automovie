import { type Archetype, ArchetypeDraw } from "../core";
import { createBaseballBat } from "../sport/createBaseballBat";
import { ClubBuild } from "./ClubBuild";
import { createPracticeBaton } from "./createPracticeBaton";

/**
 * Reads a saved club recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {ArchetypeRefusal} When the saved kind, choice or dimension cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the saved input and selected model.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the saved kind and use its producer's bands and original seed domain.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the kind and call the corresponding public producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The selected producer still validates the original dimensions and choices.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed kind table selects the producer.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The saved and named calls use the same construction.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The call retains no inputs.
 */
export function createClub(
  params: createClub.IParams,
  seed?: number | string,
): Archetype<createClub.Affordance, createClub.Dimension> {
  const kind: createClub.Kind = ArchetypeDraw.choice(
    "club",
    "kind",
    params.kind,
    createClub.KINDS,
  );

  // The stored input can carry any former choice. The selected draw admits only its own profile.
  const produce: (
    params: createClub.IParams,
    seed?: number | string,
  ) => Archetype<createClub.Affordance, createClub.Dimension> = createClub
    .PRODUCERS[kind] as typeof produce;
  return produce(params, seed);
}

/**
 * Companion types and bands of {@link createClub}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation Closed unions of kinds and read models, each model whole, and one cited band per dimension a model leaves; a bat's profile constants are lengths along it, named.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The length, the mass and the handle a swing reads (#3374), and the two contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared: both follow from the shape. Nothing between two models is drawn; Cross's 84 cm bat is aluminium, so it is not one of this solid wood bat's models.
 */
export namespace createClub {
  /** The kinds of club. */
  export type Kind = "bat" | "baton";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["bat", "baton"];

  /** A bat's barrel length, metres: about 10 in (Nathan, Smith and Russell 2026, Introduction). */
  export const BARREL: typeof ClubBuild.BARREL = ClubBuild.BARREL;

  /** The striking place from the tip, metres: a bat's sweet spot, 5 to 6 in from the barrel's tip (Nathan, Smith and Russell 2026, Introduction). */
  export const SWEET: typeof ClubBuild.SWEET = ClubBuild.SWEET;

  /** A bat's knob diameter, metres: about 2.0 in, read off the profile plotted in Nathan, Smith and Russell 2026, Figure 2, not a stated number. */
  export const KNOB: typeof ClubBuild.KNOB = ClubBuild.KNOB;

  /** A bat's knob length along the bat, metres. An estimate, not read at a source. */
  export const KNOB_LENGTH: typeof ClubBuild.KNOB_LENGTH =
    ClubBuild.KNOB_LENGTH;

  /** The run of a bat's handle two hands take, one above the other, metres. An estimate, not read at a source; a handle shorter than this above the knob is held over all of it. */
  export const HANDS: typeof ClubBuild.HANDS = ClubBuild.HANDS;

  /**
   * The affordance ids:
   *
   * - `grip`: where the hands hold the club, taken from the `-Z` side: both hands on a bat's slender handle, over a run that starts at the top of the knob and is `HANDS` long or, on a shorter handle, ends where the first taper step begins, so the whole run has the handle's diameter; one hand near a baton's butt.
   * - `strike`: the place on the `+Z` side that meets what is hit, at a bat's sweet spot.
   */
  export type Affordance = "grip" | "strike";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the knob or butt to the tip.
   * - `diameter`: the barrel's, or a baton's, thickness.
   * - `handleDiameter`: a bat's handle.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "handleDiameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof ClubBuild.UNITS = ClubBuild.UNITS;

  /** The read models: the four maple bats S154, S155, T153 and T156, and the Monadnock MP24 and MP26 batons. */
  export type Model = "s154" | "s155" | "t153" | "t156" | "mp24" | "mp26";

  /** Each kind's models whole, the default first: the bats' length and weight in Nathan, Smith and Russell, Studies of the Torpedo Bat, ISEA 2026, Table 1 (https://baseball.physics.illinois.edu/ISEA2026-Torpedo-v7.pdf), and the batons' lengths (https://www.defense-technology.com/?p=2138). */
  export const MODELS: typeof ClubBuild.MODELS = ClubBuild.MODELS;

  /** The parameters: the kind, the model, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which club. */
    kind: Kind;

    /** Which of the kind's read models; picked from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `club` when absent. */
    id?: string;
  }

  /** The band of each free dimension a kind's model leaves, by kind. */
  export const BANDS: typeof ClubBuild.BANDS = ClubBuild.BANDS;

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `bat` selector. */
    bat: typeof createBaseballBat;

    /** The named producer for the saved `baton` selector. */
    baton: typeof createPracticeBaton;
  }

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    bat: createBaseballBat,
    baton: createPracticeBaton,
  };
}
