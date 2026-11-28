import { type AutoMovieArchetype } from "../core/index";
import { createBunkBed as createBunkBedImplementation } from "./internal/createBunkBed";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Constructs two stacked mattress surfaces with fixed upper guards. */
export namespace AutoMovieArchetypeBunkBed {
  /**
   * Build a bunk bed with two 0.90 by 2.00 metre mattresses.
   *
   * @param params Optional ID and fixed dimensions from the bunk bands.
   *   The ID defaults to `bed`.
   * @param seed Numeric seed for omitted settings. Without it the lower
   *   and upper mattress tops are 0.345 and 1.255 metres above the floor.
   * @returns The lower surface and side seats, the `upper` surface and
   *   the continuous `-X` `guard` bar.
   * @throws {AutoMovieArchetypeRefusal} If a fixed setting is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeBunkBed.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeBunkBed.Affordance, AutoMovieArchetypeBunkBed.Dimension> {
    return createBunkBedImplementation(params, seed);
  }

  /**
   * Mattress and outer frame geometry in metres, including `gap` between supports and `clearance` to the lower support, plus mass in kilograms.
   */
  export type Dimension =
    | "clearance"
    | "gap"
    | "height"
    | "length"
    | "mass"
    | "overallLength"
    | "overallWidth"
    | "thickness"
    | "width";

  /**
   * Lower `surface` and side seats, `upper` mattress plane and `guard` at the continuous upper bar's centreline.
   */
  export type Affordance =
    | "guard"
    | "leftSide"
    | "rightSide"
    | "surface"
    | "upper";

  /**
   * Optional ID and fixed applicable bunk dimensions, including mattress thickness and empty bed mass.
   */
  export type IParams = Pick<
    AutoMovieArchetypeBed.IParams,
    | "id"
    | "width"
    | "length"
    | "height"
    | "thickness"
    | "overallLength"
    | "overallWidth"
    | "clearance"
    | "gap"
    | "mass"
  >;}
