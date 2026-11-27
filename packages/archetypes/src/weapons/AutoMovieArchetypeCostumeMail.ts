import { type AutoMovieArchetype } from "../core/index";
import { createCostumeMail as createCostumeMailImplementation } from "./internal/createCostumeMail";
import { type AutoMovieArchetypeArmour } from "./AutoMovieArchetypeArmour";

/** Public operations for Auto Movie Archetype Costume Mail. */
export namespace AutoMovieArchetypeCostumeMail {
  /**
   * Worn mail costume.
   *
   * A torso-mounted costume shirt with a cavity, sleeve openings and existing
   * wear frame.
   *
   * @param params The scene id and optional measurements and model choice of this
   *   costume.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeCostumeMail.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeCostumeMail.Affordance,
  AutoMovieArchetypeCostumeMail.Dimension
> {
    return createCostumeMailImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "met34324" | "met22415" | "met633538" | "met27635";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /**
   * The contacts this producer builds; a numbered family's count follows its
   * inputs.
   */
  export type Affordance = "wear";

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeArmour.IParams,
    "id" | "measure"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }}
