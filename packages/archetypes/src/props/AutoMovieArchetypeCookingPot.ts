import { type AutoMovieArchetype } from "../core/index";
import { createCookingPot as createCookingPotImplementation } from "./internal/createCookingPot";
import { type AutoMovieArchetypeVessel } from "./AutoMovieArchetypeVessel";

/** Public operations for Auto Movie Archetype Cooking Pot. */
export namespace AutoMovieArchetypeCookingPot {
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
  export function create(params: AutoMovieArchetypeCookingPot.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeCookingPot.Affordance, AutoMovieArchetypeCookingPot.Dimension> {
    return createCookingPotImplementation(params, seed);
  }

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
    AutoMovieArchetypeVessel.IParams,
    "id" | "diameter" | "height" | "mass"
  > {
    /** A single long handle or a two-handle cooking pot. */
    kind: Kind;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["saucepan", "stockpot"];}
