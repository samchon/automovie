import { derivedArtifactIsCanonicalProjectPath } from "./derivedArtifactIsCanonicalProjectPath";

/**
 * Ordered find returns the first labelled path failing declared canonical spelling checks, or null when all pass.
 *
 * @evidence contracts/common.md#principled-implementation Ordered find returns the first labelled path failing declared canonical spelling checks, or null when all pass.
 * @evidence contracts/common.md#clear-and-simple-design Manifest invariant reporting preserves output-before-generator-before-input refusal order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Input order is not replaced with fixture-specific prioritization or automatic path repair.
 * @evidence contracts/common.md#meaningful-documentation States that a returned labelled entry is a borrowed input record, not a copied or normalized path.
 * @evidence contracts/performance.md#efficient-algorithms Visits at most P paths with their total path-text validation cost; find itself retains constant state.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the same path predicate as generation without memoizing mutable caller records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the selected borrowed entry or null escapes; no new path store or handle is retained.
 */
export const derivedArtifactFirstUnsafePath: (values: readonly {

    /**
     * Owning role attached to the candidate pathname for first-failure attribution.
     */
    label: string;

    /** Supplied path named by this observation; unsafe candidate spellings remain visible rather than normalized. */
    path: string;
}[]) => {

    /**
     * Owning role attached to the candidate pathname for first-failure attribution.
     */
    label: string;

    /** Supplied path named by this observation; unsafe candidate spellings remain visible rather than normalized. */
    path: string;
} | null = (values: readonly {

    /**
     * Owning role attached to the candidate pathname for first-failure attribution.
     */
    label: string;

    /** Supplied path named by this observation; unsafe candidate spellings remain visible rather than normalized. */
    path: string;
}[]): {

    /**
     * Owning role attached to the candidate pathname for first-failure attribution.
     */
    label: string;

    /** Supplied path named by this observation; unsafe candidate spellings remain visible rather than normalized. */
    path: string;
} | null => values.find((entry: { label: string;
path: string }) : boolean => derivedArtifactIsCanonicalProjectPath(entry.path) === false) ?? null;
