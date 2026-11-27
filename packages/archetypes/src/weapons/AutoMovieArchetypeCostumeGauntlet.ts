import { type AutoMovieArchetype } from "../core/index";
import { createCostumeGauntlet as createCostumeGauntletImplementation } from "./internal/createCostumeGauntlet";
import { type AutoMovieArchetypeArmour } from "./AutoMovieArchetypeArmour";

/** Public operations for Auto Movie Archetype Costume Gauntlet. */
export namespace AutoMovieArchetypeCostumeGauntlet {
  /**
   * Worn gauntlet costume.
   *
   * A segmented costume piece registered to the chosen hand through its wear
   * frame.
   *
   * @param params The scene id and optional measurements and model choice of this
   *   costume.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeCostumeGauntlet.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCostumeGauntlet.Affordance,
  AutoMovieArchetypeCostumeGauntlet.Dimension
> {
    return createCostumeGauntletImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "met23255" | "met23256" | "met23199";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "thickness" | "width";

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "wear";

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeArmour.IParams,
    "id" | "thickness" | "measure"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }}
