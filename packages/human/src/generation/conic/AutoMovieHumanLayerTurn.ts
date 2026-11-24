import { AutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieViewLoft } from "@automovie/interface";

/**
 * Layers added where a lofted skin turns along its course faster than flat shading hides.
 *
 * A layer rule in millimetres bounds a band's length on the skin, not its turn: where the skin turns along the course on a radius of a
 * few centimetres, each band is a flat facet turned several degrees from its neighbour and the shading draws every ring (the heel's
 * terraces on the outer side of the ankle's turn, the fold under the breast, the lips). Each interval is halved until, at every one of
 * `phases` phases, the skin's chord over the interval's first half and its chord over the second meet at no more than `turn` degrees: the
 * angle between neighbouring chords, the angular deflection a mesher bounds besides its linear deflection (Open CASCADE Technology,
 * Mesh user's guide, https://occt3d.com/dev/doc/overview/html/occt_user_guides__mesh.html: the angle between the normals at a
 * segment's ends). The caller's bound, 4 degrees, is an ESTIMATE: the turn below which neighbouring flat-shaded bands no longer read as
 * separate facets in the clay frames. No interval is halved below `2 least` mm.
 */
export namespace AutoMovieHumanLayerTurn {
  /**
   * The stations with every interval halved until the band's turn is within the bound.
   *
   * @param chain The lofted skin's chain, read at any station between the given ones.
   * @param stations The stations, increasing, mm.
   * @param bound `turn` the largest angle between an interval's two half chords, degrees; `phases` the phases read; `least` the
   *   shortest interval halved, half of it, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The angle between two consecutive chords of the skin along the station at each phase, the chord-angle tolerance of curve tessellation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One recursive halving per interval.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The given stations are kept exactly; only midpoints are inserted.
   * @evidence contracts/development/implementation.md#efficient-algorithms One ring of `phases` points per station read, each midpoint read once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each ring read serves both intervals it bounds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array; the rings die with the call.
   * @evidence contracts/development/common.md#meaningful-documentation States the tolerance, its source and the floor.
   */
  export function refine(
    chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]>,
    stations: readonly number[],
    bound: { turn: number; phases: number; least: number },
  ): number[] {
    const phases: number[] = Array.from(
      { length: bound.phases }, (_: unknown, j: number): number => (2 * Math.PI * j) / bound.phases,
    );
    const ring = (s: number): number[][] => AutoMovieLoftChain.ring(chain, s, phases);
    const turned = (low: readonly number[], mid: readonly number[], high: readonly number[]): number => {
      const u: number[] = [0, 1, 2].map((k: number): number => mid[k]! - low[k]!);
      const w: number[] = [0, 1, 2].map((k: number): number => high[k]! - mid[k]!);
      const cosine: number = (u[0]! * w[0]! + u[1]! * w[1]! + u[2]! * w[2]!) / (Math.hypot(u[0]!, u[1]!, u[2]!) * Math.hypot(w[0]!, w[1]!, w[2]!));
      return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
    };
    const bend = (a: number, low: number[][], b: number, high: number[][]): number[] => {
      if (b - a <= 2 * bound.least) return [];
      const middle: number = (a + b) / 2;
      const mid: number[][] = ring(middle);
      const off: boolean = mid.some((p: number[], j: number): boolean => turned(low[j]!, p, high[j]!) > bound.turn);
      return off ? [...bend(a, low, middle, mid), middle, ...bend(middle, mid, b, high)] : [];
    };
    const rings: number[][][] = stations.map(ring);
    return stations.flatMap((s: number, i: number): number[] =>
      i === 0 ? [s] : [...bend(stations[i - 1]!, rings[i - 1]!, s, rings[i]!), s]);
  }
}
