import { type AutoMovieArchetype } from "../core/index";
import { createWeaponLoop as createWeaponLoopImplementation } from "./internal/createWeaponLoop";
import { AutoMovieArchetypeDrawSession, AutoMovieArchetypeUnits, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand } from "../core";

/** Public operations for Auto Movie Archetype Weapon Loop. */
export namespace AutoMovieArchetypeWeaponLoop {
  /**
   * A carrier worn on the body (`IHumanProp.worn`) for a club: a belt loop a
   * baton hangs through, or a back sleeve a bat stands in.
   *
   * It stands on its lower end at the origin, its opening straight up along `+Y`:
   * a belt loop is a short square ring under a strap up to the belt, a back
   * sleeve a long square channel with the strap at its middle. `socket` is the
   * opening's top, facing up: the club stands grip up through it, drawn out
   * upward by its grip. `belt` is where the strap meets the wearer, facing the
   * body on `-X`.
   *
   * @param params The kind, a belt loop's ring and any dimension the author
   *   fixes.
   * @param seed The seed that picks the ring left free and draws every dimension
   *   left free inside its band; absent, the first ring and the middle of each
   *   band.
   * @returns The carrier.
   * @throws {AutoMovieArchetypeRefusal} For a ring not of the kind, a fixed
   *   dimension outside its band, or one the ring gives.
   */
  export function create(params: AutoMovieArchetypeWeaponLoop.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeWeaponLoop.Affordance, AutoMovieArchetypeWeaponLoop.Dimension> {
    return createWeaponLoopImplementation(params, seed);
  }

  /**
   * The kinds: a belt loop a baton hangs through, a back sleeve a bat stands
   * in.
   */
  export type Kind = "belt" | "back";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["belt", "back"];

  /** The strap's length, metres, by kind: estimates. */
  export const STRAP: Readonly<Record<Kind, number>> = {
    belt: 0.08,
    back: 0.2,
  };

  /**
   * The affordance ids:
   *
   * - `socket`: the opening's top, facing up.
   * - `belt`: where the strap meets the wearer, facing the body on `-X`.
   */
  export type Affordance = "socket" | "belt";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `aperture`: the opening across, inside the walls.
   * - `length`: the walls' height, the ring's or the sleeve's.
   * - `mass`: kilograms.
   */
  export type Dimension = "aperture" | "length" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    aperture: "m",
    length: "m",
    mass: "kg",
  };

  /** The read baton rings: Safariland's 692S, Rothco's and High Speed Gear's. */
  export type Model = "safariland692s" | "rothco" | "highSpeedGear";

  /**
   * Each kind's rings whole, the default first, by their opening inside:
   * Safariland 692S 35 mm
   * (https://varusteleka.com/en-us/products/safariland-model-692s-baton-ring-unissued),
   * Rothco 1.5 in
   * (https://rothco.com/product/rothco-two-ring-baton-flashlight-holder) and
   * High Speed Gear 1.5 in
   * (https://www.highspeedgear.com/products/duty-baton-ring-holder); a back
   * sleeve has none.
   */
  export const MODELS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Model, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    belt: {
      safariland692s: { aperture: 0.035 },
      rothco: { aperture: 1.5 * AutoMovieArchetypeUnits.INCH },
      highSpeedGear: { aperture: 1.5 * AutoMovieArchetypeUnits.INCH },
    },
  };

  /**
   * The parameters: the kind, a belt loop's ring, and any free dimension fixed
   * to a value inside its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which carrier. */
    kind: Kind;

    /**
     * Which of the read rings a belt loop is; picked from the seed when absent.
     * A back sleeve has none.
     */
    model?: Model;

    /** The model's id, unique in a scene; `weaponLoop` when absent. */
    id?: string;
  }

  /** The band of each free dimension a ring leaves, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    belt: {
      length: AutoMovieArchetypeBand.metres(
        0.025,
        0.04,
        "a ring's depth; the rings' pages read do not give it",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.05,
        0.12,
        "the rings' pages read give no weight",
        true,
      ),
    },
    back: {
      aperture: AutoMovieArchetypeBand.metres(
        0.075,
        0.09,
        "wider than a bat's barrel, at most 2.61 in across by the Official Baseball Rules 2024, 3.02(a); no bat sleeve's size was found",
        true,
      ),
      length: AutoMovieArchetypeBand.metres(
        0.25,
        0.35,
        "a sleeve holding a bat's barrel; no bat sleeve's size was found",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.2,
        0.5,
        "no bat sleeve's weight was found",
        true,
      ),
    },
  };}
