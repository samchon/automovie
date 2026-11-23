# src/analysis/IAutoMovieSkyIlluminance.ts#IAutoMovieSkyIlluminance

## @evidence contracts/development/common.md#meaningful-documentation

Names the operation and its two consumers, the daylight study and the meter.

## @evidence contracts/development/design.md#principled-representation

A namespace holding the input of `autoMovieSkyIlluminance`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns it; the daylight study and the illuminance meter both build it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present.

# src/analysis/IAutoMovieSkyIlluminance.ts#IAutoMovieSkyIlluminance.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States the `DHI × V` model, what `V` counts, and each field's unit and premise.

## @evidence contracts/development/design.md#principled-representation

One plane orientation and one sky, the inputs the visible-sky fraction depends on; points are supplied later because the directions are shared across them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every field is read; the ground's up decides the horizon and the solids block rays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None present.
