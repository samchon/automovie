import { type AutoMovieArchetype } from "../core/index";
import { createCostumeVambrace as createCostumeVambraceImplementation } from "./internal/createCostumeVambrace";
import { type AutoMovieArchetypeArmour } from "./AutoMovieArchetypeArmour";

/** Public operations for Auto Movie Archetype Costume Vambrace. */
export namespace AutoMovieArchetypeCostumeVambrace {
  /**
   * Worn forearm costume.
   *
   * A hollow costume shell registered to a lower-arm segment by the wear frame.
   *
   * @param params The scene id and optional measurements and model choice of this
   *   costume.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeCostumeVambrace.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCostumeVambrace.Affordance,
  AutoMovieArchetypeCostumeVambrace.Dimension
> {
    return createCostumeVambraceImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "met24896" | "met35850";

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
