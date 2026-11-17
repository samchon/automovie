import type { Archetype, ArchetypeBuilder } from "../core";
import { CamelBody } from "./CamelBody";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedEquipment } from "./QuadrupedEquipment";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse single-hump dromedary reference with an explicitly authored pack or lead.
 *
 * @param params Positive authored whole-model kilograms, timing coordinate and optional equipment.
 * @param seed Independent construction seed.
 * @returns The actual shared quadruped with one coarse identifying hump.
 * @throws {ArchetypeRefusal} For invalid mass, tempo or authored equipment.
 * @evidence contracts/development/common.md#meaningful-documentation Names the Mauritanian reference, separate provisional conformation cohort, authored mass and explicitly estimated single hump.
 * @evidence contracts/development/implementation.md#principled-implementation CamelBody preserves the cited height/chest/neck/head measurements and distinguishes separate Egyptian limb landmarks. The same body builder adds one named coarse hump and real pack/lead geometry with carried contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Supply the coherent reference/body, add one identifying sphere and delegate the optional actual equipment.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Chest girth excludes the hump as the primary source defines it. Hump size is declared construction, not a measured anatomical statistic; no equine weight law or unknown camel mass/foot coefficient is substituted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size body plus one sphere and the explicitly requested equipment; no diffusion asset, mesh search or iterative fitting.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared cohort/body/lead/equipment owners each retain their actual construction; species differences remain data and additions outside the ride.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned model owns its records and no query, process, renderer or global cache is retained.
 */
export function createCamel(
  params: createCamel.IParams,
  seed?: number | string,
): Archetype<createCohortQuadruped.Affordance, QuadrupedBody.Dimension> {
  const m: typeof CamelBody.MEASURES = CamelBody.MEASURES;
  return createCohortQuadruped({
    archetype: "camel", name: "Mauritanian dromedary prototype", cohort: "mauritanian-adult-female",
    withers: m.withers, girth: m.girth, body: CamelBody(), params, seed,
    add: (builder: ArchetypeBuilder<createCohortQuadruped.Affordance, QuadrupedBody.Dimension>, rig: QuadrupedBody.IRig): void => {
      const radius: number = m.withers * createCamel.CONSTRUCTION.humpRadius;
      builder.ball("hump", radius,
        { x: 0, y: rig.back, z: -rig.trunk * createCamel.CONSTRUCTION.humpBehind },
        { color: "#ae8b59" });
      if (params.equipment !== undefined) QuadrupedEquipment.lay(builder, rig, params.equipment, "camel");
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
  /** Authored gallery/test mass only; the reference cohort supplied no measured weight. */
  export const REFERENCE: Readonly<Pick<IParams, "mass">> = { mass: 450 };

  /** The source gives no body weight, so complete model kilograms remain required. */
  export interface IParams extends createCohortQuadruped.IParams {
    /** Authored side pack; its fit is checked against the actual body. */
    equipment?: Pick<QuadrupedEquipment.IParams, "pack">;
  }

  /** Named normalized hump estimates: radius/withers and distance behind trunk midpoint/trunk length. */
  export const CONSTRUCTION: Readonly<{ humpRadius: number; humpBehind: number }> = { humpRadius: 0.12, humpBehind: 0.1 };
}
