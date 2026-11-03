import { AutoMovieHumanMonotoneCubic } from "../../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanDigitSpan } from "../hand/AutoMovieHumanDigitSpan";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";

/**
 * A toe's taper along its line: the digit span law
 * ({@link AutoMovieHumanDigitSpan}, the observed shares of a digit's half
 * width, palmar and dorsal depths at its web, middle joint, distal joint and
 * cap) laid on the toe's own joints, as shares of the toe's section at its
 * web.
 *
 * A toe is a digit on the finger's plan: its proximal phalanx starts at the
 * metatarsal head (the line's start), its web stands halfway along that
 * phalanx (Gray 1918, the web reaching the middle of the proximal phalanx),
 * its joints at the prior's shares of the line, and its cap about one shaft
 * half breadth short of the apex, where the round tip starts. The hallux has
 * one interphalangeal joint, which takes the distal joint's knot. Behind the
 * web the shares hold the web's, so the root's flare and the web surface
 * keep the toe's root. The shares give the shaft its taper toward the tip
 * and the nail side its flattening (the dorsal share falls faster than the
 * plantar one), the same law on every person.
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
  export function at(index: number, length: number, shaft: number, s: number): [number, number, number] {
    const joints: readonly number[] = AutoMovieHumanFootPrior.PRIOR.toes[index]!.joints;
    const knots: readonly AutoMovieHumanDigitSpan.IKnot[] = AutoMovieHumanDigitSpan.KNOTS;
    const first: AutoMovieHumanDigitSpan.IKnot = knots[0]!;
    const cap: number = Math.max(0, length - shaft);

    // Stations along the line with their knots: the web halfway along the
    // proximal phalanx, then the joints, then the cap.
    const stations: [number, AutoMovieHumanDigitSpan.IKnot][] =
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
    const kept: [number, AutoMovieHumanDigitSpan.IKnot][] = stations.filter(
      (q: [number, AutoMovieHumanDigitSpan.IKnot], i: number): boolean => i === 0 || q[0] > stations[i - 1]![0] + MIN_GAP,
    );
    const share = (key: keyof AutoMovieHumanDigitSpan.IKnot): number =>
      kept.length < 2
        ? 1
        : AutoMovieHumanMonotoneCubic.interpolate(
            kept.map((q: [number, AutoMovieHumanDigitSpan.IKnot]): [number, number] => [q[0], q[1][key] / first[key]]),
            Math.min(kept[kept.length - 1]![0], Math.max(kept[0]![0], s)),
          );

    return [share("width"), share("palmar"), share("dorsal")];
  }
}

/** Least spacing of two taper stations along the line, mm. */
const MIN_GAP: number = 0.5;
