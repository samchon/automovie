import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/** One cloth panel drawn from a soft-body domain.
 *
 * @evidence contracts/development/design.md#principled-representation A soft-body domain's lattice fixes drawn panel vertices and quads independently of its deformation; semantic owner/material references join that geometry with the same mask subject.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record separates panel domain facts from the solver and viewer, so inventory can count geometry without simulating positions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null owner means unowned and null material means renderer default; no hidden room or measured triangle count is invented.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify the borrowed lattice domain, semantic owner and material-default policy used by the render subject.
 */
export interface IAutoMovieRenderSoftPanel {
  /** The domain whose lattice is drawn as one panel. */
  domain: IAutoMovieSoftBodyDomain;

  /** Semantic id of the owning building space, or `null` when unowned. */
  owner: string | null;

  /** Material id the panel is drawn with, or `null` for the default. */
  material: string | null;
}
