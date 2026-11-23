# src/handling/HumanClasp.ts#HumanClasp.choose

## @evidence contracts/development/common.md#meaningful-documentation

States both hand inputs, the world meeting point and pump amplitude, and the reciprocal result; the namespace gives the reach, posture-band, clearance and subject-order rules.

## @evidence contracts/development/implementation.md#principled-implementation

Each turn is fitted over the clasp and both pump ends; admitted candidates are paired, a pair is clear when no phalanx capsule of either open hand enters the other's forearm collider, and clear pairs rank by the worse arm's miss plus its elbow departure's arc on the upper arm, millimetres of the hand, with a hundredth-millimetre-per-degree turn preference.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fit each person's turns, admit them (`HumanClaspCandidateFrames`), place admitted digit and forearm geometry once each, then rank the pairs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pair is accepted without the clearance test; with none clear, the largest clearance wins and is reported.

## @evidence contracts/development/implementation.md#efficient-algorithms

Thirteen turn fits per person share one body FK workspace; digit and forearm geometry is placed once per admitted candidate (O(A+B)), and each of the A*B pairs runs two fifteen-segment distance reductions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A candidate's placed digits and forearm serve every pair it enters; each pair computes its own distances.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Candidate geometry ends with the synchronous search; the returned reach records hold no reader.
