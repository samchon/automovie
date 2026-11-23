# src/kinematics/hingedSwivelPole.ts#hingedSwivelPole.IBranch

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and use.

## @evidence contracts/development/design.md#principled-representation

The branch's scorer, its root and mid rotations at a swivel and its optional certified refusal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, each read by search.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The refusal is null rather than optional when the caller has none.

# src/kinematics/hingedSwivelPole.ts#hingedSwivelPole.IBranch.probe

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the candidate returned.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/hingedSwivelPole.ts#hingedSwivelPole.IBranch.posed

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the rotations returned.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A slot its caller fills; the interface declares it and implements nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A slot its caller fills; the interface declares it and implements nothing.

# src/kinematics/hingedSwivelPole.ts#hingedSwivelPole.search

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The caller's closed-form start (the pole of two-bone IK, or a term's own minimiser) fixes the swivel; with a direct score the nearest admissible start is Tolani's selection, otherwise the downhill walk and golden refinement minimise the caller's full score in that start's basin under the caller's strict ordering.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop per branch: start, walk, refine, keep the best; start and direction are chosen by score, so the search has no direction-dependent tie-break beyond exactly equal scores.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refused bracket moves the start; a branch with no unrefused swivel within half a turn is skipped; a missing pole returns null rather than guessing a side.

## @evidence contracts/development/implementation.md#efficient-algorithms

A direct score whose start is unrefused costs one start reading, the refusal test and one score per branch. Otherwise per branch one start reading, at most 360 refusal tests and at most two start scores, the two neighbours, one score per doubling plus the one that stops it, at most two per halving, and the refinement's scores: about 4 log2(d) scores for a minimum d steps away, three and the refinement for a start already at its minimum, against the sweep's 360 and every minimum's refinement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure search of the caller's scorers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds two candidates per branch until return.
