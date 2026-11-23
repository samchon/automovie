# src/architecture/validateBuiltPopulation.ts#validateBuiltPopulation

## @evidence contracts/development/implementation.md#principled-implementation

Checks safe-integer counts, finite coordinates, positive scales/spacings and finite ordered ranges. Slot quaternion norms use `Math.hypot` with a fixed `1e-6` accepted discrepancy; it is a normalization policy, not a universal serialization-error bound. Range ordering is compared only after both endpoints are finite.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the population subset of the building contract and is called by both the record validator and the bounds fold, which previously kept two identical copies; small private checks keep each rule's path and message in one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no population or layout instance; `along-route` is refused as a kind because a building record has no field that can reach a production route, which is a contract difference rather than a special case.

## @evidence contracts/development/common.md#meaningful-documentation

States what subset is checked and why the production builder owns the rest, the two path prefixes and who uses them, every rule per field and layout kind, and that defects are collected rather than thrown.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is linear in the explicit transform count and constant otherwise; one pass with no allocation beyond the violations it records.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A synchronous check of one population that coordinates no work across calls; each caller validates the record it was handed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; violations go into the caller's collector, which the caller owns.
