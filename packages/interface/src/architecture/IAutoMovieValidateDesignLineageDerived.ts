import type { IAutoMovieViolationAppendTextSink } from "../validation/IAutoMovieViolationAppendTextSink";
import type { IAutoMovieDesignLineage } from "./IAutoMovieDesignLineage";
import type { IAutoMovieDesignVariant } from "./IAutoMovieDesignVariant";

/**
 * Derived-artifact validation context for identity, freshness, provenance and
 * comparison consistency.
 */
export namespace IAutoMovieValidateDesignLineageDerived {
  /**
   * Derived-artifact validation context for identity, freshness, provenance and
   * comparison consistency.
   *
   * Each artifact needs a unique non-blank id that is not a subject's, a
   * non-blank kind, at least one input naming a subject or another artifact
   * once, and lowercase `sha256:` digests for its bytes and its configuration.
   * It is stale, and refused, when its stamp names a revision other than
   * `head`, an unknown variant, a variant based on another revision, or an
   * unknown phase; when an input artifact was stamped differently; when it
   * reads an input subject carrying imported bytes without citing exactly that
   * subject's current digest once; or when it cites bytes of a subject that is
   * not such an input. The input graph must be acyclic. Within one decision,
   * two artifacts of the same kind stamped with that decision's alternatives
   * must share a configuration and a phase, because a comparison shot under two
   * cameras compares the cameras.
   *
   * Findings are pushed to `out` with `<root>.derived[i]` paths, in artifact
   * order and then decision order for the fairness check. The operation does
   * not deliberately throw for findings; exceptions from the supplied sink
   * propagate.
   */
  export type IProps = {
    /**
     * Borrowed lineage whose head, subjects, derived artifacts and decisions
     * are compared without mutation.
     */
    lineage: IAutoMovieDesignLineage;

    /**
     * Borrowed declared subject identities used for input resolution and
     * artifact-id collision detection.
     */
    subjectIds: ReadonlySet<string>;

    /**
     * Borrowed declared phase identities; null artifact phases mean completed
     * work and require no lookup.
     */
    phaseIds: ReadonlySet<string>;

    /**
     * Borrowed variant index used to resolve stamped alternative ids and
     * compare their base revision.
     */
    variants: ReadonlyMap<string, IAutoMovieDesignVariant>;

    /** Diagnostic prefix preceding .derived[index] paths, normally $input. */
    root: string;

    /**
     * Caller-owned synchronous diagnostic sink; artifact and decision findings
     * append in order and callback exceptions propagate.
     */
    out: IAutoMovieViolationAppendTextSink;
  };
}
