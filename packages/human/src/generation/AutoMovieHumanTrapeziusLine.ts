import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The shoulder's top line in the front view: from the side neck point, where
 * the neck base meets the trapezius' upper border, down to the acromion. The
 * trunk's front outline turns along it from the shoulder to the neck.
 *
 * Source: ANSUR 1988 (Gordon et al. 1989; 2,208 women and 1,774 men) takes,
 * on the same subjects, the lateral neck height, the acromial height and the
 * shoulder length (side neck point to acromion over the skin). Derivation:
 * the line's drop is the two heights' difference, its horizontal run the
 * shoulder length's chord less the drop, `sqrt(L^2 - drop^2)`, the skin path
 * taken straight. Per subject the run follows the biacromial breadth
 * (`RUN_ON_BIACROMIAL`, R2 0.46 and 0.42) and the slope below the horizontal
 * is 25.7 (SD 3.9) degrees in women and 26.4 (4.0) in men
 * (`test_human_survey_shoulder_line`), beside FAA 1965's 22.5 (5.0) for 55
 * men (`docs/sources/faa-1965-shoulder-slope.md`). The person's line takes
 * its drop from their own side neck point and acromial heights and its run
 * from their biacromial breadth; the acromion stands at half that breadth and
 * the side neck point the run medial to it.
 *
 * Limits: the acromion's half breadth is the bone's; the skin over it adds the
 * soft tissue law still to come. A straight chord stands for the skin path,
 * whose own curvature makes the run a little short and the slope a little
 * steep.
 */
export namespace AutoMovieHumanTrapeziusLine {
  /**
   * The line's horizontal run on the biacromial breadth, women and men, mm:
   * ANSUR 1988, `sqrt(SHOULDER_LNTH^2 - (NECK_HT-LATERAL - ACROMION_HT)^2)` on
   * `BIACROMIAL_BRTH`, R2 0.46 and 0.42, residual SD 6.9 and 7.3 mm.
   */
  export const RUN_ON_BIACROMIAL: readonly [{ readonly a: number; readonly b: number }, { readonly a: number; readonly b: number }] = [
    { a: -2.21, b: 0.3643 },
    { a: -1.85, b: 0.3431 },
  ];

  /** The line's two ends and slope. */
  export interface ILine {
    /** The side neck point: height above the floor and lateral place from the midline, mm. */
    sideNeck: { height: number; lateral: number };

    /** The acromion: height above the floor and lateral place from the midline (the bone's), mm. */
    acromion: { height: number; lateral: number };

    /** Slope below the horizontal, degrees. */
    slope: number;
  }

  /**
   * A person's shoulder line, on each side alike.
   *
   * @param measures A person's resolved measures.
   */
  export function of(measures: IAutoMovieHumanBodyMeasures): ILine {
    const fit: { readonly a: number; readonly b: number } = RUN_ON_BIACROMIAL[measures.sex === AutoMovieHumanSex.Female ? 0 : 1];
    const lateral: number = measures.biacromialBreadth / 2;

    // A run is held inside the half breadth, so the side neck point never
    // crosses the midline; a drop below zero (a side neck point under the
    // acromion, which no adult shows) is read as level.
    const run: number = Math.min(lateral, Math.max(0, fit.a + fit.b * measures.biacromialBreadth));
    const drop: number = Math.max(0, measures.sideNeckPointHeight - measures.acromialHeight);
    return {
      sideNeck: { height: measures.sideNeckPointHeight, lateral: lateral - run },
      acromion: { height: measures.acromialHeight, lateral },
      slope: (Math.atan2(drop, run) * 180) / Math.PI,
    };
  }
}
