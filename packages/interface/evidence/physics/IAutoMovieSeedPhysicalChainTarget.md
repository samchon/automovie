# src/physics/IAutoMovieSeedPhysicalChainTarget.ts#IAutoMovieSeedPhysicalChainTarget.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines the admitted chain, independent goal and caller-owned bounded subtree rotation.

## @evidence contracts/development/design.md#principled-representation

World target poses and bone-local endpoint offsets are metres; rotate requests angular increments in radians within profile coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

seedPhysicalChainTarget uses the shared two-bone solver but delegates every change of working targets to the caller's range-limited rotate callback.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only a straight-chain degeneracy is seeded; absent movable geometry can produce no update and no actual body pose is written.
