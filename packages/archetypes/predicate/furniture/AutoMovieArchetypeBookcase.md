# src/furniture/AutoMovieArchetypeBookcase.ts#AutoMovieArchetypeBookcase.create

## @evidence contracts/development/common.md#meaningful-documentation

States physical size, open supports, unit default and mass midpoint.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates the public call into open storage construction. Five shelf colliders and their support frames share each computed interior elevation.

## @evidence contracts/development/implementation.md#efficient-algorithms

The builder emits five shelves from one geometry draw and fixed shell dimensions.

# src/furniture/AutoMovieArchetypeBookcase.ts#AutoMovieArchetypeBookcase.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States body extents in metres and mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

The model reports the three BILLY body extents and an admissible empty mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only dimensions used by the open form appear in this route.

# src/furniture/AutoMovieArchetypeBookcase.ts#AutoMovieArchetypeBookcase.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes the side and top surfaces from the five stack contacts.

## @evidence contracts/development/design.md#principled-representation

Shelf IDs increase with their height and their extents lie within the side panels.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The vocabulary is restricted to contacts built by an open bookcase.

# src/furniture/AutoMovieArchetypeBookcase.ts#AutoMovieArchetypeBookcase.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Lists the scene ID and fixed settings and points to the authoritative band row.

## @evidence contracts/development/design.md#principled-representation

The settings reuse the saved storage dimension names and units. The open recipe owns its applicable bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A `Pick` retains the existing shared field meanings while omitting selector, catalogue and mechanism fields.
