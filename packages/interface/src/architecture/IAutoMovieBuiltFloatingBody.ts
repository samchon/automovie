import type { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";
import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";

/**
 * One body classified floating by the whole-building proxy support sweep.
 *
 * The sweep needs no authored support claim, so it finds a floating element
 * nobody suspected, which a named-pair support query cannot because its author
 * has to name the body first. The finding is a measurement of what lies under
 * the body, not an inferred support relation: the body named in `below` is the
 * nearest thing underneath, whether or not it was meant to carry this one.
 */
export interface IAutoMovieBuiltFloatingBody {
  /**
   * The element or compact population whose underside is above the ground
   * height and within the tolerance of no other body's part.
   */
  body: IAutoMovieBuiltPlacementBodyLocator;

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
    body: IAutoMovieBuiltPlacementBodyLocator;

    /**
     * Vertical distance in metres from that part's top to this body's
     * underside; always greater than the tolerance, because a body within it is
     * counted as borne instead.
     */
    clearance: number;
  } | null;
}
