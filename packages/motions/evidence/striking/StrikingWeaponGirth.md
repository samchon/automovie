# src/striking/StrikingWeaponGirth.ts#StrikingWeaponGirth.legRadii

## @evidence contracts/development/common.md#meaningful-documentation

States joint order, tapered interfaces and metre units.

## @evidence contracts/development/implementation.md#principled-implementation

Adjacent segment girths share the measured knee/ankle radii; the foot uses the existing FOOT_RADIUS_SHARE of ankle height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measure read builds the three declared capsule radii.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the named anatomical measurements and foot-radius share.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and three output radius records.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure scalar construction with no repeated expensive work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingWeaponGirth.ts#StrikingWeaponGirth.armRadii

## @evidence contracts/development/common.md#meaningful-documentation

States capsule order, metre units and the shared elbow/fist girth.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the body's measured upper-arm and forearm radii at their existing shared segment interfaces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One measure lookup builds three radius entries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the actual body's girths without an actor-specific constant.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time and output space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure scalar construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingWeaponGirth.ts#StrikingWeaponGirth.girth

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint shares, constant/tapered forms and metre units.

## @evidence contracts/development/implementation.md#principled-implementation

A tapered capsule linearly interpolates its two declared end radii.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar-or-pair branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the caller's exact share and declared radii.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Pure scalar arithmetic.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
