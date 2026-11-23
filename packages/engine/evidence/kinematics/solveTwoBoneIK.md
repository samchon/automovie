# src/kinematics/solveTwoBoneIK.ts#solveTwoBoneIK

## @evidence contracts/development/implementation.md#principled-implementation

The law of cosines on the reachable triangle gives bend and lift up to binary64 roundoff. Positive common rescaling preserves both angles while keeping extreme shared units out of squared-length overflow/underflow; unrepresentable relative side products refuse. Distance-shell and cosine-bound clamping preserve the stated reach convention, and equal segments at zero distance have no lift direction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A scalar solver separate from chain orientation, so `twoBoneChainArticulation` and each rig orient the chain their own way while sharing these angles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable goal is clamped and reported through `clamped` rather than hidden, invalid input throws instead of being coerced, and no limb or length is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

States what each angle measures and its range, the clamping bounds and flag, the zero-distance answer, the shared unit, and the thrown inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three input validations, a fixed-size magnitude test and at most three rescaling divisions precede two bounded arccosines, using constant time and scalar storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Chain lengths and requested distance determine this angle pair; target-dependent calls share no previously clamped reach solution.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned record.
