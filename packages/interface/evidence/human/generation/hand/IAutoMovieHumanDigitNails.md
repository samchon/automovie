# src/human/generation/hand/IAutoMovieHumanDigitNails.ts#IAutoMovieHumanDigitNails.IRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the anatomical lookup and the measurements or estimates supplied to the fit.

## @evidence contracts/development/design.md#principled-representation

`IAutoMovieHumanNail.IProportions` specifies unitless ratios and millimetres. Runtime lookup establishes whether a caller's anatomy label has a row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The generic digit nail reader consumes the row and carries it in the output for construction and comparison.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Anatomical lookup is independent of figure and rig naming. Proportion units come from the existing nail law.

# src/human/generation/hand/IAutoMovieHumanDigitNails.ts#IAutoMovieHumanDigitNails.IDigit

## @evidence contracts/development/common.md#meaningful-documentation

Documents the placed digit, optional separate anatomy label and material-to-physical station mapping.

## @evidence contracts/development/design.md#principled-representation

The conic family owns its calibration-millimetre chart. The optional mapping returns physical millimetres on its placed course. `createFrom` establishes agreement between names and the distal pole at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The nail reader accepts the caller's named digit source. A separate anatomy label permits both sides to select the same anatomical proportions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The conic and station map types are shared with the frame and loft owners. No specific figure or rig supplies their meaning.

# src/human/generation/hand/IAutoMovieHumanDigitNails.ts#IAutoMovieHumanDigitNails.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

Describes the chart bounds, aperture and clipping check of the original fit.

## @evidence contracts/development/design.md#principled-representation

Stations are original chart millimetres. Clipping and its limit are physical millimetres. The clipping point is in the distal joint frame. The producer derives the admission flag from the clipping measurement and limit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Candidate assessment reads the same fitted support and clipping that construction used. The original nail diagnostic owns the clipping location and net label.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record carries the actual original support and requested clipping. Closure and contact have their own geometric checks.

# src/human/generation/hand/IAutoMovieHumanDigitNails.ts#IAutoMovieHumanDigitNails.IMade

## @evidence contracts/development/common.md#meaningful-documentation

Documents one nail and the source and support required to reuse its fit.

## @evidence contracts/development/design.md#principled-representation

The result binds the original view part in world millimetres to the anatomy row, nail and measured support. The runtime reader ensures the original and family share identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The generic reader returns the original for relief attachment, the fitted nail for its fold and plate, and the support receipt for candidate assessment.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The original is available directly. No named body fixture or intermediate mesh substitutes for its field.
