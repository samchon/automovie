import type { Archetype, ArchetypeBuilder } from "../core";
import { OxBody } from "./OxBody";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedEquipment } from "./QuadrupedEquipment";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse Kathani working-ox reference with actual horns and authored equipment.
 *
 * @param params Authored whole-model kilograms, optional lead and yoke/pack dimensions.
 * @param seed Independent construction seed and declared timing-spread coordinate.
 * @returns The actual shared quadruped model; mass/foot coefficients are not inferred.
 * @throws {ArchetypeRefusal} For invalid mass, tempo or equipment dimensions.
 * @evidence contracts/development/common.md#meaningful-documentation Names the whole Kathani reference, separate provisional limb cohort, measured horn/ear lengths and authored geometry/equipment limits.
 * @evidence contracts/development/implementation.md#principled-implementation OxBody owns the cited whole-cohort means and explicitly transferred limb controls. Actual horn/ear rods use the published lengths, with named constructed splay/radii; the shared cohort and equipment owners build the same physical model and its contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Supply the ox reference/body to one shared builder and add its two horns/ears and any explicitly dimensioned equipment.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No horse mass law, invented working-ox weight, population allometry, measured horn curvature or maker yoke dimension is claimed. This fixed mean prototype does not complete population variation or animal dynamics.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size body and four identifying rods plus the explicitly requested equipment; no mesh search or fitting loop.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body/profile, coherent reference recording, collar/lead and yoke/pack geometry/contact each retain one shared owner.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent model records and retains no construction callback, mutable registry, process or renderer.
 */
export function createOx(
  params: createOx.IParams,
  seed?: number | string,
): Archetype<createCohortQuadruped.Affordance, QuadrupedBody.Dimension> {
  const m: typeof OxBody.MEASURES = OxBody.MEASURES;
  return createCohortQuadruped({
    archetype: "ox", name: "Kathani working-ox prototype", cohort: "kathani-working-bullock",
    withers: m.withers, girth: m.girth, body: OxBody(), params, seed,
    add: (builder: ArchetypeBuilder<createCohortQuadruped.Affordance, QuadrupedBody.Dimension>, rig: QuadrupedBody.IRig): void => {
      for (const [side, sign] of [["left", 1], ["right", -1]] as const) {
        const x: number = sign * rig.headRadius / 2;
        const y: number = rig.poll.y + rig.headRadius / 2;
        builder.rod(`${side}Horn`, m.horn * createOx.CONSTRUCTION.hornRadius,
          { x, y, z: rig.poll.z },
          { x: x + sign * m.horn * Math.SQRT1_2, y: y + m.horn * Math.SQRT1_2, z: rig.poll.z },
          { color: "#c0ac7a" });
        builder.rod(`${side}Ear`, m.ear * createOx.CONSTRUCTION.earRadius,
          { x: sign * rig.headRadius, y: rig.poll.y, z: rig.poll.z },
          { x: sign * (rig.headRadius + m.ear), y: rig.poll.y, z: rig.poll.z },
          { color: "#8a6a46" });
      }
      if (params.equipment !== undefined) QuadrupedEquipment.lay(builder, rig, params.equipment, "ox");
    },
  });
}

/**
 * Authored ox equipment and named construction proxies, independent of body measurements.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States total mass ownership, optional equipment and which identifying proportions are authored.
 * @evidence contracts/development/design.md#principled-representation The common reference/mass contract and real equipment input types compose without a second body or contact representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The ox adds only equipment and identifying rod proportions; all physical source data remain OxBody's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The small circular sections and 45-degree splayed straight horns are declared coarse construction, not measured horn morphology or load certification.
 */
export namespace createOx {
  /** Authored gallery/test mass only, not a measured Kathani weight or a constructor default. */
  export const REFERENCE: Readonly<Pick<IParams, "mass">> = { mass: 300 };

  /** Positive total mass is authored; no live weight was read for the source cohort. */
  export interface IParams extends createCohortQuadruped.IParams {
    /** Actual yoke or pack, each with its explicitly authored physical dimensions. */
    equipment?: QuadrupedEquipment.IParams;
  }

  /** Radius/length ratios of coarse identifying rods; not anatomical measurements. */
  export const CONSTRUCTION: Readonly<{ hornRadius: number; earRadius: number }> = { hornRadius: 0.06, earRadius: 0.07 };
}
