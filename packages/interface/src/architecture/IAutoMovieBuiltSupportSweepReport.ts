import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { IAutoMovieBuiltFloatingBody } from "./IAutoMovieBuiltFloatingBody";

/**
 * What one whole-building support sweep measured, not only what it found.
 *
 * The census is part of the answer. An empty finding list from a sweep that
 * resolved nothing reads exactly like a clean building, so the counts travel
 * beside the findings and a caller compares them.
 *
 * Every measured body lands in exactly one of {@link grounded}, {@link borne}
 * and {@link floating}, judged by the underside of its world box. The ground
 * height is the sweep's own `groundY` argument, `0` by default, not anything
 * read from the environment.
 *
 * @evidence contracts/common.md#principled-implementation Candidate parts are sorted by top height descending and a binary search skips every part above a subject's underside plus tolerance, so the first footprint hit is the nearest part beneath; `compared` counts the parts read after that search.
 * @evidence contracts/common.md#clear-and-simple-design Three counts partition the measured bodies, the floating findings carry detail, and unresolved locators are listed beside them, which is the minimum that lets an empty finding list be read as a clean building.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ground height comes from the caller's argument rather than an assumed environment field, bodies sunk below ground count as grounded as documented, and unresolved bodies are reported rather than skipped.
 * @evidence contracts/common.md#meaningful-documentation States that the three counts partition `measured`, where the ground height comes from and its default, what `compared` excludes, the grounded and borne thresholds, and the order of the floating list.
 * @author Samchon
 */
export interface IAutoMovieBuiltSupportSweepReport {
  /** Bodies whose extent resolved and were therefore judged. */
  measured: number;

  /**
   * Candidate part inspections performed after pruning, the sweep's own cost,
   * so a caller deciding whether to run it every round can read the cost from
   * the answer. It excludes resolving each body, which stages the element
   * hierarchy once per element.
   */
  compared: number;

  /**
   * Bodies whose underside is at or below the ground height plus the
   * tolerance, including bodies sunk below it.
   */
  grounded: number;

  /**
   * Bodies whose nearest part beneath, among other bodies' parts, has its top
   * within the tolerance of their underside.
   */
  borne: number;

  /**
   * Every body with clear air under it, in record order: elements first, then
   * populations.
   */
  floating: IAutoMovieBuiltFloatingBody[];

  /** Bodies whose extent the record does not resolve, so nothing was judged. */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
