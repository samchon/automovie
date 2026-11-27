import { type AutoMovieArchetype } from "../core/index";
import { createStageCasing as createStageCasingImplementation } from "./internal/createStageCasing";

/** Public operations for Auto Movie Archetype Stage Casing. */
export namespace AutoMovieArchetypeStageCasing {
  /**
   * An inert spent rifle casing for the screen.
   *
   * The case stands along `+Y` from its rim at the origin to its open mouth. The
   * `grip` is a precision pinch across the body and the `mouth` the open end,
   * facing `+Y`. It is brass-coloured exterior geometry with no primer, powder or
   * projectile.
   *
   * @param params The optional scene id.
   * @returns The inert casing and its contact frames, metres.
   */
  export function create(params?: AutoMovieArchetypeStageCasing.IParams): AutoMovieArchetype<
  AutoMovieArchetypeStageCasing.Affordance,
  AutoMovieArchetypeStageCasing.Dimension
> {
    return createStageCasingImplementation(params);
  }

  /** The pinch across the body and the open mouth. */
  export type Affordance = "grip" | "mouth";

  /** The case length, the rim diameter and the mass. */
  export type Dimension = "length" | "diameter" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `stageCasing` when absent. */
    id?: string;
  }

  /** The case figures, metres and kilograms. */
  export interface ICase {
    /** Rim to mouth, read. */
    length: number;

    /** The body's diameter at the base, read. */
    base: number;

    /** The rim's diameter, read. */
    rim: number;

    /** The neck's outer diameter, read. */
    neck: number;

    /** The neck's length, estimated. */
    neckLength: number;

    /** The empty case's mass, estimated. */
    mass: number;
  }}
