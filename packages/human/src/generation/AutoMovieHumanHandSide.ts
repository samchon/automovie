import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftSectionFrame,
} from "@automovie/interface";

import { AutoMovieHumanLimbFrame } from "./AutoMovieHumanLimbFrame";

/**
 * The right side as the left's reflection: a ring with its phase reversed, so
 * the right side's point at phase t is the mirror of the left's at -t, and a
 * frame with its `v` turned over.
 */
export namespace AutoMovieHumanHandSide {
  /** Read a world point's mirror on a side. */
  export function sided(
    p: Readonly<AutoMovieVector3Tuple>,
    sign: 1 | -1,
  ): AutoMovieVector3Tuple {
    return [p[0], p[1], sign * p[2]];
  }

  /** A side's frame from the left frame's. */
  export function sidedFrame(
    f: IAutoMovieLoftSectionFrame,
    sign: 1 | -1,
  ): IAutoMovieLoftSectionFrame {
    return sign === 1 ? f : AutoMovieHumanLimbFrame.mirror(f);
  }

  /**
   * A ring of one side from the left frame's: mirrored, its phase reversed so
   * the right side's point at phase t is the mirror of the left's at -t.
   */
  export function reflect(
    ring: readonly AutoMovieVector3Tuple[],
    sign: 1 | -1,
  ): AutoMovieVector3Tuple[] {
    if (sign === 1) return [...ring];
    const n: number = ring.length;
    return ring.map(
      (_: AutoMovieVector3Tuple, m: number): AutoMovieVector3Tuple =>
        sided(ring[(n - m) % n]!, -1),
    );
  }
}
