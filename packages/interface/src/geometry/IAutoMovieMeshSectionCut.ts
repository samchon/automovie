import type { IAutoMovieMeshExtract } from "./IAutoMovieMeshExtract";
import type { IAutoMovieMeshSectionChain } from "./IAutoMovieMeshSectionChain";

/**
 * The section returned for one requested station, with raw chains, enclosing
 * loops, support points and quality findings. Extrema may share crossing tuples
 * and the envelope may reuse raw loop points.
 */
export interface IAutoMovieMeshSectionCut {
  /**
   * The supplied distance in millimetres along the selected frame axis, echoed
   * in caller order.
   */
  station: number;

  /**
   * Number of distinct crossed mesh edges, keyed by original endpoint ordinals.
   * Coincident crossings on different edges can count separately.
   */
  count: number;

  /**
   * Raw oriented closed loops and open chains before envelope bridging. The raw
   * chain order follows crossed triangle winding.
   */
  loops: IAutoMovieMeshSectionChain[];

  /**
   * Closed enclosing pieces after bridge admission, in decreasing enclosed
   * area. Nested pieces are excluded, while disjoint envelopes remain
   * separate.
   *
   * Envelope construction first looks for compatible tail-to-head joins, then
   * allows one chain reversal. It takes the nearest join admitted by the bridge
   * width at each step.
   */
  outer: IAutoMovieMeshSectionChain[];

  /**
   * Open crossings, inserted bridges longer than 1e-9 mm, remaining unclosed
   * chains and sampled reach jumps. Reach jumps compare each interior station
   * with the arithmetic mean of its previous and next returned reaches.
   *
   * The directions are `+a`, `-a`, `+b`, `-b` and their four normalized
   * diagonals. For station axis 1, `a` and `b` are frame axes 2 and 0.
   */
  extremes: Record<
    "+a" | "-a" | "+b" | "-b" | "+a+b" | "+a-b" | "-a+b" | "-a-b",
    IAutoMovieMeshExtract.IExtreme
  > | null;

  /**
   * Open crossings, inserted bridges, remaining unclosed chains and sampled
   * reach jumps. Reach jumps compare each interior station with the arithmetic
   * mean of its previous and next returned reaches.
   */
  flags: string[];
}
