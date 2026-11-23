# src/animals/EquineAirs.ts#EquineAirs.pitch

## @evidence contracts/development/common.md#meaningful-documentation

States the source of each angle.

## @evidence contracts/development/implementation.md#principled-implementation

A lookup of the sourced angles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the held airs and the courbette's levade.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineAirs.ts#EquineAirs.held

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the output and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A held air is the rear at `pitch` with the air as its cue; a courbette leaps from the levade's rear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rear, one branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rear plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stance's own rear.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the rear's plan.

# src/animals/EquineAirs.ts#EquineAirs.courbette

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the displaced end.

## @evidence contracts/development/implementation.md#principled-implementation

The entry is the levade's; each leap of the hold translates the levade's trunk along the horse's heading by the leap's share of `LEAP` and up on the ballistic parabola of its duration, the hind limbs tucked from their chains at the leap's start; the exit is the levade's played back from the displaced place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Entry, leaps, exit, each from the levade.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The height is the ballistic apex of the leap time, never fitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the levade's plan and its held hind chains.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the levade's plan.

# src/animals/EquineAirs.ts#EquineAirs.capriole

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and that it lands where it took off.

## @evidence contracts/development/implementation.md#principled-implementation

The entry lowers the trunk by `GATHER` over the planted hooves; the hold is a ballistic flight of the hold's duration from the gathered stance, every limb tucked from its gathered chain on a half-sine share and the hind legs kicking out at the top; the exit rises from the gathering.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Gather, fly, rise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The height is the ballistic apex of the flight time, never fitted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four gathered chains once; constant work per pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the shared support rules and gathered chains.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds the gathered chains.
