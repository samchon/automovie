import { type AutoMovieArchetype } from "../core/index";
import { createFireExtinguisher as createFireExtinguisherImplementation } from "./internal/createFireExtinguisher";

/** Public operations for Auto Movie Archetype Fire Extinguisher. */
export namespace AutoMovieArchetypeFireExtinguisher {
  /**
   * A stored-pressure fire extinguisher standing on its base.
   *
   * The cylinder stands along `+Y` from the base's centre at the origin. Its
   * valve sits on top: `handle` is the carrying handle under the valve, the hand
   * closing on it from below; `lever` is the operating lever above it, a hinge
   * the holding hand's fingers squeeze down by `lever` degrees to discharge;
   * `pin` is the safety pin through the valve, a slider pulled out along `+X` by
   * `pin` metres before the lever can move; `ring` is the pin's ring, riding it,
   * where the free hand pulls. `nozzle` is the horn's outlet ahead of the valve,
   * its `+Y` the discharge direction, along `+Z`.
   *
   * @param params The optional scene id.
   * @returns The extinguisher and its contacts, metres.
   */
  export function create(params?: AutoMovieArchetypeFireExtinguisher.IParams): AutoMovieArchetype<
  AutoMovieArchetypeFireExtinguisher.Affordance,
  AutoMovieArchetypeFireExtinguisher.Dimension
> {
    return createFireExtinguisherImplementation(params);
  }

  /**
   * The carrying handle, the lever and its tip, the pin and its ring, and the
   * nozzle.
   */
  export type Affordance =
    | "handle"
    | "lever"
    | "leverTip"
    | "pin"
    | "ring"
    | "nozzle";

  /** The height, the diameter and the mass. */
  export type Dimension = "height" | "diameter" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `extinguisher` when absent. */
    id?: string;
  }

  /** The extinguisher's size. */
  export interface ISize {
    /** Base to valve top, metres. */
    height: number;

    /** The cylinder's diameter, metres. */
    diameter: number;

    /** The width with the valve, metres. */
    width: number;

    /** The mass, kilograms. */
    mass: number;

    /** The lever's squeeze, degrees. */
    lever: number;

    /** The pin's pull, metres. */
    pin: number;
  }}
