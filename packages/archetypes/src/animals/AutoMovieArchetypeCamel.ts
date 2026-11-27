import { type AutoMovieArchetype } from "../core/index";
import { createCohortQuadruped } from "./quadruped/createCohortQuadruped";
import { type AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { createCamel as createCamelImplementation } from "./camel/createCamel";
import { CamelCohorts } from "./camel/CamelCohorts";
import { AutoMovieArchetypeQuadrupedEquipment } from "./AutoMovieArchetypeQuadrupedEquipment";

/** Public operations for Auto Movie Archetype Camel. */
export namespace AutoMovieArchetypeCamel {
  /**
   * A coarse single-hump dromedary reference with an explicitly authored pack or
   * lead.
   *
   * @param params Positive authored whole-model kilograms, optional fixed
   *   reference, timing coordinate and equipment.
   * @param seed Without a fixed cohort, selects one whole Maur1-Maur5 mean;
   *   seedless construction retains the pooled mean.
   * @returns The shared quadruped with one coarse identifying hump.
   * @throws {AutoMovieArchetypeRefusal} For invalid mass, tempo or authored
   *   equipment.
   */
  export function create(params: AutoMovieArchetypeCamel.IParams, seed?: number): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
    return createCamelImplementation(params, seed);
  }

  /**
   * Explicit pooled gallery reference and authored complete mass; neither class
   * nor overall source supplied weight.
   */
  export const REFERENCE: Readonly<Required<Pick<IParams, "mass" | "cohort">>> =
    {
      mass: 450,
      cohort: "mauritanian-adult-female",
    };

  /**
   * The source gives no body weight, so complete model kilograms remain
   * required.
   */
  export interface IParams extends createCohortQuadruped.IParams {
    /** Required authored complete kilograms; no reference row supplies mass. */
    mass: number;

    /**
     * Fix one whole source vector; seeded omission draws five groups and
     * equipment must fit the whole unfixed palette.
     */
    cohort?: CamelCohorts.Name;

    /** Authored side pack; its fit is checked against the body. */
    equipment?: Pick<AutoMovieArchetypeQuadrupedEquipment.IParams, "pack">;
  }

  /**
   * Named normalized hump estimates: radius/withers and distance behind trunk
   * midpoint/trunk length.
   */
  export const CONSTRUCTION: Readonly<{
    humpRadius: number;
    humpBehind: number;
  }> = { humpRadius: 0.12, humpBehind: 0.1 };}
