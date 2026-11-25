# src/rope/ropeSwing.ts#ropeSwing

## @evidence contracts/development/common.md#meaningful-documentation

States the pendulum, the release rule, the flight, the landing and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The pendulum and the projectile are closed forms; the release is the sampled instant minimising the landing miss.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Geometry, the release search, then one posture writer over three phases.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable landing refuses rather than steering the flight; the constants are provisional and stated as such.

## @evidence contracts/development/implementation.md#efficient-algorithms

SAMPLES closed-form evaluations at plan time; constant work per sample.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only its closed-form constants.
