import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The shoulder's top line in the front view: from the side neck point, where
 * the neck base meets the trapezius' upper border, down to the acromion. The
 * trunk's front outline turns along it from the shoulder to the neck.
 *
 * Source: the person's own side neck point height and acromial height
 * (`IAutoMovieHumanBodyAnatomy`; ANSUR 1988 lateral neck height, ISO 7250-1
 * 6.1.4 shoulder height) fix the line's drop, and ANSUR 1988's shoulder
 * length, the side neck point to the acromion over the skin (Gordon et al.
 * 1989; 144.7 mm in women and 150.5 in men, means, `parameter-anatomy-survey.md`),
 * fixes its length. Derivation: with the skin path taken straight, the line's
 * horizontal run is `sqrt(L^2 - drop^2)` and its slope below the horizontal
 * `atan(drop / run)`; the acromion stands at half the biacromial breadth and
 * the side neck point the run medial to it. At the means (drop 62.9 and 67.0
 * mm) the slope is 25.8 degrees in women and 26.5 in men, beside the 22.5
 * (SD 5.0) FAA 1965 reported for 55 men (`faa-1965-shoulder-slope.md`); the
 * skin path's own curvature makes the straight chord a little shorter than
 * the tape, so the slope reads a little steep.
 *
 * Limits and pending: the shoulder length is the sex's mean, not the
 * person's; its line on the biacromial breadth (`test_human_survey_shoulder_line`)
 * replaces the mean when the survey readings run. The acromion's half breadth
 * is the bone's; the skin over it adds the soft tissue law still to come.
 */
export namespace AutoMovieHumanTrapeziusLine {
  /** ANSUR 1988 shoulder length, side neck point to acromion over the skin, women and men, mm (means). */
  export const SHOULDER_LENGTH: readonly [number, number] = [144.7, 150.5];

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
    const length: number = SHOULDER_LENGTH[measures.sex === AutoMovieHumanSex.Female ? 0 : 1];

    // A drop at or past the shoulder length leaves no run; the line then
    // stands vertical over the acromion rather than failing.
    const drop: number = Math.max(0, measures.sideNeckPointHeight - measures.acromialHeight);
    const run: number = Math.sqrt(Math.max(0, length * length - drop * drop));
    const lateral: number = measures.biacromialBreadth / 2;
    return {
      sideNeck: { height: measures.sideNeckPointHeight, lateral: lateral - run },
      acromion: { height: measures.acromialHeight, lateral },
      slope: (Math.atan2(drop, run) * 180) / Math.PI,
    };
  }
}
