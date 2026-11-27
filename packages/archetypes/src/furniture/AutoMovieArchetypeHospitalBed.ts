import { type AutoMovieArchetype } from "../core/index";
import { createHospitalBed as createHospitalBedImplementation } from "./internal/createHospitalBed";
import { type AutoMovieArchetypeBed } from "./AutoMovieArchetypeBed";

/** Public operations for Auto Movie Archetype Hospital Bed. */
export namespace AutoMovieArchetypeHospitalBed {
  /**
   * A hospital bed with a caster base, patient support and bars along both sides.
   *
   * @param params The optional identifier, the admitted settings and any fixed
   *   dimensions in the inherited units.
   * @param seed Draws remaining dimensions and any model choice. Omit it for the
   *   first model and band midpoints.
   * @returns The generated model and its named local contacts.
   * @throws {AutoMovieArchetypeRefusal} For a setting this producer cannot admit.
   */
  export function create(params?: AutoMovieArchetypeHospitalBed.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeHospitalBed.Affordance,
  AutoMovieArchetypeHospitalBed.Dimension
> {
    return createHospitalBedImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
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

  /** The contact IDs declared by this producer. */
  export type Affordance =
    | "leftRail"
    | "leftSide"
    | "rightRail"
    | "rightSide"
    | "surface";

  /** The admitted settings and optional model ID. */
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
