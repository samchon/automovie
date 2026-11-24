import type {
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieHumanTrunkSolution,
  IAutoMovieHumanTrunkViewLaws,
} from "@automovie/interface";

import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import { AutoMovieHumanChestWall } from "../AutoMovieHumanChestWall";
import { AutoMovieHumanLumbarSection } from "../AutoMovieHumanLumbarSection";
import { AutoMovieHumanTrunkLandmarks } from "../AutoMovieHumanTrunkLandmarks";

/**
 * Trunk mass footprints from the person's chest, bust and hip dimensions and
 * adjacent bare-wall estimates. The actual source wall and the declared apex
 * define each mass's attachment projection.
 */
export namespace AutoMovieHumanMassInterim {
  /**
   * Half the female corpus sterni breadth at the fourth to fifth costal
   * notches, 27.8 mm across in 103 women (Atesoglu et al. 2018, Table 1).
   * Transfer the bony lateral edge to the medial breast footprint where the
   * person supplies no sternal breadth.
   */
  const STERNUM_HALF_MM: number = 27.8 / 2;

  /**
   * The profile of today's trunk masses as the mass part's knots: today's domes
   * rise as the bump `h = A (1 - rho^2)^3` over their footprint
   * (`AutoMovieHumanTrunkFeatureProfile.bump`), so at the share `a` of the
   * amplitude the footprint's radius has shrunk to `rho = sqrt(1 - a^(1/3))`,
   * the same share on every edge. These named samples are the current source
   * constraints. MassPart's bounded C2 interpolation is not exact analytic bump
   * replay: the inverse radius has an infinite AP derivative at a=0, whereas
   * this finite regular-wall construction holds its internal section.
   */
  const DOME: IAutoMovieHumanTrunkBuild.IMassLaw["profile"] = [
    0.25, 0.5, 0.75, 0.95,
  ].map((a: number): IAutoMovieHumanTrunkBuild.IMassLaw["profile"][number] => {
    const rho: number = Math.sqrt(1 - a ** (1 / 3));
    return { at: a, shares: [rho, rho, rho, rho] };
  });

  /**
   * The positive difference between whole chest depth and the chest wall's
   * depth estimated from the same person's underbust tape. ESTIMATE: transfer
   * the underbust depth to the neighbouring chest station. The separate breast
   * operator uses the true projection onto the local wall.
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The median bare-wall setback, mm, zero where no breast projection
   *   is specified.
   */
  export function breastAmplitude(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): number {
    if (measures.sex !== AutoMovieHumanSex.Female) return 0;
    const depth: number = AutoMovieHumanChestWall.box(
      measures,
      measures.underbustCircumference,
    ).depth;
    return Math.max(0, measures.chestDepth - depth) * scale;
  }

  /**
   * The positive difference between the person's buttock depth and the
   * unprojected depth of their high-hip section. ESTIMATE: use the adjacent
   * high-hip section's depth as the bare pelvic wall at the buttock level.
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The median bare-wall setback, mm.
   */
  export function glutealAmplitude(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
  ): number {
    const depth: number = AutoMovieHumanLumbarSection.box(
      measures,
      measures.highHipCircumference,
    ).depth;
    return Math.max(0, measures.buttockDepth - depth) * scale;
  }

  /**
   * The left breast's law: the AP apex at the same height as the chest tape,
   * its Z half the person's bust-point width and its X the back plus whole
   * chest depth. ESTIMATE: the vertical base reaches two interspaces to either
   * side of that station, reusing the trunk's named fold drop. The medial edge
   * stands at the lateral sternum. The lateral edge meets the axilla's
   * horizontal support when that support is beyond the apex, or the measured
   * chest half-breadth otherwise.
   *
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The shared source height and back line, calibration mm.
   * @param fold The fold's radius, calibration mm.
   * @param crotch The person's crotch level, calibration mm.
   * @param setback The already resolved median bare-wall setback, calibration
   *   mm.
   * @returns The law, or null where there is no breast.
   */
  export function breast(
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    laws: IAutoMovieHumanTrunkViewLaws.ILaws,
    fold: number,
    crotch: number,
    setback: number,
  ): IAutoMovieHumanTrunkBuild.IMassLaw | null {
    if (measures.sex !== AutoMovieHumanSex.Female || !(setback > 0))
      return null;
    const y: number = laws.chest;
    const z: number = (measures.bustPointWidth * scale) / 2;
    const chest: number = (measures.chestBreadth * scale) / 2;
    const axilla: number =
      laws.upper.find(({ site }): boolean => site === "axilla")?.half ?? chest;
    const lateral: number = Math.min(chest, axilla > z ? axilla : chest) - z;
    const medial: number = z - STERNUM_HALF_MM * scale;
    const height: number =
      AutoMovieHumanTrunkLandmarks.FOLD_DROP *
      (measures.cervicaleHeight * scale - crotch);
    if (!(lateral > 0 && medial > 0 && height > 0)) return null;
    return {
      target: [laws.back(y) + measures.chestDepth * scale, y, z],
      up: [0, 1, 0],
      footprint: [height, lateral, height, medial],
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }

  /**
   * The left gluteal mass's law: its target the gluteal apex (the trunk's back
   * line at the buttock point's height, `AutoMovieHumanTrunkLaws`), across at
   * the centre of its pelvic half. ESTIMATE: leave one fold radius of clearance
   * to either transverse boundary. The vertical base reaches the crotch and the
   * iliocristale level from the person's trunk landmarks. Actual contact is
   * read from the trunk-plus-leg parent.
   *
   * @param landmarks The person's buttock and crotch heights, calibration mm.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @param laws The trunk's laws, for the back line.
   * @param fold The fold's radius, calibration mm.
   * @param setback The already resolved median bare-wall setback, calibration
   *   mm.
   * @returns The law, or null where the amplitude leaves none.
   */
  export function gluteal(
    landmarks: Pick<
      IAutoMovieHumanTrunkSolution["landmarks"],
      "buttock" | "crotch"
    >,
    measures: IAutoMovieHumanBodyMeasures,
    scale: number,
    laws: IAutoMovieHumanTrunkViewLaws.ILaws,
    fold: number,
    setback: number,
  ): IAutoMovieHumanTrunkBuild.IMassLaw | null {
    if (!(setback > 0)) return null;
    const z: number = (measures.hipBreadth * scale) / 4;
    const half: number = z - fold;
    const iliocristale: number = AutoMovieHumanTrunkLandmarks.at(
      landmarks.crotch,
      measures.cervicaleHeight * scale,
      AutoMovieHumanTrunkLandmarks.ILIOCRISTALE,
    );
    const up: number = iliocristale - landmarks.buttock;
    const down: number = landmarks.buttock - landmarks.crotch;
    if (!(half > 0 && up > 0 && down > 0)) return null;
    return {
      target: [laws.back(landmarks.buttock), landmarks.buttock, z],
      up: [0, 1, 0],
      footprint: [up, half, down, half],
      profile: DOME,
      shoulder: Math.SQRT2 - 1,
      fold,
    };
  }
}
