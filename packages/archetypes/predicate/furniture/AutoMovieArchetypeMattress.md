# src/furniture/AutoMovieArchetypeMattress.ts#AutoMovieArchetypeMattress.create

## @evidence contracts/development/common.md#meaningful-documentation

States the floor rest, catalogue size, thickness default, returned contacts and refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The named or drawn UK footprint supplies width and length together. One box rests on Y zero and its thickness determines the three contact heights.

## @evidence contracts/development/implementation.md#efficient-algorithms

One catalogue selection and dimension draw produce one box and three frames.

# src/furniture/AutoMovieArchetypeMattress.ts#AutoMovieArchetypeMattress.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the catalogue footprint from the thickness and mass bands.

## @evidence contracts/development/design.md#principled-representation

The catalogue gives the footprint in metres. The thickness band gives top height since the body lies on the floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses the values needed to stage a loose mattress, including its independently assigned mass.

# src/furniture/AutoMovieArchetypeMattress.ts#AutoMovieArchetypeMattress.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the mattress top and outward seats along the long edges.

## @evidence contracts/development/design.md#principled-representation

The upward frame and side seats locate the same physical box top. Opposed X positions put the seats on different sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three names describe the floor mattress's contact geometry.

# src/furniture/AutoMovieArchetypeMattress.ts#AutoMovieArchetypeMattress.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the catalogue size and applicable author-controlled fields.

## @evidence contracts/development/design.md#principled-representation

The selected size owns both footprint dimensions. Thickness and mass can use finite fixed values in their bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The options keep one size selector and the two available physical adjustments.
