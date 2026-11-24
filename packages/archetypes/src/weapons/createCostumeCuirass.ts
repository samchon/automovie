import { type AutoMovieArchetype } from "../core";
import { ArmourTorso } from "./ArmourTorso";
import { CostumeConstruction } from "./CostumeConstruction";
import type { createArmour } from "./createArmour";

/**
 * Worn cuirass costume.
 *
 * A chest-mounted display shell with a body-fit cavity and a distinct wear
 * frame.
 *
 * @param params The scene id and optional measurements and model choice of this
 *   costume.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCostumeCuirass(
  params: createCostumeCuirass.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createCostumeCuirass.Affordance,
  createCostumeCuirass.Dimension
> {
  return CostumeConstruction("cuirass", params, seed, ArmourTorso);
}

/** Authoring options for {@link createCostumeCuirass}. */
export namespace createCostumeCuirass {
  /** The `model` choices this producer admits. */
  export type Model = "met22359" | "met23084";

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
