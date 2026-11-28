# src/props/AutoMovieArchetypeScenicBasket.ts#AutoMovieArchetypeScenicBasket.create

## @evidence contracts/development/common.md#meaningful-documentation

States which shape has a lid or cavity, the support it exposes and the actual midpoint dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

The coil uses three convex sections with a narrowed lid, and the fish form surrounds a lower floor with flared panels. Both derive a footprint contained in its supporting body.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws the selected size once, builds the corresponding fixed-part recipe and supplies one supported rectangle.

# src/props/AutoMovieArchetypeScenicBasket.ts#AutoMovieArchetypeScenicBasket.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names the two allowed basket shapes and their visible layouts.

## @evidence contracts/development/design.md#principled-representation

A single selector determines whether the top is closed by a lid or opens above a lower supported floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two labels match the two bodies built by this factory.

# src/props/AutoMovieArchetypeScenicBasket.ts#AutoMovieArchetypeScenicBasket.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines the outside axes and unit of mass.

## @evidence contracts/development/design.md#principled-representation

Outside dimensions account for the widest silhouette rather than the smaller footprint inside a floor or lid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reports the four physical quantities used by the construction and part mass.

# src/props/AutoMovieArchetypeScenicBasket.ts#AutoMovieArchetypeScenicBasket.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the correct stacking site by basket kind.

## @evidence contracts/development/design.md#principled-representation

The lid and bottom are at different heights, and each rectangular support stays within its actual polygon.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union includes the only two sites that may be returned, one per shape.

# src/props/AutoMovieArchetypeScenicBasket.ts#AutoMovieArchetypeScenicBasket.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the required kind and applicable optional body settings.

## @evidence contracts/development/design.md#principled-representation

A kind chooses its physical bands and the corresponding basket form.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses one narrow recipe across the two shapes with a required discriminant.

# src/props/AutoMovieArchetypeScenicBasket.ts#AutoMovieArchetypeScenicBasket.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the form and support site selected by the kind.

# src/props/AutoMovieArchetypeScenicBasket.ts#AutoMovieArchetypeScenicBasket.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

States the order of the two admitted shapes.
