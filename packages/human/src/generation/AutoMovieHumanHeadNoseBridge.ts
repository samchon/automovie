import { AutoMovieEngineNaturalSpline } from "@automovie/engine";
import type {
  IAutoMovieHumanHeadCompiled,
  IAutoMovieHumanHeadNoseFrame,
  IAutoMovieHumanHeadPrior,
} from "@automovie/interface";

import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";

/**
 * The nasal root and dorsum as a relief window in the nose's frame: the
 * ridge that rises from the soft-tissue nasion down the bridge to the tip.
 * Along the nose its height follows the prior's profile spline (its shape
 * normalised by the tip's lead), across it a bell whose width follows the
 * dorsum spline in the person's own nose width. The ridge starts at the
 * nasion, where the midline profile alone draws the face, and rises over the
 * root's last {@link ROOT} of the span, so the nasion's hollow stays the
 * profile's.
 *
 * Reads: the nose's frame at the point, the compiled profile and dorsum
 * splines and the prior's profile knots. Publishes a height in millimetres,
 * zero outside the nose's span and with level slope at both ends.
 */
export namespace AutoMovieHumanHeadNoseBridge {
  /**
   * Height of the ridge at a distance from the midline.
   *
   * @param frame The nose's measures at the point's height.
   * @param compiled The prior's profile and dorsum splines.
   * @param knots The profile's knots, whose first is the nasion's share.
   * @param a Distance of the point from the midline, `|z|`.
   * @returns Height in millimetres, zero off the dorsum.
   */
  export function ridge(
    frame: IAutoMovieHumanHeadNoseFrame.IFrame,
    compiled: Pick<IAutoMovieHumanHeadCompiled, "profile" | "dorsum">,
    knots: IAutoMovieHumanHeadPrior.IFace["profileKnots"],
    a: number,
  ): number {
    const v: number = frame.v;
    return v > knots[0]! && v < 1
      ? Math.max(0, AutoMovieEngineNaturalSpline.evaluate(compiled.profile, v)) *
          AutoMovieHumanHeadMath.smooth((1 - v) / ROOT) *
          frame.lead *
          AutoMovieHumanHeadMath.bell(
            a /
              (frame.width *
                AutoMovieEngineNaturalSpline.evaluate(compiled.dorsum, v)),
          )
      : 0;
  }

  /**
   * Share of the span from the nasion to the tip over which the dorsum rises
   * from the nasion: the root's last third, a construction share that keeps the
   * ridge from filling the nasion's hollow.
   */
  export const ROOT: number = 0.3;
}
