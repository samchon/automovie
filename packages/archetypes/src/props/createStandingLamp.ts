import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { PracticalLightConstruction } from "./PracticalLightConstruction";
import type { createLight } from "./createLight";

/**
 * A freestanding table or floor lamp with a positioned light binding.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createStandingLamp(
  params: createStandingLamp.IParams,
  seed?: number,
): AutoMovieArchetype<
  createStandingLamp.Affordance,
  createStandingLamp.Dimension
> {
  return PracticalLightConstruction.standing(
    ArchetypeDraw.choice(
      "light",
      "kind",
      params.kind,
      createStandingLamp.KINDS,
    ),
    params,
    seed,
  );
}

/** The authorable settings and local contact IDs of {@link createStandingLamp}. */
export namespace createStandingLamp {
  /** The `kind` choices this producer admits. */
  export type Kind = "tableLamp" | "floorLamp";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "base"
    | "height"
    | "mass"
    | "overall"
    | "shade"
    | "stem";

  /** The contact IDs declared by this producer. */
  export type Affordance = "grip" | "light";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<
    createLight.IParams,
    "id" | "height" | "shade" | "overall" | "stem" | "base" | "mass"
  > {
    /** The measured table or floor form. */
    kind: Kind;
  }

  /** Legacy selectors for this construction, in gallery order. */
  export const KINDS: readonly IParams["kind"][] = ["tableLamp", "floorLamp"];
}
