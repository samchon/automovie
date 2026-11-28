import { type AutoMovieArchetype } from "../core/index";
import { createHospitalBed as createHospitalBedImplementation } from "./internal/createHospitalBed";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/**
 * Constructs a caster hospital bed with a patient surface and fixed side rails.
 */
export namespace AutoMovieArchetypeHospitalBed {
  /**
   * Build a hospital bed with four casters, a litter, a mattress and fixed rails.
   *
   * The side seats mark the long mattress edges beside the raised rail
   * solids. The rail bars expose grasp frames at their tops.
   *
   * @param params Optional ID and fixed dimensions in the hospital bed bands.
   *   The ID defaults to `bed`.
   * @param seed Numeric seed for omitted dimensions. Without it the
   *   patient surface is 0.7025 metres above the floor.
   * @returns Patient surface, side-edge seats and the two fixed rail bars.
   * @throws {AutoMovieArchetypeRefusal} If a fixed dimension is inadmissible.
   */
  export function create(params?: AutoMovieArchetypeHospitalBed.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeHospitalBed.Affordance,
  AutoMovieArchetypeHospitalBed.Dimension
> {
    return createHospitalBedImplementation(params, seed);
  }

  /**
   * Patient and outer frame dimensions, litter height, mattress thickness and rail rise in metres, plus mass in kilograms.
   */
  export type Dimension =
    | "length"
    | "litter"
    | "mass"
    | "overallLength"
    | "overallWidth"
    | "rail"
    | "thickness"
    | "width";

  /**
   * The mattress `surface`, opposed side-edge seats and fixed `leftRail` and `rightRail` bar contacts.
   */
  export type Affordance =
    | "leftRail"
    | "leftSide"
    | "rightRail"
    | "rightSide"
    | "surface";

  /**
   * Optional ID and fixed values in the hospital bed bands, including litter height, rail rise and empty mass.
   */
  export type IParams = Pick<
    AutoMovieArchetypeBed.IParams,
    | "id"
    | "width"
    | "length"
    | "overallLength"
    | "overallWidth"
    | "litter"
    | "thickness"
    | "rail"
    | "mass"
  >;}
