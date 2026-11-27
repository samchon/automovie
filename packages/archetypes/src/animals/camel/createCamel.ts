import { AutoMovieArchetypeCamel } from "../AutoMovieArchetypeCamel";
import type { AutoMovieArchetype, AutoMovieArchetypeBuilder } from "../../core/index";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedEquipment } from "../AutoMovieArchetypeQuadrupedEquipment";
import { CamelCohorts } from "./CamelCohorts";
import { buildCamelBody } from "./buildCamelBody";
import { createCohortQuadruped } from "../quadruped/createCohortQuadruped";

/*
 * A coarse single-hump dromedary reference with an explicitly authored pack or
 * lead.
 * Parameter params: Positive authored whole-model kilograms, optional fixed
 * reference, timing coordinate and equipment.
 * Parameter seed: Without a fixed cohort, selects one whole Maur1-Maur5 mean;
 * seedless construction retains the pooled mean.
 * Returns: The shared quadruped with one coarse identifying hump.
 * For invalid mass, tempo or authored
 * equipment.
 */
export function createCamel(
  params: AutoMovieArchetypeCamel.IParams,
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
        radius: m.withers * AutoMovieArchetypeCamel.CONSTRUCTION.humpRadius,
        centre: {
          x: 0,
          y: rig.back,
          z: -rig.trunk * AutoMovieArchetypeCamel.CONSTRUCTION.humpBehind,
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
