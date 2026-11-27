import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { AutoMovieArchetypeOx } from "../AutoMovieArchetypeOx";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedEquipment } from "../AutoMovieArchetypeQuadrupedEquipment";
import { AutoMovieArchetypeQuadrupedHeadAttachment } from "../AutoMovieArchetypeQuadrupedHeadAttachment";
import { buildOxBody } from "./internal/buildOxBody";
import { OX_BODY_MEASURES } from "./internal/constants/OX_BODY_MEASURES";
import { createCohortQuadruped } from "../quadruped/createCohortQuadruped";

/**
 * A coarse Kathani working-ox reference with horns and authored equipment,
 * declaring the roper's targets: `head` at the poll, `horns` between the horns'
 * bases and `hind` between the hocks.
 *
 * @param params Authored whole-model kilograms, optional lead and yoke/pack
 *   dimensions.
 * @param seed Independent construction seed and declared timing-spread
 *   coordinate.
 * @returns The shared quadruped model; mass/foot coefficients are not inferred.
 * @throws {AutoMovieArchetypeRefusal} For invalid mass, tempo or equipment
 *   dimensions.
 */
export function createOx(
  params: AutoMovieArchetypeOx.IParams,
  seed?: number,
): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  const m: typeof OX_BODY_MEASURES = OX_BODY_MEASURES;
  return createCohortQuadruped<"kathani-working-bullock">({
    archetype: "ox",
    name: (): string => "Kathani working-ox prototype",
    names: ["kathani-working-bullock"],
    choices: ["kathani-working-bullock"],
    reference: "kathani-working-bullock",
    references: { "kathani-working-bullock": m },
    body: (): AutoMovieArchetypeQuadrupedBody.IBody => buildOxBody(),
    params,
    seed,
    prepare: (
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
    ): createCohortQuadruped.Addition => {
      const equipment:
        | ReturnType<typeof AutoMovieArchetypeQuadrupedEquipment.prepare>
        | undefined =
        params.equipment === undefined
          ? undefined
          : AutoMovieArchetypeQuadrupedEquipment.prepare(
              rig,
              params.equipment,
              "ox",
            );
      return (
        builder: AutoMovieArchetypeBuilder<
          createCohortQuadruped.Affordance,
          AutoMovieArchetypeQuadrupedBody.Dimension
        >,
      ): void => {
        const bases: IAutoMovieVector3[] = [];
        for (const [side, sign] of [
          ["left", 1],
          ["right", -1],
        ] as const) {
          const x: number = (sign * rig.headRadius) / 2;
          const y: number = rig.poll.y + rig.headRadius / 2;
          const hornRadius: number =
            m.horn * AutoMovieArchetypeOx.CONSTRUCTION.hornRadius;
          const horn: IAutoMovieVector3 =
            AutoMovieArchetypeQuadrupedHeadAttachment.attach(
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
          const earRadius: number =
            m.ear * AutoMovieArchetypeOx.CONSTRUCTION.earRadius;
          const ear: IAutoMovieVector3 =
            AutoMovieArchetypeQuadrupedHeadAttachment.attach(
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
          frame: AutoMovieArchetypeFrame.upright(rig.poll),
          extent: null,
          width: 2 * rig.headRadius,
        });
        builder.affordance({
          id: "horns",
          kind: "surface",
          direction: "normal",
          frame: AutoMovieArchetypeFrame.upright(
            Vector3.lerp(bases[0]!, bases[1]!, 0.5),
          ),
          extent: null,
          width: Vector3.distance(bases[0]!, bases[1]!),
        });
        builder.affordance({
          id: "hind",
          kind: "surface",
          direction: "normal",
          frame: AutoMovieArchetypeFrame.upright(
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
