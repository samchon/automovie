import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootBones,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootHeads,
  IAutoMovieHumanFootPrior,
  IAutoMovieHumanFootToeLines,
} from "@automovie/interface";

import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanFootColumn } from "./AutoMovieHumanFootColumn";
import { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootHeads } from "./AutoMovieHumanFootHeads";
import { AutoMovieHumanFootToeJoints } from "./AutoMovieHumanFootToeJoints";
import { AutoMovieHumanFootToeLines } from "./AutoMovieHumanFootToeLines";

/**
 * The foot's anatomical centres from its three dimensions, before any skin:
 * the ankle at the lateral malleolus height, the metatarsal heads
 * ({@link AutoMovieHumanFootHeads}), each toe's line and joints
 * ({@link AutoMovieHumanFootToeLines}, {@link AutoMovieHumanFootToeJoints}) and
 * the malleoli on their borders ({@link AutoMovieHumanFootColumn.centre}),
 * built in the left foot's
 * frame; the right foot's centres are its reflection.
 */
export namespace AutoMovieHumanFootBones {
  /**
   * A foot's centres.
   *
   * @param d Dimensions in calibration millimetres.
   * @param sign 1 for the left foot, -1 for the right's reflected centres.
   */
  export function of(
    d: IAutoMovieHumanFootFrame.IDimensions,
    sign: 1 | -1,
  ): IAutoMovieHumanFootBones.ICentres {
    const prior: IAutoMovieHumanFootPrior.IPrior =
      AutoMovieHumanFootPrior.PRIOR;
    const frame: IAutoMovieHumanFootFrame.IFrame =
      AutoMovieHumanFootFrame.of(d);
    const heads: IAutoMovieHumanFootHeads.IHeads =
      AutoMovieHumanFootHeads.of(frame);
    const lines: IAutoMovieHumanFootToeLines.ILine[] =
      AutoMovieHumanFootToeLines.of(frame, heads.heads);
    const sided = (p: AutoMovieVector3Tuple): AutoMovieVector3Tuple =>
      G.sided(p, sign);

    return {
      frame,
      lines,
      bones: {
        ankle: [0, frame.H, 0],
        malleoli: {
          lateral: sided(
            AutoMovieHumanFootColumn.centre(
              "lateral",
              frame,
              prior.malleoli.lateral.height,
            ),
          ),
          medial: sided(
            AutoMovieHumanFootColumn.centre(
              "medial",
              frame,
              prior.malleoli.medial.height,
            ),
          ),
        },
        heads: heads.heads.map(sided),
        ball: sided(heads.ball),
        toes: AutoMovieHumanFootToeJoints.of(lines).map(
          (joints: AutoMovieVector3Tuple[]): AutoMovieVector3Tuple[] =>
            joints.map(sided),
        ),
      },
    };
  }
}
