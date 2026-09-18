import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";
import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";

/**
 * One body the whole-building sweep found nothing under.
 *
 * The requirement asks for two different capabilities in one sentence: express
 * what supports what, and be able to FIND the floating or disconnected elements.
 * A named-pair query answers the first and cannot answer the second, because a
 * body you have to name is a body you already suspect. This is the second half,
 * and it makes no claim about a support relation: it reports what the record
 * measures under a body, which is a measurement rather than an inferred bearing.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Finds a floating or disconnected placed body without a project-authored relation naming it first.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Carries the signed clearance to the nearest measurable body below and the basis both extents were taken from.
 * @author Samchon
 */
export interface IAutoMovieBuiltFloatingBody {
  /** The element or compact population nothing supports at its underside. */
  body: AutoMovieBuiltPlacementBodyLocator;
  /** The derivation this body's own extent came from. */
  basis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;
  /**
   * The highest measurable body under this one and the clearance to it in
   * metres, or `null` when the sweep found nothing under this body at all. A
   * clearance is always greater than the tolerance, since a body within it is
   * reported as supported instead.
   */
  below: {
    /** The nearest measurable body below. */
    body: AutoMovieBuiltPlacementBodyLocator;
    /** Positive vertical clearance from that body's top to this one's underside. */
    clearance: number;
  } | null;
}
