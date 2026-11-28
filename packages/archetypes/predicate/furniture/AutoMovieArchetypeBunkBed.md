# src/furniture/AutoMovieArchetypeBunkBed.ts#AutoMovieArchetypeBunkBed.create

## @evidence contracts/development/common.md#meaningful-documentation

States both physical mattress sizes, unseeded top heights and the continuous guard side.

## @evidence contracts/development/implementation.md#principled-implementation

The lower support height and gap determine the two decks. Both use the same thickness. The upper guard is sized against the maximum admitted mattress thickness and the continuous guard frame follows the left body rod's centreline.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw gives both mattress shapes and support heights. The builder emits fixed posts, two bases, two mattresses, two guards and the associated frames.

# src/furniture/AutoMovieArchetypeBunkBed.ts#AutoMovieArchetypeBunkBed.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines the distinction between overall frame and mattress dimensions, deck support heights and mass.

## @evidence contracts/development/design.md#principled-representation

Clearance locates the lower support and gap offsets the upper. Thickness adds to each deck to locate its surface. Overall height sizes the posts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Available fields describe the two surfaces and outer built structure directly.

# src/furniture/AutoMovieArchetypeBunkBed.ts#AutoMovieArchetypeBunkBed.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the two mattress planes, lower side seats and one continuous upper guard.

## @evidence contracts/development/design.md#principled-representation

Both `surface` and `upper` use the physical mattress tops. The lower edge seats follow the lower mattress, and the named guard frame follows the solid continuous bar.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The five names match the emitted surfaces, side seats and one fixed guard bar.

# src/furniture/AutoMovieArchetypeBunkBed.ts#AutoMovieArchetypeBunkBed.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States the scene ID and the fixed band inputs for the two-level model.

## @evidence contracts/development/design.md#principled-representation

Uses the shared bed unit definitions with only the applicable outer and mattress fields. The selected band row keeps thickness bounded below the fixed guard.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Reuses the saved dimensions with only the bunk's own options.
