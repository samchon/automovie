import type { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";
import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanLimbFrame } from "../AutoMovieHumanLimbFrame";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * The right side as the left's reflection: a ring with its phase reversed, so
 * the right side's point at phase t is the mirror of the left's at -t, and a
 * frame with its `v` turned over.
 */
export namespace AutoMovieHumanHandSide {
  /** Read a world point's mirror on a side. */
  export function sided(p: readonly [number, number, number], sign: 1 | -1): Vec3 {
    return [p[0], p[1], sign * p[2]];
  }

  /** A side's frame from the left frame's. */
  export function sidedFrame(
    f: AutoMovieHumanLoftFrame.IFrame,
    sign: 1 | -1,
  ): AutoMovieHumanLoftFrame.IFrame {
    return sign === 1 ? f : AutoMovieHumanLimbFrame.mirror(f);
  }

  /**
   * A ring of one side from the left frame's: mirrored, its phase reversed so
   * the right side's point at phase t is the mirror of the left's at -t.
   */
  export function reflect(ring: readonly Vec3[], sign: 1 | -1): Vec3[] {
    if (sign === 1) return [...ring];
    const n: number = ring.length;
    return ring.map((_: Vec3, m: number): Vec3 => sided(ring[(n - m) % n]!, -1));
  }
}
