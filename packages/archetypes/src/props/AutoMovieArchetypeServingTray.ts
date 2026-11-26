import { type AutoMovieArchetype } from "../core/index";
import { createServingTray as createServingTrayImplementation } from "./internal/createServingTray";
import { type createTray } from "./createTray";

/** Public operations for Auto Movie Archetype Serving Tray. */
export namespace AutoMovieArchetypeServingTray {
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
  export function create(params?: AutoMovieArchetypeServingTray.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeServingTray.Affordance,
  AutoMovieArchetypeServingTray.Dimension
> {
    return createServingTrayImplementation(params, seed);
  }

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
  }}
