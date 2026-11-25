# src/animals/AutoMovieArchetypeEquineExpression.ts#AutoMovieArchetypeEquineExpression.IRide

## @evidence contracts/development/common.md#meaningful-documentation

States what is added to the ride.

## @evidence contracts/development/design.md#principled-representation

A ride with its sound marks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `layer`; read as any ride and by sound.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpression.ts#AutoMovieArchetypeEquineExpression.layer

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Admit the cues, read the source's rest frames and carriers, then for each sample weight each active channel by its cue's minimum-jerk share and re-pose the base sample; fixed reach targets are solved once at admission to refuse early.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, preparation, then a stateless sampler that delegates the solve and the posing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Outside every cue the base sample is returned unchanged; no target is clamped and no forelimb penetration is accepted.

## @evidence contracts/development/implementation.md#efficient-algorithms

A sample scans the C cues once, reads the rig once and does constant solve work plus the O(B+P+A) emission; idle samples cost one base sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rest frames, carriers and the admitted cue list serve every sample.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the base ride, the rest rotations, the carriers and the cues for as long as the caller keeps the ride.
