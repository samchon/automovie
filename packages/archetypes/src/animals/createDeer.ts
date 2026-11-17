import {
  type Archetype,
  type ArchetypeBuilder,
  ArchetypeRefusal,
} from "../core";
import { DeerBody } from "./DeerBody";
import type { QuadrupedBody } from "./QuadrupedBody";
import { createCohortQuadruped } from "./createCohortQuadruped";

/**
 * A coarse adult male Boso sika reference with source-sized antler beam controls.
 *
 * Body and antler means come from the 1995 study's October 1992/1993
 * sample, with different trait counts. DeerBody separately declares the
 * older animals in the 1997 skull/limb study; these are not paired specimens.
 *
 * @param params Optional authored mass, antler presence, timing coordinate and lead.
 * @param seed Independent construction seed.
 * @returns The actual shared deer model; absent mass uses the bare cohort's 60.4 kg mean.
 * @throws {ArchetypeRefusal} For invalid authored mass/lead, or a lead without explicitly authored whole-model mass.
 * @evidence contracts/development/common.md#meaningful-documentation Separates the 1995 adult male body/antler study and its trait-dependent counts from the older 1997 skeletal controls and coarse branching construction; equipment requires explicit total mass.
 * @evidence contracts/development/implementation.md#principled-implementation DeerBody owns the cited Boso means and real bone lengths. Antler beam controls preserve the published curve length and total tip width by an independent right triangle; named constructed tines remain distinct from the measured main-beam dimensions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit equipment mass ownership, supply the coherent body and add two source-sized coarse beams and their explicitly constructed tines.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Different trait counts and separate skeletal specimens are not asserted paired. Straight beam controls and two tines are construction proxies, not recovered antler surfaces, and no measured body mass silently includes newly authored equipment.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size body and two main beams with a fixed number of tines; all coordinates follow named lengths and fractions without mesh fitting.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared body/reference/lead owners build the actual model; both antlers use the same source and construction definition.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent scalar model records without retained callbacks, global registry, process or renderer.
 */
export function createDeer(
  params: createDeer.IParams = {},
  seed?: number | string,
): Archetype<createCohortQuadruped.Affordance, QuadrupedBody.Dimension> {
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
  const m: typeof DeerBody.MEASURES = DeerBody.MEASURES;
  const actual: createCohortQuadruped.IParams = {
    ...params,
    mass: params.mass ?? m.mass,
  };
  return createCohortQuadruped({
    archetype: "deer",
    name: "adult male Boso sika prototype",
    cohort: "boso-adult-male",
    withers: m.withers,
    girth: m.girth,
    body: DeerBody(),
    params: actual,
    seed,
    add: (
      builder: ArchetypeBuilder<
        createCohortQuadruped.Affordance,
        QuadrupedBody.Dimension
      >,
      rig: QuadrupedBody.IRig,
    ): void => {
      if (params.antlers === false) return;
      const a: typeof createDeer.ANTLERS = createDeer.ANTLERS;
      const root: number = rig.headRadius;
      const lateral: number = a.tipWidth / 2 - root;
      const rise: number = Math.sqrt(a.curve * a.curve - lateral * lateral);
      const radius: number = (a.baseLong + a.baseShort) / 4;
      for (const [side, sign] of [
        ["left", 1],
        ["right", -1],
      ] as const) {
        const y: number = rig.poll.y + rig.headRadius;
        builder.rod(
          `${side}Antler`,
          radius,
          { x: sign * root, y, z: rig.poll.z },
          { x: (sign * a.tipWidth) / 2, y: y + rise, z: rig.poll.z },
          { color: "#b2a184" },
        );
        for (let i: number = 1; i <= createDeer.CONSTRUCTION.tines; i++) {
          const share: number = i / (createDeer.CONSTRUCTION.tines + 1);
          const startX: number = sign * (root + lateral * share);
          const startY: number = y + rise * share;
          const length: number = a.curve * createDeer.CONSTRUCTION.tineLength;
          builder.rod(
            `${side}AntlerTine${i}`,
            radius * createDeer.CONSTRUCTION.tineRadius,
            { x: startX, y: startY, z: rig.poll.z },
            {
              x: startX,
              y: startY + length * Math.SQRT1_2,
              z: rig.poll.z + length * Math.SQRT1_2,
            },
            { color: "#b2a184" },
          );
        }
      }
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
  /** Bare reference mass may be omitted; authored equipment requires explicit complete mass. */
  export interface IParams extends Omit<createCohortQuadruped.IParams, "mass"> {
    /** Optional complete kilograms; the bare cohort mean when absent. */
    mass?: number;
    /** Draw coarse male antlers, true when absent. */
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
