import { AutoMovieHumanGlutealDome } from "../AutoMovieHumanGlutealDome";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSolution } from "../IAutoMovieHumanTrunkSolution";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import type { AutoMovieHumanTrunkBuild } from "./AutoMovieHumanTrunkBuild";
import type { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";

/**
 * The trunk masses' laws: the left breast and gluteal mass, their footprints
 * and bare-wall setbacks from the reference set's mass footprints
 * (`AutoMovieHumanReferenceOutlines.BREAST_FOOTPRINT`, `GLUTEAL_FOOTPRINT`,
 * per stature, estimated from the private reference set: no published source
 * gives a mass's base on its wall; the owner's rule follows the reference
 * where data is short), their profiles today's dome. Public width/depth and
 * the shared generating height define each AP apex; the actual local wall
 * source then defines its projection. The retained wall setback is not that
 * local projection, and the old relief's displaced X/Z is not reused.
 */
export namespace AutoMovieHumanMassInterim {
  /**
   * The profile of today's trunk masses as the mass part's knots: today's
   * domes rise as the bump `h = A (1 - rho^2)^3` over their footprint
   * (`AutoMovieHumanTrunkFeatureProfile.bump`), so at the share `a` of the
   * amplitude the footprint's radius has shrunk to `rho = sqrt(1 - a^(1/3))`,
   * the same share on every edge.
   */
  const DOME: AutoMovieHumanTrunkBuild.IMassLaw["profile"] = [0.25, 0.5, 0.75, 0.95].map(
    (a: number): AutoMovieHumanTrunkBuild.IMassLaw["profile"][number] => {
      const rho: number = Math.sqrt(1 - a ** (1 / 3));
      return { at: a, shares: [rho, rho, rho, rho] };
    },
  );

  /**
   * The breast's retained bare-wall setback, calibration mm: the reference set's projection
   * of the bust point over the chest wall's line, per stature; none for a
   * man (the reading finds no mass on the men's chests). It sizes the bare
   * wall only; the actual mass amplitude is the AP apex minus its own local
   * source wall, not this difference between whole-depth boxes.
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The retained bare-wall setback, mm, zero where there is no breast.
   */
  export function breastAmplitude(measures: IAutoMovieHumanBodyMeasures, scale: number): number {
    if (measures.sex !== AutoMovieHumanSex.Female) return 0;
    return AutoMovieHumanReferenceOutlines.BREAST_FOOTPRINT.values.amplitude * measures.stature * scale;
  }

  /**
   * The gluteal mass's retained bare-wall setback, calibration mm: the reference set's
   * projection of the buttock's most posterior point over the sacral wall's
   * line, per stature, women and men apart. Actual mass amplitude is solved
   * separately from the declared posterior apex and its local source wall.
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The retained bare-wall setback, mm.
   */
  export function glutealAmplitude(measures: IAutoMovieHumanBodyMeasures, scale: number): number {
    return glutealTable(measures).values.amplitude * measures.stature * scale;
  }

  /**
   * The left breast's law: the AP apex at the same height as the chest tape,
   * its Z exactly half the public bust-point width and its X the back source
   * plus whole chest depth. The old relieved point's displaced X/Z is not
   * transferred. Its four footprint edges retain the reference ratios and
   * its profile today's dome. The table's lateral edge is where the skin falls back by the
   * amplitude, so it is the base's near bound (the chest wall curves away
   * beyond it). None for a man.
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The shared source height and back line, calibration mm.
   * @param fold The fold's radius, calibration mm.
   * @returns The law, or null where there is no breast.
   */
  export function breast(measures: IAutoMovieHumanBodyMeasures, scale: number, laws: AutoMovieHumanTrunkViews.ILaws, fold: number): AutoMovieHumanTrunkBuild.IMassLaw | null {
    if (measures.sex !== AutoMovieHumanSex.Female) return null;
    const v: AutoMovieHumanReferenceOutlines.IFootprint["values"] = AutoMovieHumanReferenceOutlines.BREAST_FOOTPRINT.values;
    const s: number = measures.stature * scale;
    const y: number = laws.chest;
    return {
      target: [laws.back(y) + measures.chestDepth * scale, y, measures.bustPointWidth * scale / 2],
      up: [0, 1, 0],
      footprint: [v.up * s, v.lateral * s, v.down * s, v.medial * s],
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }

  /**
   * The left gluteal mass's law: its target the gluteal apex (the trunk's
   * back line at the buttock point's height, `AutoMovieHumanTrunkLaws`),
   * across at today's apex share of the same public hip half breadth
   * (`AutoMovieHumanGlutealDome.LATERAL`), its four edges from the
   * reference set's footprint for the sex scaled by stature, the lower edge
   * held above the crotch (the gluteal fold ends the mass there; the women's
   * lower edge spreads nearly as wide as its mean), its profile today's dome.
   *
   * @param solution The old trunk's solve, for the retained buttock/crotch heights only.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The trunk's laws, for the back line.
   * @param fold The fold's radius, calibration mm.
   * @returns The law, or null where the amplitude leaves none.
   */
  export function gluteal(
    solution: IAutoMovieHumanTrunkSolution,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    laws: AutoMovieHumanTrunkViews.ILaws,
    fold: number,
  ): AutoMovieHumanTrunkBuild.IMassLaw | null {
    if (!(glutealAmplitude(measures, scale) > 0)) return null;
    const l: IAutoMovieHumanTrunkSolution["landmarks"] = solution.landmarks;
    const v: AutoMovieHumanReferenceOutlines.IFootprint["values"] = glutealTable(measures).values;
    const s: number = measures.stature * scale;
    const width: number = measures.hipBreadth * scale / 2;
    return {
      target: [laws.back(l.buttock), l.buttock, AutoMovieHumanGlutealDome.LATERAL * width],
      up: [0, 1, 0],
      footprint: [v.up * s, v.lateral * s, Math.min(v.down * s, l.buttock - l.crotch), v.medial * s],
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }

  /** The gluteal footprint for the person's sex. */
  function glutealTable(measures: IAutoMovieHumanBodyMeasures): AutoMovieHumanReferenceOutlines.IFootprint {
    return measures.sex === AutoMovieHumanSex.Female ? AutoMovieHumanReferenceOutlines.GLUTEAL_FOOTPRINT.female : AutoMovieHumanReferenceOutlines.GLUTEAL_FOOTPRINT.male;
  }
}
