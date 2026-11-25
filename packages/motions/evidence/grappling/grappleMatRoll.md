# src/grappling/grappleMatRoll.ts#grappleMatRoll

## @evidence contracts/development/common.md#meaningful-documentation

Defines the two fitted endpoints, the floor contact handoff and the point of release for the feet.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the first fitted seat bearing, the settled back pose and the existing floor blend. The roll follows the exact current floor height as the pelvis gives bearing to the trunk.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One existing support path up to the seat, one continuous floor roll, then one settled endpoint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The roll uses the fitted seat and back endpoints and the existing whole-body floor constraint. Its events follow the displayed support exchange.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolves two fixed endpoints once. Each intermediate roll sample uses the prepared floor blend and its current floor reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates contact acquisition to support, solved joint extraction to GymnasticsFlight and the collider-constrained blend to floorEntry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains two endpoint poses and the finite floor reader until the plan is released. No sampled trajectory is cached.
