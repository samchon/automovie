import { AutoMovieHumanWebColumns } from "./web/AutoMovieHumanWebColumns";
import { AutoMovieHumanWebCrest } from "./web/AutoMovieHumanWebCrest";
import { AutoMovieHumanWebMesh } from "./web/AutoMovieHumanWebMesh";
import { AutoMovieHumanWebSurface } from "./web/AutoMovieHumanWebSurface";
import type { IAutoMovieHumanWebColumns } from "./web/IAutoMovieHumanWebColumns";
import type { IAutoMovieHumanWebCrests } from "./web/IAutoMovieHumanWebCrests";
import type { IAutoMovieHumanWebInput } from "./web/IAutoMovieHumanWebInput";
import type { IAutoMovieHumanWebResult } from "./web/IAutoMovieHumanWebResult";
import type { IAutoMovieHumanWebSurface } from "./web/IAutoMovieHumanWebSurface";

/**
 * The skin between a parent's ring and children that start apart from it: the
 * webs of a hand.
 *
 * A child that inherits its parent's arcs keeps their corners in its own
 * sections for as long as it takes to round them, and two children that part at
 * a pair of pinches meet across a chord that leaves the parent's surface at a
 * right angle. Here each child starts from its own section past its webs, round
 * from its first ring, and the skin from the parent's ring to those sections is
 * built here as one surface with a saddle at every web.
 *
 * The surface is meshed in rows and columns. A row is a level of depth on the
 * way from the parent's ring (row 0) to the children's sections (the last row);
 * a column runs down that way from one vertex of the parent's ring to its
 * child's section, the steepest line of the rows. Each child owns the columns
 * of its arcs, and they arrive on its section in proportion to their length
 * along the arc. At a web the two pinches' columns are the web's margin: a
 * quarter round from each pinch, leaving it along the parent's own surface, to
 * the web's crest S, which stands half the pinches' chord past their middle, so
 * the margin is round across the hand. Above the crest's row the two children
 * are one sheet, the parent continued, and the pinches' columns are its lips;
 * from S each child's own column runs down to the point of its section that is
 * level with the crest across the margin, leaving S across the web. Those four
 * separatrices cross at S, eight cells meet there, and the skin about S is the
 * saddle `x^2 - y^2`.
 *
 * Near a web a column's level and its distance along the ring from the pinch
 * are the chart `z = x + i y` of the saddle at S: x the level from the crest's
 * row in margin radii, y the distance over the margin's radius. The branch
 * point is `w = u + i v = sqrt(z)`. A column there is the translational surface
 * of the web's separatrices, `F(u, v) = D(u) + lip(v) - S`, which near S is the
 * saddle `S + alpha u E_eta + beta v E_xi + rho (u^2 - v^2) E_a` and on the
 * chart's axes the separatrices themselves, so the columns about a pinch stay
 * ordered however close they run; its ends are moved onto its own ring vertex
 * and arrival in proportion to the level. Away from the web a column is the
 * Hermite from the parent's surface to the child's, leaving the ring along the
 * parent's station derivative and arriving along the child's, and the two blend
 * over {@link FADE} margin radii.
 *
 * The mesh is even in w, not z, about every crest: the rows' levels close on
 * the crest as the square of the row, and the parent's ring takes phases about
 * each pinch at distances growing as the square of their count
 * (`AutoMovieHumanBodySurface`), so the cells about S are as small as the
 * margin's radius needs. Even in z they stretched there by the square root, to
 * edges of 4 mm across a 2.5 mm saddle.
 */
export namespace AutoMovieHumanBodyWeb {
  /** One child's share of the parent's ring. */
  export type IShare = IAutoMovieHumanWebInput.IShare;

  /** What a web needs from the surface being built. */
  export type IInput = IAutoMovieHumanWebInput;

  /** A built web. */
  export type IResult = IAutoMovieHumanWebResult;

  /**
   * Build the skin from the parent's ring to its children's sections: the
   * webs the ring parts at, every child's columns, the surface's laws, then
   * the mesh.
   */
  export function build(input: IInput): IResult {
    const crests: IAutoMovieHumanWebCrests = AutoMovieHumanWebCrest.of(input);
    const columns: IAutoMovieHumanWebColumns = AutoMovieHumanWebColumns.of(input, crests);
    const surface: IAutoMovieHumanWebSurface = AutoMovieHumanWebSurface.of(columns.rows, columns.crestRow);

    return AutoMovieHumanWebMesh.of(input, crests, columns, surface);
  }
}
