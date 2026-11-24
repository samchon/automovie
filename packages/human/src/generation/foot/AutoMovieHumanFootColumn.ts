import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootWebLine,
} from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";

/** The ankle sides rise from their malleolar heights to the leg's ring. */
export namespace AutoMovieHumanFootColumn {
  /**
   * World controls preserve the ankle ring's position and each malleolus
   * height.
   */
  export function knots(
    which: "lateral" | "medial",
    frame: IAutoMovieHumanFootFrame.IFrame,
    _line: IAutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieVector3Tuple[] {
    const height: number = AutoMovieHumanFootPrior.PRIOR.malleoli[which].height;
    return [
      centre(which, frame, height),
      centre(which, frame, frame.ring / frame.H),
    ];
  }

  /**
   * A column side at a height in lateral malleolus units. ESTIMATE: the ankle
   * spans two thirds as much as the ball of the foot, symmetrically about the
   * foot's longitudinal course.
   */
  export function centre(
    which: "lateral" | "medial",
    frame: IAutoMovieHumanFootFrame.IFrame,
    height: number,
  ): AutoMovieVector3Tuple {
    return frame.at(
      AutoMovieHumanFootPlaces.ANKLE,
      which === "medial" ? 1 / 6 : 5 / 6,
      height * frame.H,
    );
  }
}
