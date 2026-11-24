# src/human/generation/trunk/IAutoMovieHumanTrunkSectionFamily.ts#IAutoMovieHumanTrunkSectionFamily

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the AutoMovieHumanTrunkSectionFamily exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.

## @evidence contracts/development/design.md#principled-representation

A type-only namespace groups IPlane, IFullness. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these declarations used by Human's AutoMovieHumanTrunkSectionFamily; Human retains the computation and source preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace only qualifies the IPlane, IFullness contracts and adds no alternate implementation, optional mode or runtime state.

# src/human/generation/trunk/IAutoMovieHumanTrunkSectionFamily.ts#IAutoMovieHumanTrunkSectionFamily.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

One named measurement plane and its caller-owned four-support source.

## @evidence contracts/development/design.md#principled-representation `site`: Original anatomical site name, independent of output sampling. `y`: World-Y station in calibration millimetres. `origin`: Section origin in world X/Z, calibration millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `AutoMovieHumanTrunkSectionFamily.at`, `define` and `prepare`. The trunk build passes the prepared family to both trunk definitions and every coupled leg trial. Each trial reads its own candidate shoulder on the original support box.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `site`, `y`, `origin`, `back`, `box`, `fullness`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkSectionFamily.ts#IAutoMovieHumanTrunkSectionFamily.IFullness

## @evidence contracts/development/common.md#meaningful-documentation

The actual independent scalar constraint result, including its unchanged admission failures.

## @evidence contracts/development/design.md#principled-representation `fullness`: Null preserves a failed original section rather than selecting another shoulder. `diagnostics`: Original section-solve diagnostics, with the same source/site producer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Types the independent tape result prepared for the trunk passes and read by `AutoMovieHumanTrunkViewPart`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `fullness`, `diagnostics`; callers supply the complete record.
