import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeRefusal,
} from "../../core/index";
import { AutoMovieArchetypeDeer } from "../AutoMovieArchetypeDeer";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedHeadAttachment } from "../AutoMovieArchetypeQuadrupedHeadAttachment";
import { DeerCohorts } from "../deer/internal/DeerCohorts";
import { buildDeerBody } from "../deer/internal/buildDeerBody";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse adult Boso sika reference with sex-matched controls and male
 * antlers.
 *
 * Body and antler means come from the 1995 study's October 1992/1993 sample,
 * with different trait counts. The skeletal controls use the older animals in
 * the 1997 skull/limb study; these are not paired specimens. The main-beam base
 * disk is seated inside the head capsule. Source tip width remains the coarse
 * beam-axis tip spacing; the finite tube ends do not reconstruct the measured
 * antler's outer tip surfaces.
 *
 * @param params Optional fixed adult cohort, authored mass, antler presence,
 *   timing coordinate and lead.
 * @param seed Without a fixed cohort, draws whole adult references uniformly;
 *   seedless construction retains the male reference. An explicit antler
 *   request admits only the sourced male reference.
 * @returns The model; bare selected male/female references use their respective
 *   60.4/39.5 kg means.
 * @throws {AutoMovieArchetypeRefusal} For unsupported cohorts, female antlers,
 *   invalid mass/lead, or a lead without explicitly authored whole-model mass.
 */
export function createDeer(
  params: AutoMovieArchetypeDeer.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  if (params.lead !== undefined && params.mass === undefined)
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "deer",
      axis: "mass",
      value: null,
      feasible: { kind: "range", minimum: 0, maximum: null, unit: "kg" },
      reason:
        "the bare animal's cohort mean does not measure authored lead equipment",
      fix: "supply the complete authored model mass when adding equipment",
    });
  return createCohortQuadruped<DeerCohorts.Name>({
    archetype: "deer",
    name: (cohort: DeerCohorts.Name): string =>
      cohort === "boso-adult-male"
        ? "adult male Boso sika prototype"
        : "adult female Boso sika prototype",
    names: DeerCohorts.NAMES,
    choices: params.antlers === true ? ["boso-adult-male"] : DeerCohorts.NAMES,
    reference: DeerCohorts.DEFAULT,
    cohort: params.cohort,
    references: DeerCohorts.MEASURES,
    body: (cohort: DeerCohorts.Name): AutoMovieArchetypeQuadrupedBody.IBody =>
      buildDeerBody(undefined, cohort),
    params,
    seed,
    prepare: (
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
      cohort: DeerCohorts.Name,
    ): createCohortQuadruped.Addition | undefined => {
      if (cohort === "boso-adult-female") {
        if (params.antlers === true)
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype: "deer",
            axis: "antlers",
            value: true,
            feasible: { kind: "alternatives", values: ["false"] },
            reason: "the female reference has no sourced male antler geometry",
            fix: "omit antlers or select the adult male reference",
          });
        return;
      }
      if (params.antlers === false) return;
      const a: typeof AutoMovieArchetypeDeer.ANTLERS =
        AutoMovieArchetypeDeer.ANTLERS;
      const radius: number = (a.baseLong + a.baseShort) / 4;
      const base: IAutoMovieVector3 =
        AutoMovieArchetypeQuadrupedHeadAttachment.attach(
          rig,
          {
            x: rig.poll.x + rig.headRadius,
            y: rig.poll.y + rig.headRadius,
            z: rig.poll.z,
          },
          radius,
        );
      const root: number = base.x - rig.poll.x;
      const lateral: number = a.tipWidth / 2 - root;
      const rise: number = Math.sqrt(a.curve * a.curve - lateral * lateral);
      if (!(rise > 0))
        throw new RangeError(
          "The seated antler must preserve a positive beam rise at its declared length and tip spacing",
        );
      return (
        builder: AutoMovieArchetypeBuilder<
          createCohortQuadruped.Affordance,
          AutoMovieArchetypeQuadrupedBody.Dimension
        >,
      ): void => {
        for (const [side, sign] of [
          ["left", 1],
          ["right", -1],
        ] as const) {
          builder.rod(
            `${side}Antler`,
            radius,
            { x: rig.poll.x + sign * root, y: base.y, z: base.z },
            {
              x: rig.poll.x + (sign * a.tipWidth) / 2,
              y: base.y + rise,
              z: base.z,
            },
            { color: "#b2a184" },
          );
          for (
            let i: number = 1;
            i <= AutoMovieArchetypeDeer.CONSTRUCTION.tines;
            i++
          ) {
            const share: number =
              i / (AutoMovieArchetypeDeer.CONSTRUCTION.tines + 1);
            const startX: number = rig.poll.x + sign * (root + lateral * share);
            const startY: number = base.y + rise * share;
            const length: number =
              a.curve * AutoMovieArchetypeDeer.CONSTRUCTION.tineLength;
            builder.rod(
              `${side}AntlerTine${i}`,
              radius * AutoMovieArchetypeDeer.CONSTRUCTION.tineRadius,
              { x: startX, y: startY, z: base.z },
              {
                x: startX,
                y: startY + length * Math.SQRT1_2,
                z: base.z + length * Math.SQRT1_2,
              },
              { color: "#b2a184" },
            );
          }
        }
      };
    },
  });
}
