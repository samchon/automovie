# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.ISection

## @evidence contracts/development/design.md#principled-representation

A closed curve by the child's own phase with its tangent, and the child's axis, are what the forks and the bisector are computed from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A name, one reader and one direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader is the child's own curve; no polygon stands in for it past the search for crossings.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit and direction.

# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.IPiece

## @evidence contracts/development/design.md#principled-representation

The outline is the sections' own arcs joined at the forks, so a piece is a section and a phase interval in the direction the outline runs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A section index and two phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The piece names the child's own curve; no fitted curve stands in for it.

## @evidence contracts/development/common.md#meaningful-documentation

States the direction and the unit.

# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.IOutline

## @evidence contracts/development/design.md#principled-representation

The union outline of closed curves that cross pairwise is their outer arcs in order; a host family that adopts it for its last section ends on the children's own curves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pieces and one reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reader evaluates the sections themselves; nothing is resampled or smoothed at a fork.

## @evidence contracts/development/common.md#meaningful-documentation

States the pieces' order, the parameter and the fork's corner.

# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.IInput

## @evidence contracts/development/design.md#principled-representation

The end plane and the sections in the children's order are the whole composition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields; the sample count is the caller's sampling input.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit and order.

# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.IFork

## @evidence contracts/development/design.md#principled-representation

The crossing point with its phase on each of the two curves, so each child reads its own lobe from it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A point and two phases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point is the lower child's curve at its phase; the upper child's curve passes through it to the solver's rounding.

## @evidence contracts/development/common.md#meaningful-documentation

States the owner of the point and the phases' order.

# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.ISeam

## @evidence contracts/development/design.md#principled-representation

Two forks and the plane through them that holds the axes' bisector.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The forks, the plane's normal and the bisector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values derived from the two sections alone.

## @evidence contracts/development/common.md#meaningful-documentation

States the forks' order and both directions' orientation.

# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.IComposition

## @evidence contracts/development/design.md#principled-representation

The seams between neighbours and each child's lobes are the composed outline's whole structure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three arrays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values derived from the sections alone.

## @evidence contracts/development/common.md#meaningful-documentation

States each array's indexing and unit.

# src/construction/IAutoMovieConstructionComposedEnd.ts#IAutoMovieConstructionComposedEnd.IOutlineDistanceSite

## @evidence contracts/development/design.md#principled-representation

One retained piece, its local share, its two fork identities, and whether this site settled.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The site retains no new curve or evaluator.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A sampled minimum remains distinguishable from a settled site.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the piece's index, local direction and shared fork identities.
