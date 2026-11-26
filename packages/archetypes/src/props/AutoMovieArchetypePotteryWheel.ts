import { type AutoMovieArchetype } from "../core/index";
import { createPotteryWheel as createPotteryWheelImplementation } from "./internal/createPotteryWheel";

/** Public operations for Auto Movie Archetype Pottery Wheel. */
export namespace AutoMovieArchetypePotteryWheel {
  /**
   * A potter's wheel: a wheel head turning on a stand, with a form of clay thrown
   * on it whose wall rises as the hands draw it up.
   *
   * The wheel stands on the floor at the origin, its head's axis along `+Y`.
   * `head` is the head's articulation, a crank that turns without limit, so an
   * act spins it. The clay is centred on the head: a lump and a wall of `clay`
   * radius whose top stands `start` above the head and rises by up to `rise` on
   * the `raise` slider as it is drawn up. Clay is round about the head's axis, so
   * every point of its wall at one height is the same contact in the turning
   * head's frame: `outside` is the wall's outer face at its top, facing `+Z`,
   * `inside` its inner face, facing `-Z`, both riding the rise.
   *
   * @param params The optional scene id.
   * @returns The wheel and its contacts, metres.
   */
  export function create(params?: AutoMovieArchetypePotteryWheel.IParams): AutoMovieArchetype<
  AutoMovieArchetypePotteryWheel.Affordance,
  AutoMovieArchetypePotteryWheel.Dimension
> {
    return createPotteryWheelImplementation(params);
  }

  /** The head's crank, the wall's rise and its two faces. */
  export type Affordance = "head" | "raise" | "outside" | "inside";

  /** The head's height, the clay's radius, the rise and the mass. */
  export type Dimension = "height" | "clay" | "rise" | "mass";

  /** The scene id. */
  export interface IParams {
    /** The model's id, unique in a scene; `potteryWheel` when absent. */
    id?: string;
  }

  /** The wheel's size, metres and kilograms. */
  export interface ISize {
    /** The head's top above the floor. */
    height: number;

    /** The head's diameter. */
    head: number;

    /** The clay's outer radius. */
    clay: number;

    /** The wall's thickness. */
    wall: number;

    /** The wall's top above the head at rest. */
    start: number;

    /** How far the wall rises. */
    rise: number;

    /** The mass. */
    mass: number;
  }}
