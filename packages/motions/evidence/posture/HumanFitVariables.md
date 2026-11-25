# src/posture/HumanFitVariables.ts#HumanFitVariables.vector

## @evidence contracts/development/implementation.md#principled-implementation

Reads the named root coordinate, Euler heading or clinical joint angle in its declared metres or degrees, with the existing zero default for an absent joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered variable map creates the numerical vector used by the fit and its merit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the supplied posture without clamping, a body-specific replacement or a changed joint default; callers supply supported variables.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(n) time and numeric storage for n variables.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads current posture values because each fit or merit candidate may differ; variable order is shared with written and the Jacobian.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one caller-owned vector and retains no posture or result.

## @evidence contracts/development/common.md#meaningful-documentation

States variable order, coordinate units, absent-joint behavior and result ownership.

# src/posture/HumanFitVariables.ts#HumanFitVariables.written

## @evidence contracts/development/implementation.md#principled-implementation

Writes the variable vector back into the matching root, heading and joint coordinates, preserving all other posture values and clearing resolved limb hints as before.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copies posture records, then writes coordinates in variable order; a lazy local record identifies the joint tuples already copied by this call.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves duplicate-variable last-write behavior and existing absent-joint zero coordinates without changing ranges; compatible vector dimensions remain a caller premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(j+n) time and O(j+U) output/local storage for j stored joints, n variables and U changed joints; A angle writes allocate U tuples rather than A, and place/heading-only writes allocate no joint-ownership record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Untouched tuples/members stay shared; after a joint's first copy, subsequent axes and duplicate variables update only that owned tuple in the original order, reading every current vector value without a cast or input mutation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The new posture owns changed tuples/root and borrows unchanged members as before; the at-most-U-entry ownership record ends on return or throw and no current posture or vector is retained globally.

## @evidence contracts/development/common.md#meaningful-documentation

Defines coordinate writing, preserved members, cleared limb hints, dimension premise and copy ownership.

# src/posture/HumanFitVariables.ts#HumanFitVariables.bounds

## @evidence contracts/development/implementation.md#principled-implementation

Intersects each current joint interval with the trust radius around x, then divides by its solved unit; a locked or already out-of-range coordinate retains the existing zero step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One variable map reads its current shared-table range and constructs one keyed scalar hard row.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the existing range intersection, trust radii, division order and locked-axis behavior; no ROM value, tolerance or invalid-input fallback changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(n) time and row storage; borrowing current ROM records and one private unbounded interval avoids an additional range tuple per variable.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the current ROM record on every call and shares only its immediate read-only interval, never a stale bound or a prior-radius row.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh rows and coefficient/index arrays; borrowed table records do not escape, and no variable, x or radius is retained.

## @evidence contracts/development/common.md#meaningful-documentation

Defines solved units, hard-row keys, trust intersection, locked-axis rule and fresh output ownership.

# src/posture/HumanFitVariables.ts#HumanFitVariables.edge

## @evidence contracts/development/implementation.md#principled-implementation

Tests whether a coordinate's absolute movement in its original unit reaches 0.99 times its widest step and the current radius.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One short-circuit variable scan supplies the trust schedule's boundary flag.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the existing boundary coefficient, multiplication association and coordinate units without adding a physical acceptance tolerance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(n) worst-case time and O(1) auxiliary storage, stopping at the first reached coordinate.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same unit and reach owners as bounds, while evaluating each current step and radius anew.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no vector or state and returns only a boolean.

## @evidence contracts/development/common.md#meaningful-documentation

States unit reversal, the existing edge fraction and short-circuit result.

# src/posture/HumanFitVariables.ts#HumanFitVariables.reach

## @evidence contracts/development/implementation.md#principled-implementation

Selects the existing widest linearisation step by whether the coordinate is a root place or an angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminant read selects the owning STEP table entry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the named solver policy values without action categories or tuning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(1) time and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Bounds, length and resolution use this same table-backed coordinate convention.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no variable.

## @evidence contracts/development/common.md#meaningful-documentation

States widest-region meaning and metres-versus-degrees units.

# src/posture/HumanFitVariables.ts#HumanFitVariables.resolution

## @evidence contracts/development/implementation.md#principled-implementation

Selects the existing displayed-motion resolution by linear or angular coordinate kind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminant read selects the RESOLUTION entry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the inherited resolution policy rather than changing a convergence requirement for an observed case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(1) time and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit's least-step calculation reads the same resolution owner for all supported variables.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no state.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the coordinate resolution and its own physical unit.

# src/posture/HumanFitVariables.ts#HumanFitVariables.unit

## @evidence contracts/development/implementation.md#principled-implementation

Selects centimetres for root places and degrees for angular solved coordinates through the existing UNIT table.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coordinate-kind branch supplies the scalar conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the established unit values and distinguishes a conversion from a tolerance or a range.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(1) time and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Curvature, row Jacobians, hard bounds and step writing share this conversion owner.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar without retaining inputs or allocating a conversion object.

## @evidence contracts/development/common.md#meaningful-documentation

States the solved coordinate units and conversion purpose.

# src/posture/HumanFitVariables.ts#HumanFitVariables.weight

## @evidence contracts/development/implementation.md#principled-implementation

Selects the existing preferred-posture quadratic weight for root place, heading or joint coordinates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed coordinate-kind selection owns the WEIGHT table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the inherited relative objective policy without fitting weights to a fixture or changing constraint prices.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(1) time and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual merit and every objective convexification use this same pure coordinate weight.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no variable or fit.

## @evidence contracts/development/common.md#meaningful-documentation

States objective units and distinguishes the three coordinate kinds.
