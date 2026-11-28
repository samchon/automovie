# src/props/AutoMovieArchetypeBook.ts#AutoMovieArchetypeBook.create

## @evidence contracts/development/common.md#meaningful-documentation

Provides the floor pose, 180-degree independent controls, moving contacts and seedless dimensions.

## @evidence contracts/development/implementation.md#principled-implementation

One front cover and a separate leaf rotate about individual Z axes at the spine. Each articulated edge rides its own control.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds the book and its contacts in a single construction from one admitted dimension draw.

# src/props/AutoMovieArchetypeBook.ts#AutoMovieArchetypeBook.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the fixed spine and each cover and leaf control with its own riding contacts.

## @evidence contracts/development/design.md#principled-representation

The spine contact is fixed. The front cover carries the surface and cover edge, while the leaf carries its own edge.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each key corresponds to one authored contact or control on the closed book.

# src/props/AutoMovieArchetypeBook.ts#AutoMovieArchetypeBook.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Locates closed size on the three local axes and identifies mass in kilograms.

## @evidence contracts/development/design.md#principled-representation

Width spans X, length spans Z and thickness measures the closed stack along Y.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The named wrapper exposes the four measurements read by the book builder.
