import { IAutoMovieSurfaceNetwork } from "@automovie/engine";

/**
 * Lay a grid of quads on a sweep's domain whose columns move round the sweep from row to row, each quad a Coons patch of one face whose four corners are points of the sweep.
 *
 * A sweep patch is a rectangle of the domain, so its columns hold one `v` along the whole sweep. Where a part's columns must start evenly spaced, as a transition band leaves them, and end on anatomical nodes, such as the webs between the digits, the columns shear between the two over the rows; every vertex is still a sample of the sweep, which the limit fit passes through, so the surface stays the sweep's and only the quads' layout changes. Neighbouring quads name the same corners, so they weld.
 *
 * @param props.sweep Name of the sweep
 * @param props.name Prefix of the patches' names
 * @param props.rows `u` of each row's boundary, increasing, the first and last the grid's ends
 * @param props.columns Columns round the sweep
 * @param props.v `v` of column boundary `i` on boundary row `r`, increasing in `i` and spanning one turn from `i` 0 to `columns`
 * @param props.skip Cells left open, by row and column, such as an opening a branch leaves; omitted, none
 * @returns The patches and each one's corners in the domain, counterclockwise from its lower left
 */
export function gridAutoMovieHumanSweep(props: {
  sweep: string;
  name: string;
  rows: number[];
  columns: number;
  v: (r: number, i: number) => number;
  skip?: (r: number, i: number) => boolean;
}): gridAutoMovieHumanSweep.IOutput {
  const patches: IAutoMovieSurfaceNetwork.ICoonsPatch[] = [];
  const corners: IAutoMovieSurfaceNetwork.IDomainPoint[][] = [];
  const at = (r: number, i: number): IAutoMovieSurfaceNetwork.IDomainPoint => ({
    u: props.rows[r]!,
    v: props.v(r, i),
  });
  for (let r: number = 0; r + 1 < props.rows.length; ++r)
    for (let i: number = 0; i < props.columns; ++i) {
      if (props.skip?.(r, i) === true) continue;
      const q: IAutoMovieSurfaceNetwork.IDomainPoint[] = [
        at(r, i),
        at(r, i + 1),
        at(r + 1, i + 1),
        at(r + 1, i),
      ];
      patches.push({
        type: "coons",
        name: `${props.name}.${r}.${i}`,
        sides: [0, 1, 2, 3].map(
          (k: number): IAutoMovieSurfaceNetwork.ISweepEdge => ({
            type: "sweep",
            sweep: props.sweep,
            from: q[k]!,
            to: q[(k + 1) % 4]!,
            segments: ONE,
          }),
        ) as [
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
          IAutoMovieSurfaceNetwork.IEdge,
        ],
      });
      corners.push(q);
    }
  return { patches, corners };
}
/** Output type of {@link gridAutoMovieHumanSweep}. */
export namespace gridAutoMovieHumanSweep {
  /**
   * The laid-out grid.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** The quads, row by row from the first row. */
    patches: IAutoMovieSurfaceNetwork.ICoonsPatch[];

    /** Each quad's corners in the sweep's domain, aligned with `patches`. */
    corners: IAutoMovieSurfaceNetwork.IDomainPoint[][];
  }

  /**
   * The domain point of a quad's patch coordinates, by bilinear interpolation of its corners.
   *
   * @param q The quad's corners, counterclockwise from its lower left
   * @param s Along its bottom and top
   * @param t From its bottom to its top
   * @returns The domain point
   */
  export function locate(
    q: IAutoMovieSurfaceNetwork.IDomainPoint[],
    s: number,
    t: number,
  ): IAutoMovieSurfaceNetwork.IDomainPoint {
    const bottom = {
      u: q[0]!.u + (q[1]!.u - q[0]!.u) * s,
      v: q[0]!.v + (q[1]!.v - q[0]!.v) * s,
    };
    const top = {
      u: q[3]!.u + (q[2]!.u - q[3]!.u) * s,
      v: q[3]!.v + (q[2]!.v - q[3]!.v) * s,
    };
    return {
      u: bottom.u + (top.u - bottom.u) * t,
      v: bottom.v + (top.v - bottom.v) * t,
    };
  }
}

/** One segment at every tier. */
const ONE: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 1,
  low: 1,
  medium: 1,
  high: 1,
};
