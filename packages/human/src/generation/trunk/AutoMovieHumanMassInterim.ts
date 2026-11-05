import { AutoMovieHumanGlutealDome } from "../AutoMovieHumanGlutealDome";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSolution } from "../IAutoMovieHumanTrunkSolution";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import type { AutoMovieHumanTrunkBuild } from "./AutoMovieHumanTrunkBuild";
import type { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";

/**
 * The trunk masses' laws: the left breast and gluteal mass, their footprints
 * and amplitudes from the reference set's mass footprints
 * (`AutoMovieHumanReferenceOutlines.BREAST_FOOTPRINT`, `GLUTEAL_FOOTPRINT`,
 * per stature, estimated from the private reference set: no published source
 * gives a mass's base on its wall; the owner's rule follows the reference
 * where data is short), their profiles today's dome. The base under each mass
 * stands the amplitude behind the mass's point (`AutoMovieHumanTrunkViews`),
 * so the point keeps its published depth.
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
   * The breast's amplitude, calibration mm: the reference set's projection
   * of the bust point over the chest wall's line, per stature; none for a
   * man (the reading finds no mass on the men's chests).
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The amplitude, mm, zero where there is no breast.
   */
  export function breastAmplitude(measures: IAutoMovieHumanBodyMeasures, scale: number): number {
    if (measures.sex !== AutoMovieHumanSex.Female) return 0;
    return AutoMovieHumanReferenceOutlines.BREAST_FOOTPRINT.values.amplitude * measures.stature * scale;
  }

  /**
   * The gluteal mass's amplitude, calibration mm: the reference set's
   * projection of the buttock's most posterior point over the sacral wall's
   * line, per stature, women and men apart.
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The amplitude, mm.
   */
  export function glutealAmplitude(measures: IAutoMovieHumanBodyMeasures, scale: number): number {
    return glutealTable(measures).values.amplitude * measures.stature * scale;
  }

  /**
   * The left breast's law: its axis through today's bust point
   * (`IAutoMovieHumanTrunkLandmarks.bustPoint`), its four edges and amplitude
   * the reference set's footprint scaled by stature, its profile today's
   * dome. The table's lateral edge is where the skin falls back by the
   * amplitude, so it is the base's near bound (the chest wall curves away
   * beyond it). None for a man.
   *
   * @param solution The old trunk's solve, for the bust point.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param fold The fold's radius, calibration mm.
   * @returns The law, or null where there is no breast.
   */
  export function breast(solution: IAutoMovieHumanTrunkSolution, measures: IAutoMovieHumanBodyMeasures, scale: number, fold: number): AutoMovieHumanTrunkBuild.IMassLaw | null {
    const amplitude: number = breastAmplitude(measures, scale);
    if (!(amplitude > 0)) return null;
    const v: AutoMovieHumanReferenceOutlines.IFootprint["values"] = AutoMovieHumanReferenceOutlines.BREAST_FOOTPRINT.values;
    const s: number = measures.stature * scale;
    const p: [number, number, number] = solution.landmarks.bustPoint;
    return {
      target: [p[0], p[1], p[2]],
      up: [0, 1, 0],
      footprint: [v.up * s, v.lateral * s, v.down * s, v.medial * s],
      amplitude,
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }

  /**
   * The left gluteal mass's law: its target the gluteal apex (the trunk's
   * back line at the buttock point's height, `AutoMovieHumanTrunkLaws`),
   * across at today's apex share of the half width
   * (`AutoMovieHumanGlutealDome.LATERAL`), its four edges and amplitude the
   * reference set's footprint for the sex scaled by stature, the lower edge
   * held above the crotch (the gluteal fold ends the mass there; the women's
   * lower edge spreads nearly as wide as its mean), its profile today's dome.
   *
   * @param solution The old trunk's solve, for the heights and the half width.
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
    const amplitude: number = glutealAmplitude(measures, scale);
    if (!(amplitude > 0)) return null;
    const l: IAutoMovieHumanTrunkSolution["landmarks"] = solution.landmarks;
    const v: AutoMovieHumanReferenceOutlines.IFootprint["values"] = glutealTable(measures).values;
    const s: number = measures.stature * scale;
    const width: number = solution.column.at(l.buttock).width;
    return {
      target: [laws.back(l.buttock), l.buttock, AutoMovieHumanGlutealDome.LATERAL * width],
      up: [0, 1, 0],
      footprint: [v.up * s, v.lateral * s, Math.min(v.down * s, l.buttock - l.crotch), v.medial * s],
      amplitude,
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
