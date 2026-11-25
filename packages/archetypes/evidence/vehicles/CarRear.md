# src/vehicles/CarRear.ts#CarRear.build

## @evidence contracts/development/common.md#meaningful-documentation

States which class gets which rear.

## @evidence contracts/development/implementation.md#principled-implementation

A sedan's boot lid lies on the boot and lifts at its rear edge, its hinge's `+Y` along `+X`; a hatchback's tailgate hangs from the roof's rear edge and swings up and out; the van's bulkhead stands `loadLength` ahead of its rear doors with the sliding door's opening behind it; the pickup's bed floor is at its lift-in height and its tailgate drops to level about its foot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper per class.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None beyond the layout's marked constants.

## @evidence contracts/development/implementation.md#efficient-algorithms

A handful of parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
