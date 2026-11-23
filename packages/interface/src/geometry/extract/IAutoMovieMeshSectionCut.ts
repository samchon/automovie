import type { IAutoMovieMeshExtract } from "./IAutoMovieMeshExtract";
import type { IAutoMovieMeshSectionChain } from "./IAutoMovieMeshSectionChain";

/**
 * The section at one station.
 *
 * Section arrays transfer to the caller, but extrema may share point tuples and
 * outer boundaries may reuse loop points. Flags also include bridged gap
 * lengths and chains still unclosed after bridging; an empty cut has empty
 * arrays, null extremes and no flags.
 */
export interface IAutoMovieMeshSectionCut {
  /** The station along the frame axis, millimetres from the origin. */
  station: number;

  /** Intersection points found (zero when the plane misses the mesh). */
  count: number;

  /**
   * The cut's chained pieces, closed loops and open chains alike, each oriented
   * by the triangles' winding.
   */
  loops: IAutoMovieMeshSectionChain[];

  /**
   * The cut's outer boundaries, largest enclosed area first: the closed pieces
   * after open chains were joined end to end across gaps up to the bridge (each
   * bridged gap flagged), less every piece enclosed by another (eyes, teeth, a
   * mouth bag). Disjoint bodies (two legs) give one each; a reference with
   * holes and slits still gives its outer contour here.
   */
  outer: IAutoMovieMeshSectionChain[];

  /**
   * Extremes along `+a`, `-a`, `+b`, `-b` (a and b the two in-plane frame axes
   * after the station axis in cyclic order: for axis 1 they are axes 2 and 0),
   * and the quarter diagonals `(+a+b)`, `(+a-b)`, `(-a+b)`, `(-a-b)` over the
   * square root of two; null when the plane misses.
   */
  extremes: Record<
    "+a" | "-a" | "+b" | "-b" | "+a+b" | "+a-b" | "-a+b" | "-a-b",
    IAutoMovieMeshExtract.IExtreme
  > | null;

  /**
   * Why this sample cannot be trusted as it stands, empty when sound: "open"
   * when the cut leaves dangling crossings (a hole, a gap or a broken slice of
   * the mesh; the flag names the dangling crossings and broken chains), "jump
   * <direction>" when an extreme leaves the mean of its two neighbouring
   * stations' by more than the tolerance (a spike or saw tooth). A flagged
   * sample is to be checked in the viewer or excluded.
   */
  flags: string[];
}
