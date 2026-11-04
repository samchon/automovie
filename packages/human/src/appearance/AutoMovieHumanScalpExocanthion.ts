import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";

/**
 * The lateral place of the exocanthion (the outer corner of the eye) on the
 * canonical side (+Z, the person's left): its distance from the midline. The
 * head publishes the landmark; on a calibration without it, it is half the
 * intercanthal width (en-en) plus the palpebral fissure length (en-ex), the
 * head's own inputs. The hairline's frontotemporal apex stands on the
 * sagittal plane through it (Jung and Yun 2014).
 */
export namespace AutoMovieHumanScalpExocanthion {
  /**
   * Distance of the exocanthion from the midline.
   *
   * @param published The published exocanthion's lateral coordinate in the
   *   chart's frame, or null
   * @param midline Head-local lateral coordinate of the midline, millimetres
   * @param head The head inputs
   * @returns Distance, millimetres
   */
  export function distance(
    published: number | null,
    midline: number,
    head: IAutoMovieHumanParameters["head"],
  ): number {
    return published !== null
      ? Math.abs(published - midline)
      : head.face.intercanthalWidth / 2 +
          head.face.eyePair.left.palpebralFissureLength;
  }
}
