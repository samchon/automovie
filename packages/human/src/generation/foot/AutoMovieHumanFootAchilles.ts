import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootFrame,
} from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";

/** The posterior ankle joins the heel's quarter ellipse to the ankle ring. */
export namespace AutoMovieHumanFootAchilles {
  /**
   * Continue the heel corner's side toward the ankle. ESTIMATE: at the ankle
   * ring the tendon lies one third of the heel-to-ankle offset forward of the
   * heel. The side spacing comes from the heel corner.
   */
  export function knots(
    frame: IAutoMovieHumanFootFrame.IFrame,
    side: -1 | 1,
  ): AutoMovieVector3Tuple[] {
    const base: number = AutoMovieHumanFootHeelCorner.height(frame);
    return [1 / 2, 1].map(
      (share: number): AutoMovieVector3Tuple =>
        frame.at(
          (AutoMovieHumanFootPlaces.ANKLE * share) / 3,
          1 / 2 + side * AutoMovieHumanFootHeelCorner.HALF,
          base + share * (frame.ring - base),
        ),
    );
  }
}
