# src/construction/AutoMovieLoftSectionLegacyRows.ts#AutoMovieLoftSectionLegacyRows

## @evidence contracts/development/common.md#meaningful-documentation

The tuple fixes the order of the three endpoint functions and the comment gives the required coefficient width and the displacement unit.

## @evidence contracts/development/design.md#principled-representation

LoftSectionLegacy.extend checks all three widths and advances each coefficient by its quadratic in station before evaluating phase.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tuple supplies the same coefficient layout as ordinary legacy sections. The extension owns generated rows and their derivative order.
