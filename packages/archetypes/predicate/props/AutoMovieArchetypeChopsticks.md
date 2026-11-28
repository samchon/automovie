# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.create

## @evidence contracts/development/common.md#meaningful-documentation

Records the equal wooden rods, stationary grip, closing travel and common tip contact.

## @evidence contracts/development/implementation.md#principled-implementation

Two equal rods place the support fulcrum on the moving rod's axis. At full travel the physical rods reach the recorded tip socket together.

## @evidence contracts/development/implementation.md#efficient-algorithms

Computes the rest axis and hinge from a closed contact in one construction and uses the existing rigid projection for posing.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the stable default scene ID for the fixed pair.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.ISize.diameter

## @evidence contracts/development/common.md#meaningful-documentation

Defines the diameter in metres for both rods.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.ISize.length

## @evidence contracts/development/common.md#meaningful-documentation

Defines equal lengths in metres for the fixed and moving rods.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.ISize.mass

## @evidence contracts/development/common.md#meaningful-documentation

States kilograms for the assembled pair.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.ISize.spread

## @evidence contracts/development/common.md#meaningful-documentation

States the angular unit and measures the admitted upper-stick travel from rest toward closed.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the stationary grip, moving hinge and fixed socket at the meeting point.

## @evidence contracts/development/design.md#principled-representation

The upper rod turns about its hinge, while fixed reference points mark the hand hold and where both tips meet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three names provide the hand, articulation and object-contact roles used when staging the prop.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Names the length and diameter of each rod and the mass of the pair, with units.

## @evidence contracts/development/design.md#principled-representation

A single length and diameter apply to both rods and the mass applies to the combination.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The runtime publishes the three physical size and weight keys. Angular travel belongs to its hinge.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.IParams

## @evidence contracts/development/common.md#meaningful-documentation

States that the caller supplies only the scene ID.

## @evidence contracts/development/design.md#principled-representation

The fixed physical measurements and travel come from the recipe, so callers distinguish jointed props by ID.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional property is sufficient to instantiate the named pair in a scene.

# src/props/AutoMovieArchetypeChopsticks.ts#AutoMovieArchetypeChopsticks.ISize

## @evidence contracts/development/common.md#meaningful-documentation

States the four fixed recipe measurements and how they apply to the pair.

## @evidence contracts/development/design.md#principled-representation

Dimensions and mass describe rods of equal size, with angular travel representing the upper stick's one independent control.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Groups three physical measurements and the one angular value used to build the fixed pair.
