import { type AutoMovieArchetype } from "../core/index";
import { createCostumeGreave as createCostumeGreaveImplementation } from "./internal/createCostumeGreave";
import { type createArmour } from "./createArmour";

/** Public operations for Auto Movie Archetype Costume Greave. */
export namespace AutoMovieArchetypeCostumeGreave {
  /**
   * Worn lower-leg costume.
   *
   * A hollow costume shell registered to a lower-leg segment by the wear frame.
   *
   * @param params The scene id and optional measurements and model choice of this
   *   costume.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeCostumeGreave.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCostumeGreave.Affordance,
  AutoMovieArchetypeCostumeGreave.Dimension
> {
    return createCostumeGreaveImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "met22970" | "met22276";

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
    createArmour.IParams,
    "id" | "thickness" | "measure"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }}
