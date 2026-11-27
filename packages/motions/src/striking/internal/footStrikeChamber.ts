import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFootStrike,
  IAutoMovieVector3,
} from "@automovie/interface";

import { FootStrikeForms } from "./FootStrikeForms";

/**
 * A foot strike's authored chamber ankle: the knee folded before the hip, above
 * it for an axe, on the far side of the travel for a sweep across the target.
 * The front chamber's ankle lies `fold` from the hip; a sweep's is folded as
 * far toward its far side, so its knee is bent as much and the extension is the
 * knee's opening, not a straight leg swung from out of reach.
 *
 * @param prepared The strike's prepared values.
 * @returns The chamber's ankle, world metres, before the hip's range bounds it.
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
    Vector3.length(
      Vector3.add(
        Vector3.scale(FootStrikeForms.DOWN, 0.45),
        Vector3.scale(line, 0.25),
      ),
    ) * reach;
  return technique === "axe"
    ? Vector3.add(
        hip,
        Vector3.add(
          Vector3.scale(FootStrikeForms.UP, 0.6 * reach),
          Vector3.scale(line, 0.3 * reach),
        ),
      )
    : across
      ? Vector3.add(
          hip,
          Vector3.scale(
            Vector3.normalize(
              Vector3.subtract(
                Vector3.subtract(ankle, Vector3.scale(travel, 0.5 * reach)),
                hip,
              ),
            ),
            fold,
          ),
        )
      : Vector3.add(
          hip,
          Vector3.add(
            Vector3.scale(FootStrikeForms.DOWN, 0.45 * reach),
            Vector3.scale(line, 0.25 * reach),
          ),
        );
}

/** Companion types of {@link footStrikeChamber}. */
export namespace footStrikeChamber {
  /** What `footStrike.plan` prepared before its chamber. */
  export interface IPrepared {
    /** The strike's technique. */
    technique: IAutoMovieMotionHumanFootStrike.IParams["technique"];

    /** The kicking hip at the contact, world metres. */
    hip: IAutoMovieVector3;

    /** The kicking ankle's goal at the contact, world metres. */
    ankle: IAutoMovieVector3;

    /** The unit line toward the target, world. */
    line: IAutoMovieVector3;

    /** The form's unit travel through the target, world. */
    travel: IAutoMovieVector3;

    /** The leg's length, thigh and shank, metres. */
    reach: number;
  }
}
