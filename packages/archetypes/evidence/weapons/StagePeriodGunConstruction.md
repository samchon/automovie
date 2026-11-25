# src/weapons/StagePeriodGunConstruction.ts#StagePeriodGunConstruction.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

Names the record, its read lengths and the provisional stock and barrel proportions.

## @evidence contracts/development/design.md#principled-representation

Lengths in metres and mass in kilograms; the record string states each figure's source.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the figures the construction lays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required; a value the record lacks is an authored estimate named as such in `record`.

# src/weapons/StagePeriodGunConstruction.ts#StagePeriodGunConstruction.Contact

## @evidence contracts/development/common.md#meaningful-documentation

Names the handling, aiming and sling contacts every silhouette builds.

## @evidence contracts/development/design.md#principled-representation

A closed union of the contact ids `lay` builds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The holds, the muzzle and the two sling swivels the choreography reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It names no lock contact; each producer adds its own.

# src/weapons/StagePeriodGunConstruction.ts#StagePeriodGunConstruction.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Names the recorded lengths and mass.

## @evidence contracts/development/design.md#principled-representation

Metres for the lengths, kilograms for the mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The read figures a comparison checks.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No estimated proportion is recorded as a dimension.

# src/weapons/StagePeriodGunConstruction.ts#StagePeriodGunConstruction.lay

## @evidence contracts/development/common.md#meaningful-documentation

States the parts and contacts laid and their frame.

## @evidence contracts/development/implementation.md#principled-implementation

Boxes and rods along the barrel's line from the read overall and barrel lengths; the trigger stands at the length of pull, as `createLongGun` places it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Record the dimensions, lay butt to muzzle, then the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unread proportions come from the profile's named estimates.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six parts and seven contacts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both period silhouettes share this stock and its contacts.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the builder to its caller and keeps nothing.

# src/weapons/StagePeriodGunConstruction.ts#StagePeriodGunConstruction.build

## @evidence contracts/development/common.md#meaningful-documentation

States the mass the model is built at.

## @evidence contracts/development/implementation.md#principled-implementation

Builds at the profile's read or estimated mass.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One build call.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work beyond the build.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
