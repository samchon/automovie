# src/human/generation/foot/IAutoMovieHumanFootFrame.ts#IAutoMovieHumanFootFrame.IDimensions

## @evidence contracts/development/common.md#meaningful-documentation

A foot's dimensions in calibration millimetres.

## @evidence contracts/development/design.md#principled-representation `length`: Back of the heel to the tip of the longest toe. `breadth`: Greatest breadth across the metatarsal heads. `ankle`: Height of the lateral malleolus.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootFrame.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `length`, `breadth`, `ankle`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootFrame.ts#IAutoMovieHumanFootFrame.IFrame

## @evidence contracts/development/common.md#meaningful-documentation

A foot's frame: its scales and the map from normalised coordinates.

## @evidence contracts/development/design.md#principled-representation `L`: Foot length, mm. `B`: Foot breadth, mm. `H`: Lateral malleolus height, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootFrame.of. Read by AutoMovieHumanFootAchilles.knots, AutoMovieHumanFootColumn.knots, AutoMovieHumanFootColumn.centre. Also types AutoMovieHumanFootConstruction.k, AutoMovieHumanFootBones.frame.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `L`, `B`, `H`, `ring`, `at`, `lateral`; callers supply the complete record.
