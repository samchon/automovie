import { AutoMovieHumanSeamPatch } from "../../lofting/AutoMovieHumanSeamPatch";
import type { IAutoMovieHumanSeam } from "../../lofting/IAutoMovieHumanSeam";
import type { IAutoMovieHumanWebBoundary } from "./IAutoMovieHumanWebBoundary";

/**
 * The four sides of a web's patch from the jets of their owners: the palm's
 * ring arc below, the two digits' root side lines at the right and left, and
 * the crest above, in the patch's chart `(u, v)` (bottom `v = 0`, right
 * `u = 1`, top `v = 1`, left `u = 0`).
 *
 * Each side is a ribbon (`AutoMovieHumanSeamPatch.side`): the owner's point,
 * its along derivatives and the cross derivative `alpha D1 + beta c'` the
 * patch leaves along, so the patch has the owner's position and tangent plane
 * (and, at G2, its normal curvature) on that side by construction. A web's
 * four owners are three pieces and a crest: the sides stay the owners', the
 * patch never invents its own, and a mismatch at a corner is reported by the
 * patch (`ICorner.gap`, `first`, `twist`), not faded.
 */
export namespace AutoMovieHumanWebSides {
  /** The four boundaries in the patch's order. */
  export interface IBoundaries {
    /** Bottom, `v = 0`: the palm's ring arc between the two roots. */
    bottom: IAutoMovieHumanWebBoundary;

    /** Right, `u = 1`: one digit's root side line. */
    right: IAutoMovieHumanWebBoundary;

    /** Top, `v = 1`: the crest. */
    top: IAutoMovieHumanWebBoundary;

    /** Left, `u = 0`: the other digit's root side line. */
    left: IAutoMovieHumanWebBoundary;
  }

  /** The patch's sides and the continuity each declares. */
  export interface ISides {
    /** Sides in the order bottom, right, top, left. */
    sides: [AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side, AutoMovieHumanSeamPatch.Side];

    /** Their declared continuities, same order. */
    continuity: [IAutoMovieHumanSeam.Continuity, IAutoMovieHumanSeam.Continuity, IAutoMovieHumanSeam.Continuity, IAutoMovieHumanSeam.Continuity];
  }

  /**
   * The sides of a web from its four owners' boundaries.
   *
   * @param boundaries The four owners' published boundaries.
   */
  export function of(boundaries: IBoundaries): ISides {
    const list: IAutoMovieHumanWebBoundary[] = [boundaries.bottom, boundaries.right, boundaries.top, boundaries.left];

    return {
      sides: list.map((b: IAutoMovieHumanWebBoundary): AutoMovieHumanSeamPatch.Side =>
        AutoMovieHumanSeamPatch.side(b.jet, b.from, b.to, b.alpha, b.beta),
      ) as ISides["sides"],
      continuity: list.map((b: IAutoMovieHumanWebBoundary): IAutoMovieHumanSeam.Continuity => b.continuity) as ISides["continuity"],
    };
  }
}
