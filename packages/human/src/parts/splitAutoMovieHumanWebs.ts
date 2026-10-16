import { IAutoMovieSurfaceNetwork } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Lay out the end ring a part's digits leave and the webs between them: each web end split into two vertices, one for each digit beside it, and each web a narrow patch between two curves, one per digit.
 *
 * A single web curve shared by two digits ends on a vertex of the end ring that the ring, the curve and both digits' bridges meet at, valence six; a fork must shed four quarter-turns of a quad mesh's curvature for each digit beyond the first, and the reference bodies shed them as pairs of valence-five vertices. Splitting each web end into two vertices a web's breadth apart, the digit on one side taking one and the digit on the other the other, with a curve from each, leaves a patch one face wide between the curves whose four corners are valence five, so each web's two ends shed the same curvature at four vertices of valence five instead of two of valence six.
 *
 * The ring runs counterclockwise in turns of the sweep's `v`. Its nodes are the given turns at odd indices, the web ends among them, and the vertices at even indices are the middles of the pieces between; the middles are kept halfway between their neighbours once the web ends have split, and each split is held to a third of the turn to the nodes either side, so a narrow piece keeps its order.
 *
 * Each web runs from its first end (the palmar or plantar one) to its second (the dorsal one). Its `x` curve runs from the first end's lower vertex to the second end's upper one, the `y` curve from the second end's lower vertex to the first end's upper one, each through its own crotch point, so a digit whose loop meets the web's first end before its second takes `x`, and the other takes `y`.
 *
 * @param props.sweep Name of the sweep whose `u` 1 ring this is
 * @param props.turns Turns of the ring's vertices before splitting, increasing within one turn: nodes at odd indices, the pieces' middles at even ones
 * @param props.ends Indices into `turns` of the web ends
 * @param props.half Half the web's breadth in turns at the web end of index `j`, before the cap
 * @param props.webs Each web: its first and second end, the crotch points of its `x` and `y` curves in metres, and the curves' normal
 * @returns The ring and the webs' nodes, curves and patches
 */
