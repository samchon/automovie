import type { AutoMovieArchetype, AutoMovieArchetypeBuilder } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedEquipment } from "./AutoMovieArchetypeQuadrupedEquipment";
import { CamelCohorts } from "./camel/internal/CamelCohorts";
import { buildCamelBody } from "./camel/internal/buildCamelBody";
import { createCohortQuadruped } from "./internal/createCohortQuadruped";

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
export function createCamel(
  params: createCamel.IParams,
  seed?: number,
): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  return createCohortQuadruped<CamelCohorts.Name>({
    archetype: "camel",
    name: (): string => "Mauritanian dromedary prototype",
    names: CamelCohorts.NAMES,
    choices: CamelCohorts.DRAW,
    reference: CamelCohorts.DEFAULT,
    cohort: params.cohort,
    references: CamelCohorts.MEASURES,
    body: (cohort: CamelCohorts.Name): AutoMovieArchetypeQuadrupedBody.IBody =>
      buildCamelBody(undefined, cohort),
    params,
    seed,
    prepare: (
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
      cohort: CamelCohorts.Name,
    ): createCohortQuadruped.Addition => {
      const m: Readonly<CamelCohorts.IMeasures> = CamelCohorts.MEASURES[cohort];
      const hump: AutoMovieArchetypeQuadrupedEquipment.ISphere = {
        id: "hump",
        radius: m.withers * createCamel.CONSTRUCTION.humpRadius,
        centre: {
          x: 0,
          y: rig.back,
          z: -rig.trunk * createCamel.CONSTRUCTION.humpBehind,
        },
      };
      const equipment:
        | ReturnType<typeof AutoMovieArchetypeQuadrupedEquipment.prepare>
        | undefined =
        params.equipment === undefined
          ? undefined
          : AutoMovieArchetypeQuadrupedEquipment.prepare(
              rig,
              params.equipment,
              "camel",
              [hump],
            );
      return (
        builder: AutoMovieArchetypeBuilder<
          createCohortQuadruped.Affordance,
          AutoMovieArchetypeQuadrupedBody.Dimension
        >,
      ): void => {
        builder.ball(hump.id, hump.radius, hump.centre, { color: "#ae8b59" });
        equipment?.emit(builder);
      };
    },
  });
}

/** Authored camel equipment and explicit coarse hump construction. */
export namespace createCamel {
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
  }> = { humpRadius: 0.12, humpBehind: 0.1 };
}
