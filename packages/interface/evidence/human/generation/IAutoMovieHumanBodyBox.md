# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.Level

## @evidence contracts/development/common.md#meaningful-documentation

A trunk level whose breadth, depth and girth are all published.

## @evidence contracts/development/design.md#principled-representation

A trunk level whose breadth, depth and girth are all published. The closed alternatives are "chest", "waist", "hip".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyBox.LEVELS, AutoMovieHumanBodyBox.FIELDS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyAnatomy.box, AutoMovieHumanBodyBox.LEVELS, AutoMovieHumanBodyBox.FIELDS, AutoMovieHumanBodyBox.of for a trunk level whose breadth, depth and girth are all published.

# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.IFields

## @evidence contracts/development/common.md#meaningful-documentation

One level's three measure names.

## @evidence contracts/development/design.md#principled-representation `breadth`: Its breadth, the front view's outline. `depth`: Its depth, the side view's outline. `girth`: Its tape girth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBodyAnatomy.fields, AutoMovieHumanBodyBox.FIELDS.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `depth`, `girth`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.IBox

## @evidence contracts/development/common.md#meaningful-documentation

One level's box and the girth the section takes in it, mm.

## @evidence contracts/development/design.md#principled-representation `level`: The level. `breadth`: Breadth, mm. `depth`: Depth, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBodyBox.of. Also types AutoMovieHumanTrunkViews.boxes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `level`, `breadth`, `depth`, `girth`, `rhombus`, `box`, `tape`, `fullness`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.RangeResult

## @evidence contracts/development/common.md#meaningful-documentation

The range of taut-tape perimeters of a convex section touching all four sides of a box.

## @evidence contracts/development/design.md#principled-representation

The range of taut-tape perimeters of a convex section touching all four sides of a box. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyBox.RangeResult is the canonical exchange used by AutoMovieHumanBodyBox.range.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyBox.range for the range of taut-tape perimeters of a convex section touching all four sides of a box.

# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.IPlaceSupplied

## @evidence contracts/development/common.md#meaningful-documentation

A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.

## @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres. `girth`: Closed section tape length, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyBox.IPlaceSupplied is the canonical exchange used by AutoMovieHumanBodyBox.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `depth`, `girth`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.PlaceBreadth

## @evidence contracts/development/common.md#meaningful-documentation

A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.

## @evidence contracts/development/design.md#principled-representation

A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction. The callable takes girth and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyBox.PlaceBreadth is the canonical exchange used by AutoMovieHumanBodyBox.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyBox.place for a level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.

# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.PlaceDepth

## @evidence contracts/development/common.md#meaningful-documentation

A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.

## @evidence contracts/development/design.md#principled-representation

A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction. The callable takes girth and returns number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyBox.PlaceDepth is the canonical exchange used by AutoMovieHumanBodyBox.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanBodyBox.place for a level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.

# src/human/generation/IAutoMovieHumanBodyBox.ts#IAutoMovieHumanBodyBox.IPlaceResult

## @evidence contracts/development/common.md#meaningful-documentation

A level's three measures with every default placed inside the range the supplied ones leave, so a defaulted measure is never the cause of a contradiction.

## @evidence contracts/development/design.md#principled-representation `breadth`: Full transverse section breadth, millimetres. `depth`: Full front-to-back section depth, millimetres. `girth`: Closed section tape length, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBodyBox.IPlaceResult is the canonical exchange used by AutoMovieHumanBodyBox.place.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `depth`, `girth`; callers supply the complete record.
