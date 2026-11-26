import type { IAutoMovieViolationAppendPositiveTextSink } from "../validation/IAutoMovieViolationAppendPositiveTextSink";
import type { IAutoMovieBuiltElement } from "./IAutoMovieBuiltElement";
import type { IAutoMovieBuiltOpening } from "./IAutoMovieBuiltOpening";

/**
 * Opening-operation validation context with shared element-drive ownership
 * tracking.
 */
export namespace IAutoMovieValidateBuiltOpeningOperation {
  /**
   * Opening-operation validation context with shared element-drive ownership
   * tracking.
   *
   * An operated opening must name the element it fills, and declare at least
   * one panel and one state. Each panel needs a unique non-blank id, an element
   * that resolves and is the filling element or below it, a positive width and
   * height, and a valid travel by {@link validateBuiltTravelMotion}. No element
   * may be driven by two members of the whole work, because one element carries
   * one displacement: `driven` records which member already drives each element
   * across every opening and connector, and is updated here. Each state needs a
   * unique non-blank id and gives every panel exactly one value inside its
   * travel, and the current state must resolve. Hardware needs unique non-blank
   * ids, a non-blank kind, and an element that resolves when it names one.
   * Findings are pushed under `path`; an opening with no operation is skipped.
   */
  export type IProps = {
    /** Borrowed opening; an omitted operation causes no validation work. */
    opening: IAutoMovieBuiltOpening;

    /**
     * Diagnostic path of the opening, used as the prefix for operation, panel,
     * state and hardware findings.
     */
    path: string;

    /**
     * Borrowed complete building hierarchy used to determine descendants of the
     * filling element.
     */
    elements: readonly IAutoMovieBuiltElement[];

    /**
     * Borrowed declared building element ids used to resolve panel and optional
     * hardware elements.
     */
    elementIds: ReadonlySet<string>;

    /**
     * Caller-owned element-id to first-driver description map; first claims
     * remain even for invalid panels and later claims produce conflicts.
     */
    driven: Map<string, string>;

    /**
     * Synchronous diagnostic sink; appended findings may reference authored
     * records and sink exceptions propagate.
     */
    collector: IAutoMovieViolationAppendPositiveTextSink;
  };
}
