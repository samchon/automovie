import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type Archetype, type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { OxBody } from "./OxBody";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedEquipment } from "./QuadrupedEquipment";
import { QuadrupedHeadAttachment } from "./QuadrupedHeadAttachment";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse Kathani working-ox reference with actual horns and authored equipment, declaring the roper's targets: `head` at the poll, `horns` between the horns' bases and `hind` between the hocks.
 *
 * @param params Authored whole-model kilograms, optional lead and yoke/pack dimensions.
 * @param seed Independent construction seed and declared timing-spread coordinate.
 * @returns The actual shared quadruped model; mass/foot coefficients are not inferred.
 * @throws {ArchetypeRefusal} For invalid mass, tempo or equipment dimensions.
 * @evidence contracts/development/common.md#meaningful-documentation Names the whole Kathani reference, separate provisional limb cohort, measured horn/ear lengths and authored geometry/equipment limits.
 * @evidence contracts/development/implementation.md#principled-implementation OxBody owns the cited whole-cohort means and explicitly transferred limb controls. Actual horn/ear rods use the published lengths and authored directions/radii. The common head-capsule owner seats their complete root disks, preserving already seated horn positions and translating ear roots without changing length; no source head measure changes.
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
  return createCohortQuadruped<"kathani-working-bullock">({
    archetype: "ox",
    name: (): string => "Kathani working-ox prototype",
    names: ["kathani-working-bullock"],
    choices: ["kathani-working-bullock"],
    reference: "kathani-working-bullock",
    references: { "kathani-working-bullock": m },
    body: (): QuadrupedBody.IBody => OxBody(),
    params,
    seed,
    prepare: (rig: QuadrupedBody.IRig): createCohortQuadruped.Addition => {
      const equipment:
        | ReturnType<typeof QuadrupedEquipment.prepare>
        | undefined =
        params.equipment === undefined
          ? undefined
          : QuadrupedEquipment.prepare(rig, params.equipment, "ox");
      return (
        builder: ArchetypeBuilder<
          createCohortQuadruped.Affordance,
          QuadrupedBody.Dimension
        >,
      ): void => {
        const bases: IAutoMovieVector3[] = [];
        for (const [side, sign] of [
          ["left", 1],
          ["right", -1],
        ] as const) {
          const x: number = (sign * rig.headRadius) / 2;
          const y: number = rig.poll.y + rig.headRadius / 2;
          const hornRadius: number = m.horn * createOx.CONSTRUCTION.hornRadius;
          const horn: IAutoMovieVector3 = QuadrupedHeadAttachment(
            rig,
            { x, y, z: rig.poll.z },
            hornRadius,
          );
          bases.push(horn);
          builder.rod(
            `${side}Horn`,
            hornRadius,
            horn,
            {
              x: horn.x + sign * m.horn * Math.SQRT1_2,
              y: horn.y + m.horn * Math.SQRT1_2,
              z: horn.z,
            },
            { color: "#c0ac7a" },
          );
          const earRadius: number = m.ear * createOx.CONSTRUCTION.earRadius;
          const ear: IAutoMovieVector3 = QuadrupedHeadAttachment(
            rig,
            { x: sign * rig.headRadius, y: rig.poll.y, z: rig.poll.z },
            earRadius,
          );
          builder.rod(
            `${side}Ear`,
            earRadius,
            ear,
            {
              x: ear.x + sign * m.ear,
              y: ear.y,
              z: ear.z,
            },
            { color: "#8a6a46" },
          );
        }
        // The roper's targets: the poll on the head's top, the horns' bases on the skull and the middle between the hocks a heel loop closes on.
        builder.affordance({
          id: "head",
          kind: "surface",
          direction: "normal",
          frame: ArchetypeFrame.upright(rig.poll),
          extent: null,
          width: 2 * rig.headRadius,
        });
        builder.affordance({
          id: "horns",
          kind: "surface",
          direction: "normal",
          frame: ArchetypeFrame.upright(
            Vector3.lerp(bases[0]!, bases[1]!, 0.5),
          ),
          extent: null,
          width: Vector3.distance(bases[0]!, bases[1]!),
        });
        builder.affordance({
          id: "hind",
          kind: "surface",
          direction: "normal",
          frame: ArchetypeFrame.upright(
            Vector3.lerp(rig.limbs.leftHind[2]!, rig.limbs.rightHind[2]!, 0.5),
          ),
          extent: null,
          width: Vector3.distance(
            rig.limbs.leftHind[2]!,
            rig.limbs.rightHind[2]!,
          ),
        });
        equipment?.emit(builder);
      };
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
    /** Required authored complete kilograms; no working-ox mass was measured. */
    mass: number;

    /** Actual yoke or pack, each with its explicitly authored physical dimensions. */
    equipment?: QuadrupedEquipment.IParams;
  }

  /** Radius/length ratios of coarse identifying rods; not anatomical measurements. */
  export const CONSTRUCTION: Readonly<{
    hornRadius: number;
    earRadius: number;
  }> = { hornRadius: 0.06, earRadius: 0.07 };
}
