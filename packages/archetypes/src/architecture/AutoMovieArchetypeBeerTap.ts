import { type AutoMovieArchetype } from "../core/index";
import { createBeerTap as createBeerTapImplementation } from "./internal/createBeerTap";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Beer Tap. */
export namespace AutoMovieArchetypeBeerTap {
  /**
   * A two-faucet beer tower on a bar counter: a column on a round base under a
   * tee head, a standard faucet out of each side of the head's front.
   *
   * The counter is the `XZ` plane, the tower's base centred on the origin, the
   * faucets facing the bartender at `+Z`, spaced along `X`. Each faucet's shank
   * leaves the head's front face at the head's middle height; its spout hangs the
   * maker's drop under the shank and its lever stud rises over the spout.
   * `leftSpout` and `rightSpout` are the spouts' tips, sockets facing down, under
   * which a glass is held; `leftTap` and `rightTap` are the lever studs' tops,
   * where a tap handle screws on and a hand pulls it. The tap handle itself is
   * not built, and the levers state no travel: no source read gives a handle's
   * length or throw.
   *
   * @param params Any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The tower.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params?: AutoMovieArchetypeBeerTap.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBeerTap.Affordance, AutoMovieArchetypeBeerTap.Dimension> {
    return createBeerTapImplementation(params, seed);
  }

  /**
   * The affordance ids:
   *
   * - `leftSpout`, `rightSpout`: the spouts' tips at `+X` and `-X`, facing down.
   * - `leftTap`, `rightTap`: the lever studs' tops, where a handle is pulled.
   */
  export type Affordance = "leftSpout" | "rightSpout" | "leftTap" | "rightTap";

  /** The free dimension: `mass`, kilograms. */
  export type Dimension = "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `beerTap` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    mass: AutoMovieArchetypeBand.of(
      "kg",
      3,
      6,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };}
