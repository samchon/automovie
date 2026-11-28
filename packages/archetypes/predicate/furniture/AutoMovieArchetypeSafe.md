# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.create

## @evidence contracts/development/common.md#meaningful-documentation

States the floor frame, fixed dimensions and resting hinge, and both admission axes.

## @evidence contracts/development/implementation.md#principled-implementation

The closed door fills the catalogue opening between symmetric stiles and rails. The selected edge locates the resting hinge. Its frame references the door and has no authored travel.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw uses fixed endpoints and emits a bounded body, two stiles, two rails and one door and hinge frame.

# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

States the one resting hinge frame and absence of a movement range.

## @evidence contracts/development/design.md#principled-representation

The contact is a hinge frame on the selected side of the solid door with exactly that door assigned to it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The type exposes the door's resting placement for contact lookup.

# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

States the distinctions between overall envelope, clear opening and slab thickness.

## @evidence contracts/development/design.md#principled-representation

The outside dimensions size the closed body, clear dimensions partition its front and slab thickness determines the depth of that front layer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The seven fields cover the measured casing and mass used by geometry and its reference frame.

# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies metres for dimensions and kilograms for body mass.

# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States optional scene ID, the hinge choice and the equal-endpoint geometry.

## @evidence contracts/development/design.md#principled-representation

The hinge is admitted from two names before assigning the side. Matching fixed measurements reuse the catalogue bands without changing the chassis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One hinge option and scene ID carry model choices while the fixed dimension types stay compatible with drawing.

# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.IParams.hinge

## @evidence contracts/development/common.md#meaningful-documentation

Defines left and right axes and the right-hand default.

# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the scene ID and `safe` fallback.

# src/furniture/AutoMovieArchetypeSafe.ts#AutoMovieArchetypeSafe.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Names the measured dimensions and mass from the recorded safe model.
