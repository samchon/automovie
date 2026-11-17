import type { Archetype, ArchetypeBuilder } from "../core";
import { CamelBody } from "./CamelBody";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedEquipment } from "./QuadrupedEquipment";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse single-hump dromedary reference with an explicitly authored pack or lead.
 *
 * @param params Positive authored whole-model kilograms, optional fixed reference, timing coordinate and equipment.
 * @param seed Without a fixed cohort, selects one whole Maur1-Maur5 mean; seedless construction retains the pooled mean.
 * @returns The actual shared quadruped with one coarse identifying hump.
 * @throws {ArchetypeRefusal} For invalid mass, tempo or authored equipment.
 * @evidence contracts/development/common.md#meaningful-documentation Names the pooled/five-group selection policy, unknown group frequencies, separate provisional conformation cohort, authored mass and estimated single hump.
 * @evidence contracts/development/implementation.md#principled-implementation CamelBody preserves the cited height/chest/neck/head measurements and distinguishes separate Egyptian limb landmarks. The same body builder adds one named coarse hump and real pack/lead geometry with carried contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared factory draws one complete reference, constructs its body, adds its height-scaled identifying sphere and delegates actual equipment.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Chest girth excludes the hump as the primary source defines it. Hump size is declared construction, not a measured anatomical statistic; no equine weight law or unknown camel mass/foot coefficient is substituted.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most six fixed-size profile/rig/equipment plans establish seed-independent admission, then only the selected body geometry and hump are emitted. There is no unselected model construction, mesh search or iterative fitting.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared cohort/body/lead/equipment owners each retain their actual construction; species differences remain data and additions outside the ride.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned model owns its records and no query, process, renderer or global cache is retained.
 */
export function createCamel(
  params: createCamel.IParams,
  seed?: number | string,
): Archetype<createCohortQuadruped.Affordance, QuadrupedBody.Dimension> {
  return createCohortQuadruped<CamelBody.Cohort>({
    archetype: "camel",
    name: (): string => "Mauritanian dromedary prototype",
    names: CamelBody.COHORTS,
    choices: CamelBody.DRAW,
    reference: "mauritanian-adult-female",
    cohort: params.cohort,
    references: CamelBody.REFERENCES,
    body: (cohort: CamelBody.Cohort): QuadrupedBody.IBody =>
      CamelBody(undefined, cohort),
    params,
    seed,
    prepare: (
      rig: QuadrupedBody.IRig,
      cohort: CamelBody.Cohort,
    ): createCohortQuadruped.Addition => {
      const m: Readonly<(typeof CamelBody.REFERENCES)[CamelBody.Cohort]> =
        CamelBody.REFERENCES[cohort];
      const radius: number = m.withers * createCamel.CONSTRUCTION.humpRadius;
      const equipment:
        | ReturnType<typeof QuadrupedEquipment.prepare>
        | undefined =
        params.equipment === undefined
          ? undefined
          : QuadrupedEquipment.prepare(rig, params.equipment, "camel");
      return (
        builder: ArchetypeBuilder<
          createCohortQuadruped.Affordance,
          QuadrupedBody.Dimension
        >,
      ): void => {
        builder.ball(
          "hump",
          radius,
          {
            x: 0,
            y: rig.back,
            z: -rig.trunk * createCamel.CONSTRUCTION.humpBehind,
          },
          { color: "#ae8b59" },
        );
        equipment?.emit(builder);
      };
    },
  });
}

/**
 * Authored camel equipment and explicit coarse hump construction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates required mass, optional equipment and provisional single-hump shape.
 * @evidence contracts/development/design.md#principled-representation The shared reference/mass contract composes with the actual pack dimensions; one normalized radius/offset describes the identifying coarse hump.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source measurements remain CamelBody's and physical equipment remains its own shared owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No measured hump dimensions, saddle fit, physiological mass estimate or dynamic load capacity is implied.
 */
export namespace createCamel {
  /** Explicit pooled gallery reference and authored complete mass; neither class nor overall source supplied weight. */
  export const REFERENCE: Readonly<Required<Pick<IParams, "mass" | "cohort">>> =
    {
      mass: 450,
      cohort: "mauritanian-adult-female",
    };

  /** The source gives no body weight, so complete model kilograms remain required. */
  export interface IParams extends createCohortQuadruped.IParams {
    /** Required authored complete kilograms; no reference row supplies mass. */
    mass: number;

    /** Fix one whole source vector; seeded omission draws five groups and equipment must fit the whole unfixed palette. */
    cohort?: CamelBody.Cohort;

    /** Authored side pack; its fit is checked against the actual body. */
    equipment?: Pick<QuadrupedEquipment.IParams, "pack">;
  }

  /** Named normalized hump estimates: radius/withers and distance behind trunk midpoint/trunk length. */
  export const CONSTRUCTION: Readonly<{
    humpRadius: number;
    humpBehind: number;
  }> = { humpRadius: 0.12, humpBehind: 0.1 };
}
