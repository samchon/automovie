import { type AutoMovieArchetype } from "../core/index";
import { createWeaponRack as createWeaponRackImplementation } from "./internal/createWeaponRack";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Weapon Rack. */
export namespace AutoMovieArchetypeWeaponRack {
  /**
   * A floor weapon rack: a base with a row of slots and a top rail with a notch
   * over each, where swords, clubs and bats stand upright.
   *
   * The base lies on the floor centred over the origin, its row of slots along
   * `X` and its front toward `+Z`; two end posts carry the top rail at the drawn
   * height. `slot1` to `slot6`, counted from `-X`, are each slot's floor on the
   * base's top, facing up, where a weapon's lower end (a sword's point, a bat's
   * barrel, a club's tip) rests; `rail1` to `rail6` the notch above it in the top
   * rail's front, facing `+Z`, against which the weapon leans. A weapon set in a
   * slot keeps its own `grip` for a hand to reach.
   *
   * @param params The model and any dimension the author fixes.
   * @param seed The seed that picks the model left free and draws the mass inside
   *   its band; absent, the first model and the middle of the band.
   * @returns The rack.
   * @throws {AutoMovieArchetypeRefusal} For a model not read, a fixed mass
   *   outside its band, or a fixed dimension the model gives.
   */
  export function create(params?: AutoMovieArchetypeWeaponRack.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWeaponRack.Affordance, AutoMovieArchetypeWeaponRack.Dimension> {
    return createWeaponRackImplementation(params, seed);
  }

  /**
   * The base's height, metres: Medieval Extreme's read 3 cm, applied to
   * Gladney's, whose page gives none; an estimate.
   */
  export const BASE: number = 0.03;

  /** The slots along the base: the makers' six. */
  export const SLOTS: number = 6;

  /** The posts' and the rail's section, metres: an estimate. */
  export const POST: number = 0.04;

  /**
   * The affordance ids:
   *
   * - `slot1` to `slot6`: each slot's floor on the base's top, facing up, from
   *   `-X`.
   * - `rail1` to `rail6`: the notch over each in the rail's front, facing `+Z`.
   */
  export type Affordance =
    | "slot1"
    | "slot2"
    | "slot3"
    | "slot4"
    | "slot5"
    | "slot6"
    | "rail1"
    | "rail2"
    | "rail3"
    | "rail4"
    | "rail5"
    | "rail6";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: the rack's, post to post outside.
   * - `depth`: the base's, front to back.
   * - `height`: the rail's top above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /**
   * The read stands: Medieval Extreme's and Gladney's six-slot floor sword
   * stands.
   */
  export type Model = "medievalExtreme" | "gladney";

  /**
   * The stands whole, the default first: Medieval Extreme's 66 x 23 cm base and
   * 84 cm high
   * (https://medievalextreme.com/medieval-furniture/wooden-sword-display-stand-for-6-swords-6-slot-sword-holder/),
   * Gladney's 69.5 x 22 x 66 cm
   * (https://www.shein.tw/gladney-Adjustable-6-Slot-Floor-Sword-Stand-Bamboo-Rack-Matte-Black-Vertical-Display-For-Katanas-Tantos-Replicas-Up-To-55lbs-p-389724431.html).
   */
  export const MODELS: Readonly<
    Record<Model, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    medievalExtreme: { width: 0.66, depth: 0.23, height: 0.84 },
    gladney: { width: 0.695, depth: 0.22, height: 0.66 },
  };

  /** The parameters: the model, and the mass fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which read stand; picked from the seed when absent. */
    model?: Model;

    /** The model's id, unique in a scene; `weaponRack` when absent. */
    id?: string;
  }

  /** The band of the dimension a stand leaves. */
  export const BANDS: Readonly<
    Partial<Record<Dimension, IAutoMovieArchetypeBand>>
  > = {
    mass: AutoMovieArchetypeBand.of(
      "kg",
      8,
      20,
      "the stands' pages read give no weight",
      true,
    ),
  };}
