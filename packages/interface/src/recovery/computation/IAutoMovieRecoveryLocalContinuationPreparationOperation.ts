import type { IAutoMovieRecoveryAnalyticDomainsRealizationOperation, IAutoMovieRecoveryOpenContinuation, IAutoMovieRecoveryTensorFamiliesInput } from "../../index";


/**
 * Prepare immutable saved open-arc continuation maps before local surface emission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stable incidence identity used for deterministic registry lookup; matching text does not imply coordinate equality. Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported.
 * @evidence contracts/development/design.md#principled-representation Ordinal of the caller-supplied saved-section pair that produced this graph edge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryLocalContinuation share IAutoMovieRecoveryLocalContinuationPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Stable incidence identity used for deterministic registry lookup; matching text does not imply coordinate equality.
 */

export namespace IAutoMovieRecoveryLocalContinuationPreparationOperation {
/**
 * Prepare immutable saved open-arc continuation maps before local surface emission.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stable incidence identity used for deterministic registry lookup; matching text does not imply coordinate equality. Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported.
 * @evidence contracts/development/design.md#principled-representation Prepare immutable saved open-arc continuation maps before local surface emission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryLocalContinuation share IAutoMovieRecoveryLocalContinuationPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Stable incidence identity used for deterministic registry lookup; matching text does not imply coordinate equality.
 */

export type Operation = (bundle: IAutoMovieRecoveryTensorFamiliesInput,
graph: IAutoMovieRecoveryOpenContinuation,
analytic: ReturnType<IAutoMovieRecoveryAnalyticDomainsRealizationOperation.Operation>) => {
 
 /** Stable incidence identity used for deterministic registry lookup; matching text does not imply coordinate equality. */
key: (n: IAutoMovieRecoveryLocalContinuationPreparationOperation.Node) => string;
 
 /** Saved open-arc identity to its unique outgoing continuation edge; branching remains unsupported. */
outgoing: Map<string, IAutoMovieRecoveryLocalContinuationPreparationOperation.Edge>;
 
 /** Saved open-arc identity to its unique incoming continuation edge; branching remains unsupported. */
incoming: Map<string, IAutoMovieRecoveryLocalContinuationPreparationOperation.Edge>;
 
 /** Admitted saved-section pair records or their counted population, preserving the caller's pair order. */
pairs: number;
 
 /** Observed continuation components that cannot authorize a supported surface bridge. */
unsupportedGroups: number;
 
 /** Unsupported continuation groups containing at least one saved open arc. */
unsupportedGroupsWithOpenArcs: number;
};


/**
 * Node within recovery local continuation preparation operation. Its referenced contract retains the same units, ordering and absence semantics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepare immutable saved open-arc continuation maps before local surface emission.
 * @evidence contracts/development/design.md#principled-representation Prepare immutable saved open-arc continuation maps before local surface emission.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryLocalContinuation share IAutoMovieRecoveryLocalContinuationPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type Node = {
 /** Saved-section ordinal in the input observation sequence. */
section: number;
 /** Open-arc ordinal in the addressed saved section's report. */
arc: number };


/**
 * Edge within recovery local continuation preparation operation. Original before-side boundary observations or their source-face support, retaining the supplied side order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Original before-side boundary observations or their source-face support, retaining the supplied side order. Original after-side boundary observations or their source-face support, retaining the supplied side order.
 * @evidence contracts/development/design.md#principled-representation Ordinal of the caller-supplied saved-section pair that produced this graph edge.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareRecoveryLocalContinuation share IAutoMovieRecoveryLocalContinuationPreparationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type Edge = {
 
 /** Original before-side boundary observations or their source-face support, retaining the supplied side order. */
before: IAutoMovieRecoveryLocalContinuationPreparationOperation.Node;
 
 /** Original after-side boundary observations or their source-face support, retaining the supplied side order. */
after: IAutoMovieRecoveryLocalContinuationPreparationOperation.Node;
 
 /** Whether the matched continuation reverses the after-curve's saved order. */
reverse: boolean;
 
 /** Ordinal of the caller-supplied saved-section pair that produced this graph edge. */
pairOrdinal: number;
};
}

