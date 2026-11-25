import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { createBaseballBat } from "../sport/createBaseballBat";
import { ClubBuild } from "./ClubBuild";
import { createPracticeBaton } from "./createPracticeBaton";

/**
 * Reads a saved club recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or
 *   choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {AutoMovieArchetypeRefusal} When the saved kind, choice or dimension
 *   cannot be realized.
 */
export function createClub(
  params: createClub.IParams,
  seed?: number,
): AutoMovieArchetype<createClub.Affordance, createClub.Dimension> {
  const kind: createClub.Kind = ArchetypeDraw.choice(
    "club",
    "kind",
    params.kind,
    createClub.KINDS,
  );

  // The stored input can carry any former choice. The selected draw admits only its own profile.
  // The saved input spans every variant, so each variant narrows its own kind
  // and model against the lists it makes before it draws.
  const variants: Readonly<
    Record<
      createClub.Kind,
      (
        params: createClub.IParams,
        seed?: number,
      ) => AutoMovieArchetype<createClub.Affordance, createClub.Dimension>
    >
  > = {
    bat: (p, s) => createBaseballBat({ ...p, model: ArchetypeDraw.admit("club", "model", p.model, ["s154", "s155", "t153", "t156"] as const) }, s),
    baton: (p, s) => createPracticeBaton({ ...p, model: ArchetypeDraw.admit("club", "model", p.model, ["mp24", "mp26"] as const) }, s),
  };
  return variants[kind](params, seed);
}

/** Companion types and bands of {@link createClub}. */
export namespace createClub {
  /** The kinds of club. */
  export type Kind = "bat" | "baton";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["bat", "baton"];

  /**
   * A bat's barrel length, metres: about 10 in (Nathan, Smith and Russell 2026,
   * Introduction).
   */
  export const BARREL: typeof ClubBuild.BARREL = ClubBuild.BARREL;

  /**
   * The striking place from the tip, metres: a bat's sweet spot, 5 to 6 in from
   * the barrel's tip (Nathan, Smith and Russell 2026, Introduction).
   */
  export const SWEET: typeof ClubBuild.SWEET = ClubBuild.SWEET;

  /**
   * A bat's knob diameter, metres: about 2.0 in, read off the profile plotted
   * in Nathan, Smith and Russell 2026, Figure 2, not a stated number.
   */
  export const KNOB: typeof ClubBuild.KNOB = ClubBuild.KNOB;

  /**
   * A bat's knob length along the bat, metres. An estimate, not read at a
   * source.
   */
  export const KNOB_LENGTH: typeof ClubBuild.KNOB_LENGTH =
    ClubBuild.KNOB_LENGTH;

  /**
   * The run of a bat's handle two hands take, one above the other, metres. An
   * estimate, not read at a source; a handle shorter than this above the knob
   * is held over all of it.
   */
  export const HANDS: typeof ClubBuild.HANDS = ClubBuild.HANDS;

  /**
   * The affordance ids:
   *
   * - `grip`: where the hands hold the club, taken from the `-Z` side: both hands
   *   on a bat's slender handle, over a run that starts at the top of the knob
   *   and is `HANDS` long or, on a shorter handle, ends where the first taper
   *   step begins, so the whole run has the handle's diameter; one hand near a
   *   baton's butt.
   * - `strike`: the place on the `+Z` side that meets what is hit, at a bat's
   *   sweet spot.
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

  /**
   * The read models: the four maple bats S154, S155, T153 and T156, and the
   * Monadnock MP24 and MP26 batons.
   */
  export type Model = "s154" | "s155" | "t153" | "t156" | "mp24" | "mp26";

  /**
   * Each kind's models whole, the default first: the bats' length and weight in
   * Nathan, Smith and Russell, Studies of the Torpedo Bat, ISEA 2026, Table 1
   * (https://baseball.physics.illinois.edu/ISEA2026-Torpedo-v7.pdf), and the
   * batons' lengths (https://www.defense-technology.com/?p=2138).
   */
  export const MODELS: typeof ClubBuild.MODELS = ClubBuild.MODELS;

  /**
   * The parameters: the kind, the model, and any free dimension fixed to a
   * value inside its band.
   */
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
