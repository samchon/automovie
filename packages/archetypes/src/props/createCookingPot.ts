import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { VesselConstruction } from "./VesselConstruction";
import type { createVessel } from "./createVessel";

/**
 * A saucepan with a long handle or a stockpot with paired side handles.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createCookingPot(
  params: createCookingPot.IParams,
  seed?: number,
): AutoMovieArchetype<createCookingPot.Affordance, createCookingPot.Dimension> {
  return VesselConstruction.cookingPot(
    ArchetypeDraw.choice("vessel", "kind", params.kind, createCookingPot.KINDS),
    params,
    seed,
  );
}

/** The authorable settings and local contact IDs of {@link createCookingPot}. */
export namespace createCookingPot {
  /** The `kind` choices this producer admits. */
  export type Kind = "saucepan" | "stockpot";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "height" | "mass";

  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "handle"
    | "inside"
    | "leftHandle"
    | "rightHandle"
    | "rim";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<
    createVessel.IParams,
    "id" | "diameter" | "height" | "mass"
  > {
    /** A single long handle or a two-handle cooking pot. */
    kind: Kind;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["saucepan", "stockpot"];
}
