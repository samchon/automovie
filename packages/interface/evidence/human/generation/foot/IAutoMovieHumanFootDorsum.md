# src/human/generation/foot/IAutoMovieHumanFootDorsum.ts#IAutoMovieHumanFootDorsum.IInput

## @evidence contracts/development/common.md#meaningful-documentation

The original constant-height foot chart and its shared ankle contact.

## @evidence contracts/development/design.md#principled-representation `part`: Original dorsal knots and domain, calibration mm; no neighbouring part is acquired. `heel`: Pternion plan position and foot-along direction. `along`: Unit foot-along direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootDorsum.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `part`, `heel`, `along`, `length`, `height`, `arch`, `ankle`; callers supply the complete record.
