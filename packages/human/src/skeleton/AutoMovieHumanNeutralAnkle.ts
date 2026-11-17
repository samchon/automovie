import type {
  AutoMovieQuaternionTuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanNeutralBody,
} from "@automovie/interface";

import { AutoMovieHumanNeutralTurn as Turn } from "./AutoMovieHumanNeutralTurn";

/**
 * The ankle's neutral: the foot keeps the floor and points straight ahead.
 *
 * Neutral-0 stands with the feet parallel, each foot's long axis in a
 * sagittal plane (DGUV F 4030, `docs/sources/dguv-f4030-neutral-zero.md`), so
 * the foot's turn from the bind is the turn about the vertical that brings its
 * heading (the ankle-to-toes line seen from above) onto the forward axis. The
 * turn is about the vertical only, so the sole keeps its own tilt and the
 * straightened legs' change of ankle height is put back on the floor by the
 * composition. The toes ride the foot, which puts the metatarsophalangeal
 * joints at zero.
 */
export namespace AutoMovieHumanNeutralAnkle {
  /**
   * The foot's world turn from the bind.
   *
   * @param body The bind skeleton.
   * @param side Which foot.
   * @returns The turn about the vertical from the bind heading to straight ahead.
   */
  export function derive(
    body: IAutoMovieHumanNeutralBody,
    side: "left" | "right",
  ): AutoMovieQuaternionTuple {
    const d: AutoMovieVector3Tuple = body.direction(`${side}Foot`);
    const heading: AutoMovieVector3Tuple = [d[0], 0, d[2]];
    if (!(Math.hypot(heading[0], heading[2]) > 1e-9)) return [0, 0, 0, 1];
    return Turn.arc(heading, Turn.FORWARD);
  }
}
