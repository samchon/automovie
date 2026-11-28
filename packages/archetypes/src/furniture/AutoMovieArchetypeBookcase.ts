import type { AutoMovieArchetype } from "../core";
import { StorageMechanisms } from "./internal/StorageMechanisms";
import type { AutoMovieArchetypeStorage } from "./AutoMovieArchetypeStorage";

/** Constructs an open bookcase with individually addressable shelves. */
export namespace AutoMovieArchetypeBookcase {
  /**
   * Build a floor-standing bookcase with five open shelf supports.
   *
   * The body spans 0.80 by 0.28 metres and stands 2.02 metres high.
   * The supports divide that height into six equal steps.
   *
   * @param params Optional model ID and fixed dimensions in the band units.
   *   Defaults to ID `storage` and the standard BILLY body size.
   * @param seed Numeric seed for any free dimensions. Omit it for the
   *   34 kg mass midpoint.
   * @returns The bookcase with side `push`, `top` and five `stack-top`
   *   shelf contacts.
   * @throws {AutoMovieArchetypeRefusal} If an authored dimension lies
   *   outside the bookcase's bands.
   * @example
   *   const shelves = AutoMovieArchetypeBookcase.create({ id: "shelves" });
   *   const first = shelves.affordance("shelf1");
   */
export function create(
  params: AutoMovieArchetypeBookcase.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBookcase.Affordance, AutoMovieArchetypeBookcase.Dimension> {
  return StorageMechanisms.bookcase(params, seed);
}


  /* The authorable settings and local contact IDs of {@link AutoMovieArchetypeBookcase}. */
  /** Body width, depth and height in metres and empty mass in kilograms. */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /**
   * The `+X` side `push` surface, the roof `top` surface and `shelf1` through `shelf5` from the bottom.
   */
  export type Affordance = "push" | "top" | `shelf${number}`;

  /**
   * Optional scene ID, width, depth, height and mass. See the `bookcase` row of `AutoMovieArchetypeStorage.BANDS`.
   */
  export type IParams = Pick<
    AutoMovieArchetypeStorage.IParams,
    "id" | "width" | "depth" | "height" | "mass"
  >;
}
