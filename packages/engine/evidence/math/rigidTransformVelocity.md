# src/math/rigidTransformVelocity.ts#rigidTransformVelocity

## @evidence contracts/development/implementation.md#principled-implementation

Translation is its endpoint difference divided by elapsed seconds. The principal logarithm of current times inverse(previous) gives the WORLD-axis rotation increment, invariant under either quaternion sign. The caller must supply the same actual rigid identity and one branch with less than pi intervening rotation; endpoint data cannot certify that premise or a derivative. Existing unit admission precedes private normalization; exact pi and nonrepresentable intermediates refuse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure function observes two existing transform projections and returns two existing vectors. Actor identity, temporal sampling, contact branches and clinical controls remain with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No actor, renderer, technique or sampling rate is special-cased. Zero angular velocity applies only to an identity increment, and invalid or ambiguous data throws rather than supplying a fabricated velocity.

## @evidence contracts/development/common.md#meaningful-documentation

Gives WORLD frames, metre/second and radian/second units, shortest-arc and alias limits, actual-sampling responsibility, normalization and rejection behavior, scale exclusion and input ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two fixed-size admissions, one quaternion product/logarithm and one vector difference take constant time and temporary space; no pose, geometry or history is scanned.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This stateless operation reads two supplied frames once and coordinates no work across requests; the caller owns any equivalent actual-state sampling.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returned vectors own their components; temporary admissions and quaternion copies retain no caller record, history, handle or task after return.
