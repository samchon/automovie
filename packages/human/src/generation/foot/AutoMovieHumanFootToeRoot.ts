import { AutoMovieHumanSeamUnion } from "../../lofting/AutoMovieHumanSeamUnion";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootToeBreadth } from "./AutoMovieHumanFootToeBreadth";

type Vec3 = G.Vec3;

/**
 * Where a toe's own sections start: from the toe's own anatomy alone, never
 * from the body's web ring. A toe is free of its neighbours past its clefts
 * (the places where it parts from them, `AutoMovieHumanFootPrior.clefts`), so
 * its first own section stands past the more distal of its clefts, measured
 * along its line, by the blend width of the toe's own size
 * (`AutoMovieHumanSeamUnion.width` of its half depth and half breadth there):
 * the web surface from the body's ring to this section is the blend, and it
 * adapts to the toe, the toe not to it. The section keeps at least
 * {@link OWN} mm of the toe before its cap.
 */
export namespace AutoMovieHumanFootToeRoot {
  /**
   * The first section's length along a toe's line, mm.
   *
   * @param breadth The toe's line and breadth.
   * @param clefts The toe's clefts, left frame.
   * @param depth The toe's half depth at a length along its line, mm.
   * @param cap The toe's cap length.
   */
  export function of(
    breadth: AutoMovieHumanFootToeBreadth.IBreadth,
    clefts: readonly Vec3[],
    depth: (s: number) => number,
    cap: number,
  ): number {
    const parting: number = Math.max(...clefts.map((c: Vec3): number => G.dot(G.sub(c, breadth.head), breadth.tangent)));
    const first: number = parting + AutoMovieHumanSeamUnion.width(depth(parting), breadth.half(parting));

    return Math.min(first, cap - OWN);
  }
}

/** Least length of a toe's own sections before its cap, mm: the tip's three rings and one shaft step. */
const OWN: number = 3;