export function splitAutoMovieHumanWebs(props: {
  sweep: string;
  turns: number[];
  ends: number[];
  half: (j: number) => number;
  webs: splitAutoMovieHumanWebs.IWeb[];
}): splitAutoMovieHumanWebs.IOutput {
  const { turns, ends } = props;
  const n: number = turns.length;
  const roots: number[] = [];
  const slot: Array<[number, number]> = [];
  turns.forEach((t: number, j: number): void => {
    if (!ends.includes(j)) {
      slot.push([roots.length, roots.length]);
      roots.push(t);
      return;
    }
    // never more than a third of the way to the nodes either side, where a piece is narrow in turn
    const before: number = j >= 2 ? turns[j - 2]! : turns[j - 2 + n]! - 1;
    const after: number = j + 2 < n ? turns[j + 2]! : turns[j + 2 - n]! + 1;
    const half: number = Math.min(
      props.half(j),
      (t - before) / 3,
      (after - t) / 3,
    );
    slot.push([roots.length, roots.length + 1]);
    roots.push(t - half, t + half);
  });
  const R: number = roots.length;
  const at = (i: number): number =>
    roots[((i % R) + R) % R]! + Math.floor(i / R);
  // a piece's middle stays halfway between the vertices beside it once its web ends have split
  slot.forEach(([a, b]: [number, number], j: number): void => {
    if (j % 2 === 0 && a === b)
      roots[a] = (at(a - 1) + at(a + 1)) / 2 - Math.floor(a / R);
  });
  for (let i: number = 1; i < R; ++i)
    if (!(roots[i]! > roots[i - 1]!) || !(roots[R - 1]! < roots[0]! + 1))
      throw new Error(
        `end ring out of order at ${i}: ${roots.map((c: number): string => c.toFixed(4)).join(" ")}`,
      );
  const lo = (j: number): number =>
    slot[((j % n) + n) % n]![0] + R * Math.floor(j / n);
  const hi = (j: number): number =>
    slot[((j % n) + n) % n]![1] + R * Math.floor(j / n);
  const fixed = (k: number): IAutoMovieSurfaceNetwork.ICounts => ({
    lowest: k,
    low: k,
    medium: k,
    high: k,
  });
  const path = (a: number, b: number): IAutoMovieSurfaceNetwork.IEdge[] =>
    Array.from(
      { length: b - a },
      (_: unknown, k: number): IAutoMovieSurfaceNetwork.IEdge => ({
        type: "sweep",
        sweep: props.sweep,
        from: { u: 1, v: at(a + k) },
        to: { u: 1, v: at(a + k + 1) },
        segments: fixed(1),
      }),
    );
  const wrap = (v: number): number => ((v % 1) + 1) % 1;
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const patches: IAutoMovieSurfaceNetwork.ICoonsPatch[] = [];
  props.webs.forEach((web: splitAutoMovieHumanWebs.IWeb, w: number): void => {
    const node = (key: string, i: number): string => {
      nodes[`web${w}.${key}`] = {
        type: "sweep",
        sweep: props.sweep,
        u: 1,
        v: wrap(at(i)),
      };
      return `web${w}.${key}`;
    };
    curves[`web${w}.x`] = {
      from: node("firstLower", lo(web.first)),
      to: node("secondUpper", hi(web.second)),
      through: [web.x],
      segments: fixed(2),
      normal: web.normal,
    };
    curves[`web${w}.y`] = {
      from: node("secondLower", lo(web.second)),
      to: node("firstUpper", hi(web.first)),
      through: [web.y],
      segments: fixed(2),
      normal: web.normal,
    };
    patches.push({
      type: "coons",
      name: `web${w}`,
      sides: [
        path(lo(web.second), hi(web.second))[0]!,
        { type: "curve", curve: `web${w}.x`, reverse: true },
        path(lo(web.first), hi(web.first))[0]!,
        { type: "curve", curve: `web${w}.y`, reverse: true },
      ],
    });
  });
  return {
    count: R,
    at,
    lo,
    hi,
    path,
    web: (w: number, side: "x" | "y"): IAutoMovieSurfaceNetwork.IEdge => ({
      type: "curve",
      curve: `web${w}.${side}`,
    }),
    nodes,
    curves,
    patches,
  };
}
/** Web and output types of {@link splitAutoMovieHumanWebs}. */
export namespace splitAutoMovieHumanWebs {
  /**
   * One web between two digits.
   *
   * @author Samchon
   */
  export interface IWeb {
    /** Index into the ring's turns of its first end, palmar or plantar. */
    first: number;

    /** Index of its second end, dorsal. */
    second: number;

    /** Crotch point of its `x` curve, metres. */
    x: IAutoMovieVector3;

    /** Crotch point of its `y` curve, metres. */
    y: IAutoMovieVector3;

    /** Normal of the surface the digits' bridges make along its curves, outward through the crotch. */
    normal: IAutoMovieVector3;
  }

  /**
   * The laid-out ring and webs.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Vertices round the ring after splitting. */
    count: number;

    /**
     * Turn of the ring's vertex.
     *
     * @param i Its index, counted on past the last into the next turn
     * @returns Its `v`, counted on likewise
     */
    at(i: number): number;

    /**
     * The ring's vertex of the given turn index, its lower side where a web end split it.
     *
     * @param j Index into the turns given, counted on past the last
     * @returns Index into the ring
     */
    lo(j: number): number;

    /**
     * The ring's vertex of the given turn index, its upper side where a web end split it.
     *
     * @param j Index into the turns given, counted on past the last
     * @returns Index into the ring
     */
    hi(j: number): number;

    /**
     * The ring's edges from one of its vertices to a later one, a segment each.
     *
     * @param a First ring index
     * @param b Last ring index, not before `a`
     * @returns The edges
     */
    path(a: number, b: number): IAutoMovieSurfaceNetwork.IEdge[];

    /**
     * One of a web's curves, forward.
     *
     * @param w The web
     * @param side Its `x` or `y` curve
     * @returns The edge
     */
    web(w: number, side: "x" | "y"): IAutoMovieSurfaceNetwork.IEdge;

    /** The webs' end nodes, by name. */
    nodes: Record<string, IAutoMovieSurfaceNetwork.INode>;

    /** The webs' curves, by name. */
    curves: Record<string, IAutoMovieSurfaceNetwork.ICurve>;

    /** Each web's patch between its curves. */
    patches: IAutoMovieSurfaceNetwork.ICoonsPatch[];
  }
}
