# src/kinematics/hingedSwivelNear.ts#hingedSwivelNear

## @evidence contracts/development/common.md#meaningful-documentation

States both paths, when the closed-form candidate answers, the turn it is taken in, the subnormal case and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Where a requested term is met only at isolated swivels, those are the admissible set near the seed too (the analytic swivel of Tolani, Goswami and Badler 2000), and the refinement of the same score converges on the one inside its bracket; the golden-section search (Kiefer 1953) remains for every other case. Where the term is met over intervals of swivels known in closed form, the point of that set nearest the seed is the seed or an interval end, the continuation's nearest admissible configuration, so the search is centred there with no cap on how far it lies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tolerance's admission, the closed-form candidates of the bracket, then the refinement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A closed-form candidate answers only when the caller's own score finds it legal and its own acceptance finds the term met; anything less is refined exactly as before, with the original pass count.

## @evidence contracts/development/implementation.md#efficient-algorithms

One score per closed-form candidate of the bracket, at most a few, in place of two scores and one per pass; the refinement's count is unchanged when it runs. Unmeasured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure search of the caller's scorers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds a few candidates until return.
