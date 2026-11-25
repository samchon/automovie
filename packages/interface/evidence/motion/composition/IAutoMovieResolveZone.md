# src/motion/composition/IAutoMovieResolveZone.ts#IAutoMovieResolveZone.IWhere

## @evidence contracts/development/common.md#meaningful-documentation

Defines landmark selection or polar floor offset with radian bearing and unitless radial share.

## @evidence contracts/development/design.md#principled-representation

resolveAutoMovieZone checks share in [0,1] and known landmark ids; callers supply finite bearing and valid zone geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The zone resolver consumes this selector and returns a fresh world position at the zone centre height for polar selection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union separates a named point from a polar fraction instead of combining unrelated optional fields.
