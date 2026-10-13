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
 * @evidence contracts/common.md#principled-implementation Produced by `builtEnvironmentSupportSweep`, which sorts every drawn part box by top height, binary-searches to the first top at or below the subject's underside plus tolerance, and takes the first part, not the subject's own, whose XZ footprint overlaps the subject's union box.
 * @evidence contracts/common.md#clear-and-simple-design A finding carries the body, its basis and the nearest thing below but no support claim, because the sweep measures clearance and leaves bearing to the named-pair query.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The subject is judged by its union box while candidates are drawn parts, so a part under an empty corner of the union can count as beneath it; an origin-point body is judged as the point it is and keeps that basis.
 * @evidence contracts/common.md#meaningful-documentation States that the record is a measurement, the null meaning of `below`, how the body below is chosen, and why the clearance always exceeds the tolerance.
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
   *
   * "Under" means a drawn part whose top is at or below this body's underside
   * and whose horizontal footprint overlaps this body's world box; the named
   * body is the one that part belongs to.
   */
  below: {
    /** The nearest measurable body below. */
    body: AutoMovieBuiltPlacementBodyLocator;

    /** Positive vertical clearance from that body's top to this one's underside. */
    clearance: number;
  } | null;
}
