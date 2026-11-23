# src/striking/StrikingWeaponSample.ts#StrikingWeaponSample.read

## @evidence contracts/development/common.md#meaningful-documentation

Defines the time, the endpoint order and the absent end of a sphere.

## @evidence contracts/development/implementation.md#principled-implementation

The weapon's own path and tail callbacks; a chain's capsules answer both from the chain posed at that second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two callback reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every read runs the weapon's own callbacks at the asked second.

## @evidence contracts/development/implementation.md#efficient-algorithms

A chain capsule's second read is served by the chain's posing of that second; a weapon of another producer pays its callbacks.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The posing of a second is shared by the chain that owns it (`StrikingWeapon.capsules`), keyed by the exact second on one built geometry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh pair and retains nothing.

# src/striking/StrikingWeaponSample.ts#StrikingWeaponSample.sample

## @evidence contracts/development/common.md#meaningful-documentation

Defines the ordered demand, the time and the keyed result.

## @evidence contracts/development/implementation.md#principled-implementation

One `read` per weapon in the demand's order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One traversal and one result map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every weapon is read at the asked second.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the weapons; capsules of one chain share that chain's single posing of the second.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sharing is the chain's own per-second posing; this reader keeps none.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned map is the caller's; nothing is retained here.
