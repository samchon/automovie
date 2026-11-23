# src/human/generation/trunk/IAutoMovieHumanTrunkSectionFamily.ts#IAutoMovieHumanTrunkSectionFamily.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

One named measurement plane and its caller-owned four-support source.

## @evidence contracts/development/design.md#principled-representation `site`: Original anatomical site name, independent of output sampling. `y`: World-Y station in calibration millimetres. `origin`: Section origin in world X/Z, calibration millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkSectionFamily.define, AutoMovieHumanTrunkSectionFamily.at. Read by AutoMovieHumanTrunkLegs.trial, AutoMovieHumanTrunkSectionFamily.define, AutoMovieHumanTrunkSectionFamily.at. Also types AutoMovieHumanTrunkBuild.sections, AutoMovieHumanTrunkBuild.plane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `site`, `y`, `origin`, `back`, `box`, `fullness`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkSectionFamily.ts#IAutoMovieHumanTrunkSectionFamily.IFullness

## @evidence contracts/development/common.md#meaningful-documentation

The actual independent scalar constraint result, including its unchanged admission failures.

## @evidence contracts/development/design.md#principled-representation `fullness`: Null preserves a failed original section rather than selecting another shoulder. `diagnostics`: Original section-solve diagnostics, with the same source/site producer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanTrunkSectionFamily.resolved, AutoMovieHumanTrunkViewPart.solved.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `fullness`, `diagnostics`; callers supply the complete record.
