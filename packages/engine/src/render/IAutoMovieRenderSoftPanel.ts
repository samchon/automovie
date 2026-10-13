import { IAutoMovieSoftBodyDomain } from "@automovie/interface";

/** One cloth panel drawn from a soft-body domain.
 *
 * @evidence contracts/common.md#principled-implementation A soft-body domain's lattice fixes drawn panel vertices and quads independently of its deformation; semantic owner/material references join that geometry with the same mask subject.
 * @evidence contracts/common.md#clear-and-simple-design The record separates panel domain facts from the solver and viewer, so inventory can count geometry without simulating positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null owner means unowned and null material means renderer default; no hidden room or measured triangle count is invented.
 * @evidence contracts/common.md#meaningful-documentation Members identify the borrowed lattice domain, semantic owner and material-default policy used by the render subject.
 * @evidence contracts/performance.md#efficient-algorithms The record is fixed-size references; panel count arithmetic uses grid dimensions rather than O(particles) solver work.
 * @evidence contracts/performance.md#reuse-equivalent-work The same domain row feeds mask and inventory; changing lattice dimensions requires remeasurement, while position deformation preserves topology counts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The holder owns domain lifetime; this type creates no particle history, geometry buffer or simulation task.
 */
export interface IAutoMovieRenderSoftPanel {
  /** The domain whose lattice is drawn as one panel. */
  domain: IAutoMovieSoftBodyDomain;

  /** Semantic id of the owning building space, or `null` when unowned. */
  owner: string | null;

  /** Material id the panel is drawn with, or `null` for the default. */
  material: string | null;
}
