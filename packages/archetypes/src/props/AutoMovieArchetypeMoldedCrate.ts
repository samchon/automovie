import { type AutoMovieArchetype } from "../core/index";
import { createMoldedCrate as createMoldedCrateImplementation } from "./internal/createMoldedCrate";
import { type createScenicContainer } from "./internal/createScenicContainer";

/**
 * Constructs an open molded crate with a supported floor inside its ribbed walls.
 */
export namespace AutoMovieArchetypeMoldedCrate {
  /**
   * Build a ribbed crate around a flat floor, with its bottom at Y zero.
   *
   * The upward `inside` rectangle lies on the floor inside the side walls.
   * The floor top sits at twelve percent of the outer height.
   *
   * @param params Optional scene ID and finite width, depth, height and
   *   mass in their bands. The default ID is `scenicContainer`.
   * @param seed Numeric seed for omitted values. Seedless outer sizes
   *   are 0.35 by 0.35 by 0.28 metres in X/Z/Y order.
   * @returns The open crate and its supported interior floor.
   * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeMoldedCrate.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeMoldedCrate.Affordance,
  AutoMovieArchetypeMoldedCrate.Dimension
> {
    return createMoldedCrateImplementation(params, seed);
  }

  /**
   * Outer width, depth and height in metres, and estimated crate mass in kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /**
   * Upward `inside` rectangle supported by the crate floor within its walls.
   */
  export type Affordance = "inside";

  /**
   * Optional scene ID and finite outside dimensions and mass within the molded-crate bands.
   */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;}
