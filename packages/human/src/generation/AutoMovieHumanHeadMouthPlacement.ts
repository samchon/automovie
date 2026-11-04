import { AutoMovieHumanHeadSkinReading } from "./AutoMovieHumanHeadSkinReading";
import { AutoMovieHumanMouth } from "./AutoMovieHumanMouth";
import type { IAutoMovieHumanHeadSurface } from "./IAutoMovieHumanHeadSurface";

/**
 * The mouth placed from this head's lips: the fissure along the contact line
 * the lips' relief draws, and the interior behind it (`AutoMovieHumanMouth`).
 */
export namespace AutoMovieHumanHeadMouthPlacement {
  /**
   * The mouth placed from this head's lips: the fissure along the contact
   * line the lips' relief draws, and the interior behind it
   * (`AutoMovieHumanMouth`).
   */
  export function mouthOf(surface: IAutoMovieHumanHeadSurface): AutoMovieHumanMouth.IOutput {
    const { plan } = surface;
    return AutoMovieHumanMouth.create({
      stomion: plan.stomion,
      width: plan.mouthWidth,
      upper: plan.upperLip,
      lower: plan.lowerLip,
      gap: plan.gap,
      subnasale: plan.subnasale,
      menton: plan.menton,
      sex: plan.sex,
      gonion: plan.mandible!.gonion,
      // The fissure's midline in `relief`.
      contact: (u: number): number => plan.stomion + 1.2 * plan.scale * u * u,
      front: (y: number, z: number): number => AutoMovieHumanHeadSkinReading.frontAt(surface, y, z),
    });
  }
}
