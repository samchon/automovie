import { type AutoMovieArchetype } from "../core/index";
import { createPlankCoffer as createPlankCofferImplementation } from "./internal/createPlankCoffer";
import { type createScenicContainer } from "./internal/createScenicContainer";

/**
 * Constructs a closed plank coffer with a full rectangular support on its lid.
 */
export namespace AutoMovieArchetypePlankCoffer {
  /**
   * Build a plank coffer with a projecting lid at the drawn overall height.
   *
   * The `top` footprint spans the whole lid across X and Z.
   *
   * @param params Optional scene ID and finite width, depth, height and
   *   mass in their bands. The default ID is `scenicContainer`.
   * @param seed Numeric seed for omitted values. Seedless outside sizes
   *   are 0.76 by 0.43 by 0.43 metres in X/Z/Y order.
   * @returns The closed coffer and upward rectangular lid footprint.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: AutoMovieArchetypePlankCoffer.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypePlankCoffer.Affordance,
  AutoMovieArchetypePlankCoffer.Dimension
> {
    return createPlankCofferImplementation(params, seed);
  }

  /**
   * Width and depth of the projecting lid, complete Y height in metres, and mass in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** Upward `top` footprint over the coffer's full lid. */
  export type Affordance = "top";

  /**
   * Optional scene ID and finite outer measurements and mass within the closed-coffer bands.
   */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;}
