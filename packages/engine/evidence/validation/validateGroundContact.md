# src/validation/validateGroundContact.ts#validateGroundContact

## @evidence contracts/development/implementation.md#principled-implementation

Sample FK and compare configured foot points and valid capsule endpoints to scalar/height-source ground minus tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

groundFunction, shared sampleTimes and validateCapsule own the height adapter, clock and usable endpoint contract.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing foot bones are skipped, capsules require reachable endpoints, and endpoint checks do not solve penetration against arbitrary curved heightfields.

## @evidence contracts/development/common.md#meaningful-documentation

Defaults24Hz/zero ground/zero tolerance, advisory physicsIntent policy and capsule radius semantics are explicit.

## @evidence contracts/development/implementation.md#efficient-algorithms

T samples pay motion/FK and O(F+C) support queries; two endpoints are measured per capsule.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Topology/reachability and capsule usability are computed before the time walk; current ground callbacks execute for each measurement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Per-frame maps release; the caller owns warnings and the borrowed callback lifetime, with no physics scene created.
