# src/foldAutoMovieSubjectReviewCoverage.ts#foldAutoMovieSubjectReviewCoverage

## @evidence contracts/development/implementation.md#principled-implementation

A single classification pass over the observations into sets keyed by viewpoint id, then plan-ordered projections of those sets, so the result is a pure function of the plan, the context and the set of observations; an observation is current only when revision, compile fingerprint, plan identity and canonical runtime JSON match the context exactly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The public fold owns classification and the state ladder, with private checks for the context, the plan and the observation's non-blank identities; the observations are typed receipts whose shape the compiler owns, so no runtime type check reads them; digest form and string order come from the shared `SHA256_DIGEST_PATTERN` and `compareCodeUnits` rather than local copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An incomplete or foreign view is counted, never credited to coverage, an unplanned view in a stale context is foreign rather than credited, and a malformed context or plan throws instead of folding into a misleading state; no subject or viewpoint is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States how each observation is classified, the ordering of each list, every state and when it applies, and both refusal kinds with their conditions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in observations plus planned viewpoints with constant-time set lookups, and one sort of the distinct unplanned ids; each observation's identities are read once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One fold per inspection; production calls it once per captured sweep and nothing is kept between folds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the id sets die with the call and the returned lists are bounded by the plan and the distinct unplanned viewpoints.
