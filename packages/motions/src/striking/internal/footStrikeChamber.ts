import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFootStrike,
  IAutoMovieVector3,
} from "@automovie/interface";

import { FootStrikeForms } from "./FootStrikeForms";

/*
 * A foot strike's authored chamber ankle: the knee folded before the hip, above
 * it for an axe, on the far side of the travel for a sweep across the target.
 * The front chamber's ankle lies `fold` from the hip; a sweep's is folded as
 * far toward its far side, so its knee is bent as much and the extension is the
 * knee's opening, not a straight leg swung from out of reach.
 * Parameter prepared: The strike's prepared values.
 * Returns: The chamber's ankle, world metres, before the hip's range bounds it.
 */
export function footStrikeChamber(
  prepared: footStrikeChamber.IPrepared,
): IAutoMovieVector3 {
  const {
    technique,
    hip,
    ankle,
    line,
    travel,
    reach,
  }: footStrikeChamber.IPrepared = prepared;
  const across: boolean = technique === "hook" || technique === "crescent";
  const fold: number =
    AutoMovieEngineVector3.length(
      AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.scale(FootStrikeForms.DOWN, 0.45),
        AutoMovieEngineVector3.scale(line, 0.25),
      ),
    ) * reach;
  return technique === "axe"
    ? AutoMovieEngineVector3.add(
        hip,
        AutoMovieEngineVector3.add(
          AutoMovieEngineVector3.scale(FootStrikeForms.UP, 0.6 * reach),
          AutoMovieEngineVector3.scale(line, 0.3 * reach),
        ),
      )
    : across
      ? AutoMovieEngineVector3.add(
          hip,
          AutoMovieEngineVector3.scale(
            AutoMovieEngineVector3.normalize(
              AutoMovieEngineVector3.subtract(
                AutoMovieEngineVector3.subtract(ankle, AutoMovieEngineVector3.scale(travel, 0.5 * reach)),
                hip,
              ),
            ),
            fold,
          ),
        )
      : AutoMovieEngineVector3.add(
          hip,
          AutoMovieEngineVector3.add(
            AutoMovieEngineVector3.scale(FootStrikeForms.DOWN, 0.45 * reach),
            AutoMovieEngineVector3.scale(line, 0.25 * reach),
          ),
        );
}

/*
 * Companion types of footStrikeChamber.
 */
export namespace footStrikeChamber {
  /*
   * What `footStrike.plan` prepared before its chamber.
   */
  export interface IPrepared {
    /*
     * The strike's technique.
     */
    technique: IAutoMovieMotionHumanFootStrike.IParams["technique"];

    /*
     * The kicking hip at the contact, world metres.
     */
    hip: IAutoMovieVector3;

    /*
     * The kicking ankle's goal at the contact, world metres.
     */
    ankle: IAutoMovieVector3;

    /*
     * The unit line toward the target, world.
     */
    line: IAutoMovieVector3;

    /*
     * The form's unit travel through the target, world.
     */
    travel: IAutoMovieVector3;

    /*
     * The leg's length, thigh and shank, metres.
     */
    reach: number;
  }
}
