# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.IDiagnostic

## @evidence contracts/development/design.md#principled-representation

A producer, construction level, contract name and detail identify a rejected local construction for the realization's rollback/reporting path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four plain fields carry the failure without coupling the record to an exception class or renderer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record reports a failure rather than treating partial geometry as successful; it does not itself enforce rollback.

## @evidence contracts/development/common.md#meaningful-documentation

Names the failed piece, construction level and explanatory numerical detail, with fallback owned by the producing operation.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.Stations

## @evidence contracts/development/design.md#principled-representation

The intersection brand identifies the stations checker boundary on a read-only number array.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The original array remains the value rather than gaining a runtime wrapper or duplicate table.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The brand neither freezes storage nor prevents an explicit cast; callers must preserve the checked ordering and values.

## @evidence contracts/development/common.md#meaningful-documentation

States physical units, the minimum-rise check and borrowed ownership.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.Jet

## @evidence contracts/development/design.md#principled-representation

The jet brand marks an array that passed elementwise magnitude comparisons with a supplied bound.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A type intersection preserves the numerical array layout used by interpolation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This type does not record the bound or prevent later alias mutation/casting; it cannot independently certify finiteness.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes a finite caller bound from a guarantee supplied by the alias itself.

# src/construction/IAutoMovieLoftContract.ts#IAutoMovieLoftContract.Ring

## @evidence contracts/development/design.md#principled-representation

The ring brand names the finite-coordinate and nonzero projected-sum check performed by ring.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The point sequence remains a plain read-only tuple array used directly by loft producers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The brand does not certify simplicity, planarity, orientation or a finite accumulated area, and aliases/casts can invalidate its intended premise.

## @evidence contracts/development/common.md#meaningful-documentation

Names the horizontal projection and units rather than implying a complete geometric ring validator.
