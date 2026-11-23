# src/weapons/createLongGun.ts#createLongGun

## @evidence contracts/development/implementation.md#principled-implementation

Rods and boxes along the barrel's line from the published overall and barrel lengths; the trigger stands at the length of pull from the butt plate, the measure that fits a gun to an arm, and the carbine's stock travel is the difference between its published extended and retracted lengths. The stock stops short of the grip so the firing hand's hold stands clear, and the fixed tube it slides on is longer than the travel, so the drawn stock never parts from the receiver.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pick the model, draw the other dimensions, lay the stock, neck, receiver, barrel and fore-end, then the contacts and the one slider.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No magazine, sights' shape or sling; the sight line is a frame above the barrel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Seven parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States what is and is not modelled, how the gun lies and what each contact is.
