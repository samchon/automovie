import type { IAutoMovieAffordance } from "../../model/IAutoMovieAffordance";
import type { IAutoMovieTransform } from "../IAutoMovieTransform";

/**
 * Data and callback contracts shared by the AffordanceSupportContacts
 * operations.
 */
export namespace IAutoMovieAffordanceSupportContacts {
  /**
   * The world-space support contacts of a `"stack-top"` affordance: its extent
   * corners carried through the affordance frame and the parent's world
   * transform, in exactly the shape {@link detectSupportToppling} and
   * {@link supportContactsFor} consume.
   *
   * A placed crate is stable when its center of mass projects inside these
   * contacts' hull and topples when it overhangs. The object supplies its own
   * authored support face for the same judgment as a floor or table surface.
   *
   * Each extent corner is a point in the affordance frame's XZ plane (`y`
   * ignored, per {@link IAutoMovieAffordance.extent}): it is lifted into the
   * model frame through the affordance `frame`, then into world through
   * `parentWorld` Scale in either transform is ignored by this helper. Non-unit
   * scales therefore do not describe the same contacts as full affine
   * placement.
   *
   * Throws on a non-`stack-top` kind or a missing extent: feeding a handle to
   * the support judgment is a mis-wired pipeline, not a skippable frame
   * ({@link validateModel} rejects such data before it gets here).
   */
  export type IProps = {
    /** The declared contact face. Must be a `"stack-top"` with an extent. */
    affordance: IAutoMovieAffordance;

    /** The owning model's root in world space. */
    parentWorld: IAutoMovieTransform;
  };
}
