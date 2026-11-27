import { type AutoMovieArchetype } from "../core/index";
import { createGlove as createGloveImplementation } from "./internal/createGlove";
import { AutoMovieArchetypeDrawSession, type IAutoMovieArchetypeBand, AutoMovieArchetypeBand, AutoMovieArchetypeUnits } from "../core";

/** Public operations for Auto Movie Archetype Glove. */
export namespace AutoMovieArchetypeGlove {
  /** The kinds. */
  export type Kind = "fielder" | "catcher";

  /**
   * The affordance ids:
   *
   * - `hand`: the wrist opening, its `+Y` out of it toward `-Z`.
   * - `pocket`: the catching face, facing up, a half of the width and a third of
   *   the length.
   */
  export type Affordance = "hand" | "pocket";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the wrist's end to the fingers' tips.
   * - `width`: across the palm.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "mass";

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which glove. */
    kind: Kind;

    /** The model's id, unique in a scene; `glove` when absent. */
    id?: string;
  }

  /**
   * A baseball glove: a fielder's glove or a catcher's mitt.
   *
   * It lies on its back on the floor, the pocket up, the fingers toward `+Z` and
   * the wrist opening toward `-Z`, its centre over the origin. `hand` is the
   * wrist opening the hand slides into, its `+Y` out of the opening; `pocket` the
   * catching face a ball comes to, facing up. A glove is worn on the hand
   * (`IHumanProp.worn`), so a catch reads the pocket where the hand carries it.
   *
   * @param params The kind and any dimension the author fixes.
   * @param seed The seed that draws every dimension left free inside its band;
   *   absent, each takes the middle of its band.
   * @returns The glove.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(params: AutoMovieArchetypeGlove.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeGlove.Affordance, AutoMovieArchetypeGlove.Dimension> {
    return createGloveImplementation(params, seed);
  }

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["fielder", "catcher"];

  /** The glove's thickness lying on its back, metres, by kind: estimates. */
  export const THICKNESS: Readonly<Record<Kind, number>> = {
    fielder: 0.07,
    catcher: 0.09,
  };

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    mass: "kg",
  };

  /*
   * The Official Baseball Rules 2024.
   */
  const OBR: string =
    "Official Baseball Rules 2024 (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

  /*
   * A band in metres at a rule's limit.
   */
  const m = (
    minimum: number,
    maximum: number,
    source: string,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(minimum, maximum, source);

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    fielder: {
      length: m(
        13 * AutoMovieArchetypeUnits.INCH,
        13 * AutoMovieArchetypeUnits.INCH,
        `${OBR}, 3.06: a fielder's glove not more than 13 in from a finger's tip to the heel, the limit the model takes`,
      ),
      width: m(
        7.75 * AutoMovieArchetypeUnits.INCH,
        7.75 * AutoMovieArchetypeUnits.INCH,
        `${OBR}, 3.06: not more than 7 3/4 in wide, the limit the model takes`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.5,
        0.7,
        `${OBR}, 3.06: the glove can be of any weight; no maker's weight was read`,
        true,
      ),
    },
    catcher: {
      length: m(
        15.5 * AutoMovieArchetypeUnits.INCH,
        15.5 * AutoMovieArchetypeUnits.INCH,
        `${OBR}, 3.04: a catcher's mitt not more than 15 1/2 in from top to bottom, the limit the model takes`,
      ),
      width: m(
        2 *
          ((38 * AutoMovieArchetypeUnits.INCH) / Math.PI -
            (15.5 * AutoMovieArchetypeUnits.INCH) / 2),
        2 *
          ((38 * AutoMovieArchetypeUnits.INCH) / Math.PI -
            (15.5 * AutoMovieArchetypeUnits.INCH) / 2),
        `${OBR}, 3.04: not more than 38 in round and 15 1/2 in long, the width of an ellipse of that round and that length`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        0.6,
        0.9,
        `${OBR}, 3.04: the rule states no weight; no maker's weight was read`,
        true,
      ),
    },
  };}
