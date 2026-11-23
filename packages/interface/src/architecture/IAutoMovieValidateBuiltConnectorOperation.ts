import type { IAutoMovieViolationCollector } from "../validation/IAutoMovieViolationCollector";
import type { IAutoMovieBuiltConnector } from "./IAutoMovieBuiltConnector";
import type { IAutoMovieBuiltElement } from "./IAutoMovieBuiltElement";

/**
 * Connector-operation validation context with shared element-drive ownership
 * tracking.
 */
export namespace IAutoMovieValidateBuiltConnectorOperation {
  /**
   * Connector-operation validation context with shared element-drive ownership
   * tracking.
   *
   * An operated connector must name the elements it is built from, and declare
   * at least one carriage and one state. Each carriage needs a unique non-blank
   * id, an element that resolves and is one of the run's elements or below one,
   * and a valid travel by {@link validateBuiltTravelMotion}; no element may be
   * driven by two members of the whole work, which `driven` records across
   * every opening and connector and is updated here. Each state needs a unique
   * non-blank id and a known drive, may drive in `reverse` only on a
   * bidirectional run, and gives every carriage exactly one value inside its
   * travel; a carriage value's `serves` is null when between stops, otherwise
   * it names one of the run's endpoints or landings. The current state must
   * resolve. Findings are pushed under `path`; a run with no operation is
   * skipped.
   */
  export type IProps = {
    /**
     * Borrowed connector; an omitted operation is skipped without changing the
     * collector or driven map.
     */
    connector: IAutoMovieBuiltConnector;

    /**
     * Diagnostic path of this connector, to which .operation and indexed member
     * paths are appended.
     */
    path: string;

    /**
     * Borrowed complete building element hierarchy used to expand the
     * connector's owned subtrees.
     */
    elements: readonly IAutoMovieBuiltElement[];

    /** Borrowed declared building element ids for carriage reference resolution. */
    elementIds: ReadonlySet<string>;

    /**
     * Caller-owned element-id to first-driver description map, updated even
     * when other carriage checks fail; share it across openings and
     * connectors.
     */
    driven: Map<string, string>;

    /**
     * Synchronous diagnostic sink appended in declaration order; it can retain
     * authored values and its exceptions propagate.
     */
    collector: IAutoMovieViolationCollector;
  };
}
