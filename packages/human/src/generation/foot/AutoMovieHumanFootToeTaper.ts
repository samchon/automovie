import type {
  IAutoMovieHumanDigitSpan,
  IAutoMovieHumanFootToeTaper,
} from "@automovie/interface";

import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanDigitSpan } from "../hand/AutoMovieHumanDigitSpan";

/**
 * The toe's taper places the shared quarter-ellipsoid ordinates from
 * {@link AutoMovieHumanDigitSpan} at the toe's own web, joints and cap.
 * Half-width and both signed depth magnitudes use the same relative change from
 * the toe's section at its web.
 *
 * A toe is a digit on the finger's plan: its proximal phalanx starts at the
 * metatarsal head (the line's start), its web stands halfway along that phalanx
 * (Gray 1918, the web reaching the middle of the proximal phalanx), its joints
 * at the prior's shares of the line, and its cap about one shaft half breadth
 * short of the apex, where the round tip starts. The hallux has one
 * interphalangeal joint, which takes the distal joint's knot. Behind the web
 * the shares hold the web's, so the root's flare and the web surface keep the
 * toe's root. The common taper shrinks the section toward the tip.
 */
export namespace AutoMovieHumanFootToeTaper {
  /**
   * The taper's shares at a length along the line: half width, plantar and
   * dorsal depth, each over its value at the web.
   *
   * @param index Which toe, 0 for the hallux.
   * @param length The line's length, head to apex, mm.
   * @param shaft The toe's shaft half breadth, mm.
   * @param s Length along the line from the metatarsal head, mm.
   */
  export function at(
    index: number,
    length: number,
    shaft: number,
    s: number,
  ): IAutoMovieHumanFootToeTaper.AtResult {
    const joints: readonly number[] =
      AutoMovieHumanFootPrior.PRIOR.toes[index]!.joints;
    const knots: readonly IAutoMovieHumanDigitSpan.IKnot[] =
      AutoMovieHumanDigitSpan.KNOTS;
    const first: IAutoMovieHumanDigitSpan.IKnot = knots[0]!;
    const cap: number = Math.max(0, length - shaft);

    // Stations along the line with their knots: the web halfway along the
    // proximal phalanx, then the joints, then the cap.
    const stations: [number, IAutoMovieHumanDigitSpan.IKnot][] =
      joints.length === 1
        ? [
            [0.5 * joints[0]! * length, first],
            [joints[0]! * length, knots[2]!],
            [cap, knots[3]!],
          ]
        : [
            [0.5 * joints[0]! * length, first],
            [joints[0]! * length, knots[1]!],
            [joints[1]! * length, knots[2]!],
            [cap, knots[3]!],
          ];

    // Keep the stations increasing: a station at or behind the one before
    // adds nothing.
    const kept: [number, IAutoMovieHumanDigitSpan.IKnot][] = stations.filter(
      (q: [number, IAutoMovieHumanDigitSpan.IKnot], i: number): boolean =>
        i === 0 || q[0] > stations[i - 1]![0] + MIN_GAP,
    );
    const share = (key: keyof IAutoMovieHumanDigitSpan.IKnot): number =>
      kept.length < 2
        ? 1
        : AutoMovieHumanMonotoneCubic.interpolate(
            kept.map(
              (
                q: [number, IAutoMovieHumanDigitSpan.IKnot],
              ): [number, number] => [q[0], q[1][key] / first[key]],
            ),
            Math.min(kept[kept.length - 1]![0], Math.max(kept[0]![0], s)),
          );

    return [share("width"), share("palmar"), share("dorsal")];
  }
}

/** Least spacing of two taper stations along the line, mm. */
const MIN_GAP: number = 0.5;
