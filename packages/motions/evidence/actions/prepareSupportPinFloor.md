# src/actions/prepareSupportPinFloor.ts#prepareSupportPinFloor

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed material geometry and the varying blend, pin and floor frames.

## @evidence contracts/development/implementation.md#principled-implementation

A direct joint blend and its root-translated version have identical rotation and root-relative collider heights. Read the original pin datum and both demands at zero Y, then restore Y only for the contact point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The material datum, union bone demand and minimum reader prepare first. Each sample poses once, transforms the pin and reduces the floor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The input is the direct blend before any planted limb goals. The same collider minimum and exact contact datum are used, and the subsequent held-leg confirmation still measures the actual fitted limbs.

## @evidence contracts/development/implementation.md#efficient-algorithms

The exact pin-demand FK and direct floor FK share one ROM admission and demand-union FK per moving sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the fixed material datum and skeleton demand carry between reads. Pose data is used within the current evaluation only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fixed contact and collider geometry release with the interval. No output, pose workspace or motion history is retained.
