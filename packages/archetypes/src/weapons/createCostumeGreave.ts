import { type AutoMovieArchetype } from "../core";
import { ArmourLimb } from "./ArmourLimb";
import { CostumeConstruction } from "./CostumeConstruction";
import type { createArmour } from "./createArmour";

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
export function createCostumeGreave(
  params: createCostumeGreave.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createCostumeGreave.Affordance,
  createCostumeGreave.Dimension
> {
  return CostumeConstruction("greave", params, seed, ArmourLimb);
}

/** Authoring options for {@link createCostumeGreave}. */
export namespace createCostumeGreave {
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
  }
}
