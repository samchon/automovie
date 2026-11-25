# src/posture/HumanArmDifferential.ts#HumanArmDifferential.step

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the Jacobian, the damping and the zero case.

## @evidence contracts/development/implementation.md#principled-implementation

Damped least squares (Wampler 1986) on a central-difference Jacobian of the arm's own forward placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One Jacobian, one damped three-by-three solve, one back-projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A zero displacement returns a zero step, not a small one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two unchanged three-joint FK queries per free coordinate without unused probes, one bounded packed column buffer instead of per-column vector intermediates, six ordered scalar Gram sums and the same Cramer expansion without Gram, right-hand-side or substituted matrix arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The shared prepareChain reader owns only this invocation's exact joint-triple snapshots and private completed local rotations; distinct triples retain actual projection, world prefixes stay per-query, two restored buffers serve every central difference, and Gram sums share symmetry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The private column buffer holds three doubles per setup coordinate, and the chain reader holds three latest joint-triple entries; both end with this synchronous step and escape through no result or callback. Returned coordinates are fresh, source buffers are not retained, and zero displacement creates no reader.
