import { type AutoMovieArchetype } from "../core";
import { ArmourLimb } from "./ArmourLimb";
import { CostumeConstruction } from "./CostumeConstruction";
import type { createArmour } from "./createArmour";

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
export function createCostumeGauntlet(
  params: createCostumeGauntlet.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createCostumeGauntlet.Affordance,
  createCostumeGauntlet.Dimension
> {
  return CostumeConstruction("gauntlet", params, seed, ArmourLimb);
}

/** Authoring options for {@link createCostumeGauntlet}. */
export namespace createCostumeGauntlet {
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
    createArmour.IParams,
    "id" | "thickness" | "measure"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }
}
