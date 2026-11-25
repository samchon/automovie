# src/compose/AutoMovieMotionHumanArmCarryCourse.ts#AutoMovieMotionHumanArmCarryCourse.fixed

## @evidence contracts/development/common.md#meaningful-documentation

States the eligibility premise, returned writer's inputs and ownership of current posture.

## @evidence contracts/development/implementation.md#principled-implementation

With the goal removed the arm's current resolved endpoint is its direct ROM projection. Uncarried joints and fingers cannot change those three selected joint records. The clearance geometry and both blends are therefore the fixed arrival's, with no world-space goal or obstacle read from the varying posture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the arrival once, prepare its correction coefficients and write over the current posture at the share supplied by the law.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preparation samples the existing clearance keys only and carries the original angle blend at every queried share. The law handles start and arrival endpoint semantics.

## @evidence contracts/development/implementation.md#efficient-algorithms

One arrival solve and the original clearance calculation at each fixed key per carried arm. Samples evaluate the chart-aware arm blends and two scalar correction interpolants.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged arrival and absence of goals for the carried arms give identical endpoints. The fixed clearance keys depend on that arrival only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the fixed blends and scalar corrections until the owning plan releases them. Temporary collision poses and resolution metadata end with preparation.

# src/compose/AutoMovieMotionHumanArmCarryCourse.ts#AutoMovieMotionHumanArmCarryCourse.arms

## @evidence contracts/development/common.md#meaningful-documentation

States clearance and endpoint inputs, preparation mode and lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

The correction uses the original clearance function and the corresponding share of the other arm. The fixed option supplies the same share to the already prepared preceding arm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare both plain blends before computing correction knots in arm order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Baselines, clearance candidates and blend charts use their original owners and accept no changed bounds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Live reads inspect only the enclosing keys. Fixed reads interpolate original coefficients compiled across the authored key set.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed data are supplied only by the invariant arrival constructor. Within a live carry, each key's geometry and correction is shared only among identical requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Live readers own their query maps for one carry. Compilation replaces those readers with the coefficient-only samplers.
