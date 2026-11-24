import type { AutoMovieArchetype } from "../core";
import { TrayConstruction } from "./TrayConstruction";
import type { createTray } from "./createTray";

/**
 * A low serving tray with a real floor and side grips at its short ends, a
 * flat-hand hold under its centre and a glass socket on its floor.
 *
 * @param params The optional identifier, the admitted settings and any fixed
 *   dimensions in the inherited units.
 * @param seed Draws remaining dimensions and any model choice. Omit it for the
 *   first model and band midpoints.
 * @returns The generated model and its named local contacts.
 * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
 */
export function createServingTray(
  params: createServingTray.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createServingTray.Affordance,
  createServingTray.Dimension
> {
  return TrayConstruction.servingTray(params, seed);
}

/** The authorable settings and local contact IDs of {@link createServingTray}. */
export namespace createServingTray {
  /** The `model` choices this producer admits. */
  export type Model = "smorling" | "grilltider" | "smula";

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "height" | "mass" | "width";

  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "inside"
    | "leftHandle"
    | "rightHandle"
    | "palm"
    | "rest";

  /** The admitted settings and optional model ID. */
  export interface IParams extends Pick<createTray.IParams, "id" | "mass"> {
    /** The recorded serving tray model. The seed selects it when omitted. */
    model?: Model;
  }
}
