/**
 * Distinguishes acknowledgements from reviews when assigning rewrite ownership.
 *
 * @evidence contracts/common.md#principled-implementation A closed union distinguishes acknowledgement and review grammar families.
 * @evidence contracts/common.md#clear-and-simple-design Flat declarations, headings and projection share this ownership classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Both alternatives correspond to evidence grammar rather than consumer identities.
 * @evidence contracts/common.md#meaningful-documentation The comment states its role in rewrite ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased type chooses no runtime algorithm; producing and consuming functions own processing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data shape coordinates no work or cache; concrete runtime owners decide value equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased declaration acquires no resources; producers and consumers own concrete value lifetimes.
 */
export type EvidenceDeclarationKind = "acknowledgement" | "review";
