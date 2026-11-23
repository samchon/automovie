# src/motion/human/terrain/IAutoMovieMotionHumanStepVault.ts#IAutoMovieMotionHumanStepVault

## @evidence contracts/development/common.md#meaningful-documentation

States the contact sequence, side convention and which choreography the targets support.

## @evidence contracts/development/design.md#principled-representation

The side selects the paired palm and opposite foot. Separate entry, crossing and exit targets describe their physical locations in each authored frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface `stepVaultSupport` reads each target in the stance where that contact bears, and the side chooses which leg moves through first.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the human side and motion target contracts. The route's coordinates and stances remain independent of body dimensions.

# src/motion/human/terrain/IAutoMovieMotionHumanStepVault.ts#IAutoMovieMotionHumanStepVault.Target

## @evidence contracts/development/common.md#meaningful-documentation

States the variants, units, frame and time of resolution.

## @evidence contracts/development/design.md#principled-representation

The motion target discriminant preserves either a named prop contact or a spatial point and its frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The route and its footprints share the same support target projection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the shared target union and admits only physical point variants.

# src/motion/human/terrain/IAutoMovieMotionHumanStepVault.ts#IAutoMovieMotionHumanStepVault.IFeet

## @evidence contracts/development/common.md#meaningful-documentation

States where this pair applies and what it represents.

## @evidence contracts/development/design.md#principled-representation

Each required member supplies one of the two distinct foot contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `stepVaultSupport` reads both sides for the entry and exit stances.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The same pair type handles both ends and either choice of supporting hand.
