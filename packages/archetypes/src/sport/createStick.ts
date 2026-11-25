import { ArchetypeDraw, type AutoMovieArchetype } from "../core";
import { StickBuild } from "./StickBuild";
import { createCricketBat } from "./createCricketBat";
import { createFieldHockeyStick } from "./createFieldHockeyStick";
import { createIceHockeyStick } from "./createIceHockeyStick";
import { createLacrosseCrosse } from "./createLacrosseCrosse";

/**
 * Reads a saved stick recipe using its canonical producer.
 *
 * @param params The saved kind, optional identifier and any dimensions or
 *   choices the author supplied.
 * @param seed The seed used by the selected producer.
 * @returns The original model and its contacts.
 * @throws {AutoMovieArchetypeRefusal} When the saved kind, choice or dimension
 *   cannot be realized.
 */
export function createStick(
  params: createStick.IParams,
  seed?: number,
): AutoMovieArchetype<createStick.Affordance, createStick.Dimension> {
  const kind: createStick.Kind = ArchetypeDraw.choice(
    "stick",
    "kind",
    params.kind,
    createStick.KINDS,
  );
  return createStick.PRODUCERS[kind](params, seed);
}

/** Companion types and bands of {@link createStick}. */
export namespace createStick {
  /** The kinds of stick. */
  export type Kind = "iceHockey" | "fieldHockey" | "lacrosse" | "cricketBat";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "iceHockey",
    "fieldHockey",
    "lacrosse",
    "cricketBat",
  ];

  /**
   * The affordance ids:
   *
   * - `grip`: where both hands hold the stick.
   * - `blade`: the striking face, its `+Y` out of it.
   * - `pocket`, `scoop`: the lacrosse ball's rest socket and the front edge of
   *   the head.
   */
  export type Affordance = "grip" | "blade" | "pocket" | "scoop";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the striking end's bottom to the shaft's or handle's top.
   * - `head`: an ice hockey blade's height, a field hockey head's height, a
   *   cricket bat blade's length.
   * - `reach`: an ice hockey blade's length from the heel.
   * - `width`, `depth`: an ice hockey shaft's section, a field hockey stick's
   *   diameter, a cricket bat blade's width and depth.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "length"
    | "head"
    | "reach"
    | "width"
    | "depth"
    | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: typeof StickBuild.UNITS = StickBuild.UNITS;

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which stick. */
    kind: Kind;

    /** The model's id, unique in a scene; `stick` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: typeof StickBuild.BANDS = StickBuild.BANDS;

  /** Each saved selector's named producer. */
  export interface IProducers {
    /** The named producer for the saved `iceHockey` selector. */
    iceHockey: typeof createIceHockeyStick;

    /** The named producer for the saved `fieldHockey` selector. */
    fieldHockey: typeof createFieldHockeyStick;

    /** The named producer for the saved `lacrosse` selector. */
    lacrosse: typeof createLacrosseCrosse;

    /** The named producer for the saved `cricketBat` selector. */
    cricketBat: typeof createCricketBat;
  }

  /** The canonical producer for each saved kind. */
  export const PRODUCERS: Readonly<IProducers> = {
    iceHockey: createIceHockeyStick,
    fieldHockey: createFieldHockeyStick,
    lacrosse: createLacrosseCrosse,
    cricketBat: createCricketBat,
  };
}
