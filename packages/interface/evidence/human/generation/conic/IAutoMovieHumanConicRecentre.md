# src/human/generation/conic/IAutoMovieHumanConicRecentre.ts#IAutoMovieHumanConicRecentre

## @evidence contracts/development/common.md#meaningful-documentation

Conic section origins and fields used to relocate sections within their course planes.

## @evidence contracts/development/design.md#principled-representation

The types share millimetre stations and a declared layout or a pair of chart offsets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanConicRecentre and AutoMovieHumanConicLoft exchange these records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The course remains responsible for its own frame and pose.

# src/human/generation/conic/IAutoMovieHumanConicRecentre.ts#IAutoMovieHumanConicRecentre.ILine

## @evidence contracts/development/design.md#principled-representation

One `u` and one `v` shift per knot, the same support as the family's fields, so the line and the fields share one interpolation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No out-of-plane component: the section planes are never changed.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and unit.

# src/human/generation/conic/IAutoMovieHumanConicRecentre.ts#IAutoMovieHumanConicRecentre.IFields

## @evidence contracts/development/common.md#meaningful-documentation

The section fields passed to an origin change.

## @evidence contracts/development/design.md#principled-representation

A shared station vector in millimetres indexes every column. The layout identifies the units and meaning of each field row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanConicRecentre consumes the original fields and provides remapped fields in the same layout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Equal row lengths and stable input data over evaluation stay the caller's responsibility.
