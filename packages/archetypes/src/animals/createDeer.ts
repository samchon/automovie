import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeRefusal,
} from "../core";
import { AutoMovieArchetypeDeerBody } from "./AutoMovieArchetypeDeerBody";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedHeadAttachment } from "./AutoMovieArchetypeQuadrupedHeadAttachment";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse adult Boso sika reference with sex-matched controls and male
 * antlers.
 *
 * Body and antler means come from the 1995 study's October 1992/1993 sample,
 * with different trait counts. AutoMovieArchetypeDeerBody separately declares
 * the older animals in the 1997 skull/limb study; these are not paired
 * specimens. The main-beam base disk is seated inside the head capsule. Source
 * tip width remains the coarse beam-axis tip spacing; the finite tube ends do
 * not reconstruct the measured antler's outer tip surfaces.
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
  params: createDeer.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
  if (params.antlers !== undefined && typeof params.antlers !== "boolean")
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "deer",
      axis: "antlers",
      value: params.antlers,
      feasible: { kind: "alternatives", values: ["true", "false"] },
      reason: "antler presence must be a boolean request",
      fix: "supply true, false or leave the cohort's default",
    });
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
  return createCohortQuadruped<AutoMovieArchetypeDeerBody.Cohort>({
    archetype: "deer",
    name: (cohort: AutoMovieArchetypeDeerBody.Cohort): string =>
      cohort === "boso-adult-male"
        ? "adult male Boso sika prototype"
        : "adult female Boso sika prototype",
    names: AutoMovieArchetypeDeerBody.COHORTS,
    choices:
      params.antlers === true
        ? ["boso-adult-male"]
        : AutoMovieArchetypeDeerBody.COHORTS,
    reference: "boso-adult-male",
    cohort: params.cohort,
    references: AutoMovieArchetypeDeerBody.REFERENCES,
    body: (
      cohort: AutoMovieArchetypeDeerBody.Cohort,
    ): AutoMovieArchetypeQuadrupedBody.IBody =>
      AutoMovieArchetypeDeerBody(undefined, cohort),
    params,
    seed,
    prepare: (
      rig: AutoMovieArchetypeQuadrupedBody.IRig,
      cohort: AutoMovieArchetypeDeerBody.Cohort,
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
      const a: typeof createDeer.ANTLERS = createDeer.ANTLERS;
      const radius: number = (a.baseLong + a.baseShort) / 4;
      const base: IAutoMovieVector3 = AutoMovieArchetypeQuadrupedHeadAttachment(
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
      if (!(Number.isFinite(rise) && rise > 0))
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
          for (let i: number = 1; i <= createDeer.CONSTRUCTION.tines; i++) {
            const share: number = i / (createDeer.CONSTRUCTION.tines + 1);
            const startX: number = rig.poll.x + sign * (root + lateral * share);
            const startY: number = base.y + rise * share;
            const length: number = a.curve * createDeer.CONSTRUCTION.tineLength;
            builder.rod(
              `${side}AntlerTine${i}`,
              radius * createDeer.CONSTRUCTION.tineRadius,
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

/** The adult reference's source antler dimensions and authored coarse controls. */
export namespace createDeer {
  /**
   * Explicit previous adult-male reference; its bare mass still comes from the
   * source row.
   */
  export const REFERENCE: Readonly<Required<Pick<IParams, "cohort">>> = {
    cohort: "boso-adult-male",
  };

  /**
   * Bare reference mass may be omitted; authored equipment requires explicit
   * complete mass.
   */
  export interface IParams extends createCohortQuadruped.IParams {
    /**
     * Fix male4+ or female2+; seeded omission draws adults and equipment must
     * fit the whole unfixed palette.
     */
    cohort?: AutoMovieArchetypeDeerBody.Cohort;

    /** Optional complete kilograms; the bare cohort mean when absent. */
    mass?: number;
    /**
     * Male antlers default on for males and off for females; true with an
     * explicit female cohort is refused.
     */
    antlers?: boolean;
  }

  /**
   * Ochiai and Asada 1995, Chiba 3(2):223-232, Table 7, printed p. 227 (PDF p.
   * 5): Boso males age four or more, measured in October 1992/1993. Table 1
   * gives 24 deer for each antler trait; left/right lengths and base diameters
   * were averaged per deer. The curve length, tip-to-tip width and base ellipse
   * diameters below convert its centimetre means to metres. Curve length
   * follows the antler, not a straight root-to-tip distance.
   * http://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_03-2_11ochiai.pdf
   * This is the body study's population with different trait counts; the
   * separate 1997 skull/limb references remain explicitly owned by
   * AutoMovieArchetypeDeerBody.
   */
  export const ANTLERS: Readonly<{
    curve: number;
    tipWidth: number;
    baseLong: number;
    baseShort: number;
  }> = {
    curve: 0.489,
    tipWidth: 0.269,
    baseLong: 0.0347,
    baseShort: 0.028,
  };

  /**
   * Authored tines per beam and their length/main-beam and radius/main-beam
   * ratios.
   */
  export const CONSTRUCTION: Readonly<{
    tines: number;
    tineLength: number;
    tineRadius: number;
  }> = { tines: 2, tineLength: 0.28, tineRadius: 0.6 };
}
