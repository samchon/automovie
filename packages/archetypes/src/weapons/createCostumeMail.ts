import { type AutoMovieArchetype } from "../core";
import { ArmourTorso } from "./ArmourTorso";
import { CostumeConstruction } from "./CostumeConstruction";
import type { createArmour } from "./createArmour";

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
export function createCostumeMail(
  params: createCostumeMail.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createCostumeMail.Affordance,
  createCostumeMail.Dimension
> {
  return CostumeConstruction("mail", params, seed, ArmourTorso);
}

/** Authoring options for {@link createCostumeMail}. */
export namespace createCostumeMail {
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
    createArmour.IParams,
    "id" | "measure"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }
}
