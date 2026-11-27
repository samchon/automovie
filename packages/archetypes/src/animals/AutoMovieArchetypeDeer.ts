import { type AutoMovieArchetype } from "../core/index";
import { createCohortQuadruped } from "./quadruped/createCohortQuadruped";
import { type AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { createDeer as createDeerImplementation } from "./deer/createDeer";
import { DeerCohorts } from "./deer/DeerCohorts";

/** Public operations for Auto Movie Archetype Deer. */
export namespace AutoMovieArchetypeDeer {
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
  export function create(params?: AutoMovieArchetypeDeer.IParams, seed?: number): AutoMovieArchetype<
  createCohortQuadruped.Affordance,
  AutoMovieArchetypeQuadrupedBody.Dimension
> {
    return createDeerImplementation(params, seed);
  }

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
    cohort?: DeerCohorts.Name;

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
   * The body study samples different trait counts. The separate 1997 skull and
   * limb references come from older animals.
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
  }> = { tines: 2, tineLength: 0.28, tineRadius: 0.6 };}
