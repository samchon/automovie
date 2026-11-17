import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type Archetype,
  type ArchetypeBuilder,
  ArchetypeRefusal,
} from "../core";
import { DeerBody } from "./DeerBody";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedHeadAttachment } from "./QuadrupedHeadAttachment";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse adult Boso sika reference with sex-matched controls and male antlers.
 *
 * Body and antler means come from the 1995 study's October 1992/1993
 * sample, with different trait counts. DeerBody separately declares the
 * older animals in the 1997 skull/limb study; these are not paired specimens.
 * The actual main-beam base disk is seated inside the actual head capsule.
 * Source tip width remains the coarse beam-axis tip spacing; the finite tube
 * ends do not reconstruct the measured antler's outer tip surfaces.
 *
 * @param params Optional fixed adult cohort, authored mass, antler presence, timing coordinate and lead.
 * @param seed Without a fixed cohort, draws whole adult references uniformly; seedless construction retains the male reference. An explicit antler request admits only the sourced male reference.
 * @returns The actual model; bare selected male/female references use their respective 60.4/39.5 kg means.
 * @throws {ArchetypeRefusal} For unsupported cohorts, female antlers, invalid mass/lead, or a lead without explicitly authored whole-model mass.
 * @evidence contracts/development/common.md#meaningful-documentation Separates sex/age-specific 1995 body/antler observations from older same-sex 1997 skeletal samples, authored catalogue frequencies and coarse branching; equipment requires explicit total mass.
 * @evidence contracts/development/implementation.md#principled-implementation DeerBody owns the cited Boso means and real bone lengths. Seat the complete beam base disk inside the actual head through the common capsule erosion, then preserve the source curve-length control and existing axis-tip spacing by a right triangle. Branch origins follow that same beam and retain their authored lengths; no source head measure changes.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit equipment mass ownership, let the shared factory pick one whole adult reference and add sourced male antlers only when its cohort and request admit them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Different trait counts and separate skeletal specimens are not asserted paired. Straight beam controls and two tines are construction proxies, not recovered antler surfaces, and no measured body mass silently includes newly authored equipment.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two fixed-size profile/rig/addition plans establish seed-independent admission, then only one actual body and its optional fixed-size antlers are emitted without mesh fitting.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared body/reference/lead owners build the actual model. The shared head attachment owner supplies one seated positive-side root mirrored for both antlers; the same beam vector locates all branch origins.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent scalar model records without retained callbacks, global registry, process or renderer.
 */
export function createDeer(
  params: createDeer.IParams = {},
  seed?: number | string,
): Archetype<createCohortQuadruped.Affordance, QuadrupedBody.Dimension> {
  if (params.antlers !== undefined && typeof params.antlers !== "boolean")
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "deer",
      axis: "antlers",
      value: params.antlers,
      feasible: { kind: "alternatives", values: ["true", "false"] },
      reason: "antler presence must be a boolean request",
      fix: "supply true, false or leave the cohort's default",
    });
  if (params.lead !== undefined && params.mass === undefined)
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "deer",
      axis: "mass",
      value: null,
      feasible: { kind: "range", minimum: 0, maximum: null, unit: "kg" },
      reason:
        "the bare animal's cohort mean does not measure authored lead equipment",
      fix: "supply the complete authored model mass when adding equipment",
    });
  return createCohortQuadruped<DeerBody.Cohort>({
    archetype: "deer",
    name: (cohort: DeerBody.Cohort): string =>
      cohort === "boso-adult-male"
        ? "adult male Boso sika prototype"
        : "adult female Boso sika prototype",
    names: DeerBody.COHORTS,
    choices: params.antlers === true ? ["boso-adult-male"] : DeerBody.COHORTS,
    reference: "boso-adult-male",
    cohort: params.cohort,
    references: DeerBody.REFERENCES,
    body: (cohort: DeerBody.Cohort): QuadrupedBody.IBody =>
      DeerBody(undefined, cohort),
    params,
    seed,
    prepare: (
      rig: QuadrupedBody.IRig,
      cohort: DeerBody.Cohort,
    ): createCohortQuadruped.Addition | undefined => {
      if (cohort === "boso-adult-female") {
        if (params.antlers === true)
          throw new ArchetypeRefusal({
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
      const base: IAutoMovieVector3 = QuadrupedHeadAttachment(
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
        builder: ArchetypeBuilder<
          createCohortQuadruped.Affordance,
          QuadrupedBody.Dimension
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

/**
 * The adult reference's source antler dimensions and authored coarse controls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names optional reference mass, antler presence, exact source dimensions and explicitly constructed branching.
 * @evidence contracts/development/design.md#principled-representation The shared authored contract separates a bare measured mean from equipment mass; source beam dimensions and estimated tines remain distinct records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface DeerBody owns the body and skull references while this producer owns only its actual antler addition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Source curve length is a coarse beam control, not a claim of recovered curvature or exact branching anatomy.
 */
export namespace createDeer {
  /** Explicit previous adult-male reference; its bare mass still comes from the source row. */
  export const REFERENCE: Readonly<Required<Pick<IParams, "cohort">>> = {
    cohort: "boso-adult-male",
  };

  /** Bare reference mass may be omitted; authored equipment requires explicit complete mass. */
  export interface IParams extends createCohortQuadruped.IParams {
    /** Fix male4+ or female2+; seeded omission draws adults and equipment must fit the whole unfixed palette. */
    cohort?: DeerBody.Cohort;

    /** Optional complete kilograms; the bare cohort mean when absent. */
    mass?: number;
    /** Male antlers default on for males and off for females; true with an explicit female cohort is refused. */
    antlers?: boolean;
  }

  /**
   * Ochiai and Asada 1995, Chiba 3(2):223-232, Table 7, printed p. 227
   * (PDF p. 5): Boso males age four or more, measured in October 1992/1993.
   * Table 1 gives 24 deer for each antler trait; left/right lengths and base
   * diameters were averaged per deer. The curve length, tip-to-tip width and
   * base ellipse diameters below convert its centimetre means to metres.
   * Curve length follows the antler, not a straight root-to-tip distance.
   * http://www.chiba-muse.or.jp/NATURAL/cms/wp-content/uploads/2024/01/journal_03-2_11ochiai.pdf
   * This is the body study's population with different trait counts; the
   * separate 1997 skull/limb references remain explicitly owned by DeerBody.
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

  /** Authored tines per beam and their length/main-beam and radius/main-beam ratios. */
  export const CONSTRUCTION: Readonly<{
    tines: number;
    tineLength: number;
    tineRadius: number;
  }> = { tines: 2, tineLength: 0.28, tineRadius: 0.6 };
}
