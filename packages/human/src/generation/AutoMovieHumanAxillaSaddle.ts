import { AutoMovieHumanSeamPatch } from "../lofting/AutoMovieHumanSeamPatch";
import type { IAutoMovieHumanSeam } from "../lofting/IAutoMovieHumanSeam";

/**
 * The axilla's saddle: the skin of the vault where the trunk, the shoulders
 * and the arm meet between the anterior and the posterior axillary fold, a
 * junction of more than two pieces closed by a transfinite patch over the
 * boundary ribbons their owners publish (construction.md, Form), as a web is
 * between two fingers.
 *
 * The patch's four sides, in the order of `AutoMovieHumanSeamPatch`: the
 * trunk's torso side (bottom), the arm's root edge (right), the shoulders'
 * girdle side (top) and the opposite fold (left). Each owner publishes the
 * 2-jet of its surface along the seam by arclength, and a side takes it
 * leaving into the patch with a positive cross share; the patch then meets
 * every neighbour with the continuity its ribbon carries.
 */
export namespace AutoMovieHumanAxillaSaddle {
  /** One side's owner. */
  export interface IOwner {
    /** The owner's 2-jet along its seam at a parameter in `[from, to]`, across pointing away from the owner. */
    jet: (a: number) => IAutoMovieHumanSeam.ISurfaceJet;

    /** Parameter at the side's start. */
    from: number;

    /** Parameter at the side's end. */
    to: number;

    /** Share of the owner's cross derivative the patch leaves with; positive. */
    alpha: number;

    /** Share of the seam's own tangent the patch leans along it. */
    beta: number;
  }

  /** The four owners in the patch's side order: bottom, right, top, left. */
  export type Owners = [IOwner, IOwner, IOwner, IOwner];

  /** The declared continuity of each side. */
  export type Continuity = [
    IAutoMovieHumanSeam.Continuity,
    IAutoMovieHumanSeam.Continuity,
    IAutoMovieHumanSeam.Continuity,
    IAutoMovieHumanSeam.Continuity,
  ];

  /**
   * The saddle's patch.
   *
   * @param owners The four owners of the vault's boundary.
   * @param continuity The continuity each side declares, G1 or G2.
   * @returns The patch, ready to evaluate.
   */
  export function create(owners: Owners, continuity: Continuity): AutoMovieHumanSeamPatch.IPatch {
    const sides: AutoMovieHumanSeamPatch.Side[] = owners.map(
      (o: IOwner): AutoMovieHumanSeamPatch.Side =>
        AutoMovieHumanSeamPatch.side(o.jet, o.from, o.to, o.alpha, o.beta),
    );

    return AutoMovieHumanSeamPatch.create(
      "axilla",
      sides as [AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side],
      continuity,
    );
  }

  /**
   * The saddle sampled on a grid of the chart, rows along `v` and columns
   * along `u`, for drawing and for the seam observer.
   *
   * @param patch The patch.
   * @param rows Samples along `v`, at least 2.
   * @param columns Samples along `u`, at least 2.
   * @returns Body points `[x, y, z]`, mm, `points[row][column]`.
   */
  export function grid(patch: AutoMovieHumanSeamPatch.IPatch, rows: number, columns: number): [number, number, number][][] {
    return Array.from({ length: rows }, (_: unknown, i: number): [number, number, number][] =>
      Array.from({ length: columns }, (__: unknown, j: number): [number, number, number] => {
        const p: number[] = AutoMovieHumanSeamPatch.evaluate(patch, j / (columns - 1), i / (rows - 1)).p;

        return [p[0]!, p[1]!, p[2]!];
      }),
    );
  }
}
