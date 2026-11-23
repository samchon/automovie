# src/motion/fitHingedChainAt.ts#fitHingedChainAt

## @evidence contracts/development/implementation.md#principled-implementation

Tolani, Goswami and Badler 2000: the hinge angle is fixed by the span and the swivel is the remaining degree of freedom, so a given swivel determines the chain in closed form; the decomposition, clamp and orientation are the fit's own owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareHingedChainAt owns the preparation; this pose one branch at one swivel, decomposes and clamps both joints, and orients the end joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No candidate is scored and no other swivel is visited; an unreachable target reports its shortfall rather than claiming a reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation, one branch root solve and one pose, two decompositions and clamps, and one final orientation: constant work per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call evaluates its own request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the preparation ends with the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs read and ignored, the swivel frame, the result and the null cases.
