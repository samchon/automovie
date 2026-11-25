import type { AutoMovieArchetype } from "../core";
import { StorageMechanisms } from "./StorageMechanisms";
import type { createStorage } from "./createStorage";

/**
 * An open bookcase with individually named shelf supports.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createBookcase(
  params: createBookcase.IParams = {},
  seed?: number,
): AutoMovieArchetype<createBookcase.Affordance, createBookcase.Dimension> {
  return StorageMechanisms.bookcase(params, seed);
}

/** The authorable settings and local contact IDs of {@link createBookcase}. */
export namespace createBookcase {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "push" | "top" | `shelf${number}`;

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    createStorage.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
