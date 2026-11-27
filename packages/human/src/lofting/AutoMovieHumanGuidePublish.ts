import { AutoMovieEnginePolarSector } from "@automovie/engine";
import type {
  IAutoMovieArcLengthJet,
  IAutoMoviePolarSector,
} from "@automovie/interface";

import { AutoMovieHumanSeam } from "./AutoMovieHumanSeam";

/**
 * A polar guide's jet published by arclength in its section's chart (rule
 * J1), the form a seam's owner hands its neighbour: the guide's point and its
 * angle derivatives (`AutoMovieEnginePolarSector.point`) turned into the arclength
 * jet of `AutoMovieHumanSeam.publish`.
 */
export namespace AutoMovieHumanGuidePublish {
  /**
   * A guide's published jet.
   *
   * @param guide The guide.
   * @param scale A factor on the guide's radius and its derivatives.
   * @returns The arclength jet.
   */
  export function publish(
    guide: IAutoMoviePolarSector.IGuide,
    scale: number = 1,
  ): IAutoMovieArcLengthJet {
    const [p, d1, d2] = AutoMovieEnginePolarSector.point(
      [scale * guide.value, scale * guide.slope, scale * guide.curvature],
      guide.angle,
    );
    return AutoMovieHumanSeam.publish(p, d1, d2);
  }
}
