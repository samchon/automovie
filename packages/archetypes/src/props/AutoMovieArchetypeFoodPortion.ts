import { type AutoMovieArchetype } from "../core/index";
import { createFoodPortion as createFoodPortionImplementation } from "./internal/createFoodPortion";

/** Public operations for Auto Movie Archetype Food Portion. */
export namespace AutoMovieArchetypeFoodPortion {
  /**
   * A plated portion of food: a steak cut at the table, a bite-sized piece of it,
   * or a morsel taken with chopsticks or a serving spoon.
   *
   * The portion is a slab standing on its underside at the origin, its width
   * along `X`. `top` is its upper face, the surface a knife saws and a fork's
   * tines pin, facing `+Y`; `base` is the underside, the socket set on a plate;
   * `pick` is the centre of its upper face, where a fork's tines or chopstick
   * tips take it.
   *
   * @param params The kind and the optional scene id.
   * @returns The portion and its contacts, metres.
   * @throws {AutoMovieArchetypeRefusal} For a kind outside the set.
   */
  export function create(params: AutoMovieArchetypeFoodPortion.IParams): AutoMovieArchetype<
  AutoMovieArchetypeFoodPortion.Affordance,
  AutoMovieArchetypeFoodPortion.Dimension
> {
    return createFoodPortionImplementation(params);
  }

  /** A steak, a piece cut from it, or a morsel. */
  export type Kind = "steak" | "piece" | "morsel";

  /** Every kind. */
  export const KINDS: readonly Kind[] = ["steak", "piece", "morsel"];

  /** The upper face, the underside and the pick point. */
  export type Affordance = "top" | "base" | "pick";

  /** The width, the height and the mass. */
  export type Dimension = "width" | "height" | "mass";

  /** The kind and the scene id. */
  export interface IParams {
    /** Which portion. */
    kind: Kind;

    /** The model's id, unique in a scene; the kind when absent. */
    id?: string;
  }

  /** A portion's size, metres and kilograms. */
  export interface ISize {
    /** Along `X`. */
    width: number;

    /** Along `Y`. */
    height: number;

    /** Along `Z`. */
    depth: number;

    /** The mass. */
    mass: number;
  }}
