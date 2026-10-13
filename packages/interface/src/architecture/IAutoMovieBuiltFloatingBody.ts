import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";
import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * One body the whole-building support sweep found clear air under.
 *
 * The sweep needs no authored support claim, so it finds a floating element
 * nobody suspected, which a named-pair support query cannot because its author
 * has to name the body first. The finding is a measurement of what lies under
 * the body, not an inferred support relation: the body named in `below` is the
 * nearest thing underneath, whether or not it was meant to carry this one.
 *
 * @evidence contracts/common.md#principled-implementation The sweep judges axis-aligned world boxes: the subject's union box gives its underside, and `below` is the highest drawn part whose x-z footprint strictly overlaps that box with a top at or below the underside plus tolerance, so a sloped or stepped underside is judged at its lowest point.
 * @evidence contracts/common.md#clear-and-simple-design A floating finding is a locator, its basis, and one nullable nearest-body pair; the census counts and the cost live on `IAutoMovieBuiltSupportSweepReport`, so this record carries only what tells one finding from another.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis excludes `surface-height-rule` because the sweep's subjects are only elements and populations, and the clearance threshold is the caller's tolerance with no body kind or id treated differently.
 * @evidence contracts/common.md#meaningful-documentation States that the finding is a measurement rather than a support claim, what "under" means geometrically, that clearance is in metres and always above the tolerance, and that a null `below` means nothing measurable lies underneath.
 * @author Samchon
 */
export interface IAutoMovieBuiltFloatingBody {
  /**
   * The element or compact population whose underside is above the ground
   * height and within the tolerance of no other body's part.
   */
  body: AutoMovieBuiltPlacementBodyLocator;

  /**
   * How this body's own extent was measured. `element-origin-point` means the
   * finding is about the element's stated origin, not about a drawn underside.
   */
  basis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;

  /**
   * The nearest measurable body under this one and the clearance to it, or
   * `null` when nothing measurable lies under this body at all.
   *
   * "Under" means a drawn part of another body whose top is at or below this
   * body's underside plus the tolerance and whose x-z footprint overlaps this
   * body's world box with positive area; the highest such part wins, and the
   * named body is the one that part belongs to. A body that is only a stated
   * point, or a population, counts as its one box.
   */
  below: {
    /** The body owning the highest part under this one. */
    body: AutoMovieBuiltPlacementBodyLocator;

    /**
     * Vertical distance in metres from that part's top to this body's
     * underside; always greater than the tolerance, because a body within it
     * is counted as borne instead.
     */
    clearance: number;
  } | null;
}
