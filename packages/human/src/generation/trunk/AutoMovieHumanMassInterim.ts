import { AutoMovieHumanBreastFootprint } from "../AutoMovieHumanBreastFootprint";
import { AutoMovieHumanGlutealDome } from "../AutoMovieHumanGlutealDome";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import type { IAutoMovieHumanTrunkSolution } from "../IAutoMovieHumanTrunkSolution";
import type { AutoMovieHumanTrunkBuild } from "./AutoMovieHumanTrunkBuild";
import type { AutoMovieHumanTrunkViews } from "./AutoMovieHumanTrunkViews";

/**
 * The trunk masses' interim laws (#3044's rule for priors the campaign has
 * not yet replaced; `log-body.md`, "Interim accessors"): the left breast and
 * gluteal mass from today's pieces, their amplitudes the published outline
 * differences, their footprints and profiles today's. The masses' own laws
 * replace these when the input and laws worker lands them.
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
   * Interim accessor: the left breast's law from today's breast pieces: its
   * axis through today's bust point (`IAutoMovieHumanTrunkLandmarks.bustPoint`),
   * its footprint today's (`AutoMovieHumanBreastFootprint`: the lateral half
   * width a share of the bust point's place off the midline, the lower reach
   * to the inframammary fold and the upper reach a multiple of it), its
   * profile today's dome. The amplitude is the published outline difference:
   * the chest depth less the chest wall's at the underbust
   * (`AutoMovieHumanChestWall`), so the base and the breast never count the
   * bust twice; none where it is not positive. Owed laws: the breast's
   * footprint and profile.
   *
   * @param solution The old trunk's solve.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The trunk's laws.
   * @param fold The fold's radius, calibration mm.
   * @returns The law, or null where the amplitude is not positive.
   */
  export function breast(
    solution: IAutoMovieHumanTrunkSolution,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    laws: AutoMovieHumanTrunkViews.ILaws,
    fold: number,
  ): AutoMovieHumanTrunkBuild.IMassLaw | null {
    const l: IAutoMovieHumanTrunkSolution["landmarks"] = solution.landmarks;
    const wall: number = laws.chestWall(measures.underbustCircumference * scale).depth;
    const amplitude: number = measures.chestDepth * scale - wall;
    if (!(amplitude > 0)) return null;
    const width: number = solution.column.at(l.bust).width;
    const print: AutoMovieHumanBreastFootprint.IFootprint = AutoMovieHumanBreastFootprint.create(Math.min(0.8 * width, (measures.bustPointWidth * scale) / 2), l.bust - l.fold);
    return {
      target: [l.bustPoint[0], l.bustPoint[1], l.bustPoint[2]],
      up: [0, 1, 0],
      footprint: [print.upper, print.half, print.lower, print.half],
      amplitude,
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }

  /**
   * Interim accessor: the left gluteal mass's law from today's gluteal
   * pieces: its target the gluteal apex (the trunk's back line at the
   * buttock point's height, `AutoMovieHumanTrunkLaws`), across at today's apex share of the half width
   * (`AutoMovieHumanGlutealDome.LATERAL`), its footprint today's (from
   * `MEDIAL` to `OUTER` of the half width across, from the crotch up to
   * iliocristale), its profile today's dome. The amplitude is the published
   * outline difference, the buttock depth less the natural waist's (#3047).
   * Owed laws: the gluteal mass's footprint and profile.
   *
   * @param solution The old trunk's solve.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The trunk's laws.
   * @param fold The fold's radius, calibration mm.
   * @returns The law, or null where the amplitude is not positive.
   */
  export function gluteal(
    solution: IAutoMovieHumanTrunkSolution,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    laws: AutoMovieHumanTrunkViews.ILaws,
    fold: number,
  ): AutoMovieHumanTrunkBuild.IMassLaw | null {
    const l: IAutoMovieHumanTrunkSolution["landmarks"] = solution.landmarks;
    const amplitude: number = (measures.buttockDepth - measures.waistDepth) * scale;
    if (!(amplitude > 0)) return null;
    const width: number = solution.column.at(l.buttock).width;
    const D: typeof AutoMovieHumanGlutealDome = AutoMovieHumanGlutealDome;
    return {
      target: [laws.back(l.buttock), l.buttock, D.LATERAL * width],
      up: [0, 1, 0],
      footprint: [l.iliocristale - l.buttock, (D.OUTER - D.LATERAL) * width, l.buttock - l.crotch, (D.LATERAL - D.MEDIAL) * width],
      amplitude,
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }
}
