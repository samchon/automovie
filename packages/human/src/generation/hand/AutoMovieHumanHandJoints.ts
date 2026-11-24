import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanHandFingerPosture,
  IAutoMovieHumanHandFrame,
} from "@automovie/interface";

import { AutoMovieHumanHandPosture } from "./AutoMovieHumanHandPosture";
import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";

/** Hand joint datums and directions in the independent bind frame. */
export namespace AutoMovieHumanHandJoints {
  /**
   * Wrist centre distal of stylion in mm, de Leva's shared radiale-stylion
   * offset.
   */
  export const STYLION: number = 1.5;

  /**
   * A finger's proximal phalanx from the hand axis, with the bind's spread and
   * palmar flexion.
   */
  export function proximal(
    index: number,
    frame: IAutoMovieHumanHandFrame,
  ): AutoMovieVector3Tuple {
    const posture: IAutoMovieHumanHandFingerPosture =
      AutoMovieHumanHandPosture.FINGERS;
    const spread: number = (posture.spread[index - 1]! * Math.PI) / 180;
    const flexion: number = (posture.proximal[index - 1]! * Math.PI) / 180;
    const level: AutoMovieVector3Tuple = V.plus(
      V.scale(frame.along, Math.cos(spread)),
      V.scale(frame.across, Math.sin(spread)),
    );
    return V.unit(
      V.plus(
        V.scale(level, Math.cos(flexion)),
        V.scale(frame.palmar, Math.sin(flexion)),
      ),
    );
  }
}
