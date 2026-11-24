import type { AutoMovieArchetype } from "../core";
import { ScenicContainerConstruction } from "./ScenicContainerConstruction";
import type { createScenicContainer } from "./createScenicContainer";

/**
 * An open molded crate with a floor suitable for receiving arranged loads.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createMoldedCrate(
  params: createMoldedCrate.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createMoldedCrate.Affordance,
  createMoldedCrate.Dimension
> {
  return ScenicContainerConstruction.openCrate(params, seed);
}

/** The authorable settings and local contact IDs of {@link createMoldedCrate}. */
export namespace createMoldedCrate {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "inside";

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createScenicContainer.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
