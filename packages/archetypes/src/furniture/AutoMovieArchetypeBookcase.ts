import type { AutoMovieArchetype } from "../core";
import { StorageMechanisms } from "./StorageMechanisms";
import type { AutoMovieArchetypeStorage } from "./AutoMovieArchetypeStorage";

/** An open bookcase with named shelf supports. */
export namespace AutoMovieArchetypeBookcase {
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
export function create(
  params: AutoMovieArchetypeBookcase.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBookcase.Affordance, AutoMovieArchetypeBookcase.Dimension> {
  return StorageMechanisms.bookcase(params, seed);
}

}

/** The authorable settings and local contact IDs of {@link AutoMovieArchetypeBookcase}. */
export namespace AutoMovieArchetypeBookcase {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance = "push" | "top" | `shelf${number}`;

  /** The admitted settings and optional model ID. */
  export type IParams = Pick<
    AutoMovieArchetypeStorage.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
