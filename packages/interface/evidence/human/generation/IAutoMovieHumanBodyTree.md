# src/human/generation/IAutoMovieHumanBodyTree.ts#IAutoMovieHumanBodyTree.IFold

## @evidence contracts/development/common.md#meaningful-documentation

One fold's join onto the subtree built so far, calibration mm.

## @evidence contracts/development/design.md#principled-representation `part`: The joined subtree. `partFace`: The part's face that meets the host. `hostFace`: The host face the seed meets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyTree.massFold. Read by AutoMovieHumanBodyTree.join, AutoMovieHumanBodyTree.massFold. Also types AutoMovieHumanBodyLane.fold, AutoMovieHumanTrunkBuild.out.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `sourceSeed`: Actual original-parent exit used to select a mass's host face, before kept-atlas validation.

# src/human/generation/IAutoMovieHumanBodyTree.ts#IAutoMovieHumanBodyTree.ILimits

## @evidence contracts/development/common.md#meaningful-documentation

The joins' trace limits and sampling, millimetres and radians.

## @evidence contracts/development/design.md#principled-representation `count`: Points of each trace per turn and columns of each blend, a multiple of 4 of at least 8. `tolerance`: Largest distance between the two surfaces at a traced point, mm. `grazing`: Least angle between the two tangent planes, radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanBodyTree.join, AutoMovieHumanBodyTree.realize. Also types AutoMovieHumanBodyLane.LIMITS, AutoMovieHumanBodyLane.limits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `count`, `tolerance`, `grazing`, `gap`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyTree.ts#IAutoMovieHumanBodyTree.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

The realized subtree as the calibration publishes it.

## @evidence contracts/development/design.md#principled-representation `chains`: Every part's chain, then every blend's. `body`: The realized body of trimmed faces sharing their boundaries, as the calibration publishes it (`IAutoMovieHumanBodyCalibration.bodies`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyTree.realize. Also types AutoMovieHumanBodyLane.realized.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `chains`, `body`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyTree.ts#IAutoMovieHumanBodyTree.ContextRecords

## @evidence contracts/development/common.md#meaningful-documentation

Retain only each builder's last actual original, including failed replacements.

## @evidence contracts/development/design.md#principled-representation

Retain only each builder's last actual original, including failed replacements. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyTree.ContextRecords is the canonical exchange used by AutoMovieHumanBodyTree.context.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyTree.context for retain only each builder's last actual original, including failed replacements.
