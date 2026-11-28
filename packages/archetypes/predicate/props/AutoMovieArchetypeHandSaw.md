# src/props/AutoMovieArchetypeHandSaw.ts#AutoMovieArchetypeHandSaw.create

## @evidence contracts/development/common.md#meaningful-documentation

Locates the transverse heel grip, its two solid connections and the full-length tooth ledge.

## @evidence contracts/development/implementation.md#principled-implementation

The two heel cheeks overlap the transverse handle and the fixed blade root inside the original saw extents. The tooth ledge retains its position and direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Draws one size record and builds the two heel connections directly from the existing grip and blade geometry.

# src/props/AutoMovieArchetypeHandSaw.ts#AutoMovieArchetypeHandSaw.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Power `grip` across the heel and positive-Z tooth ledge as `face`.

## @evidence contracts/development/design.md#principled-representation

The grip follows the authored handle direction. The working edge lies on the blade's positive-Z side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two names cover separate grip and working roles on this prop.

# src/props/AutoMovieArchetypeHandSaw.ts#AutoMovieArchetypeHandSaw.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Overall and blade lengths along Y, and grip diameter in metres. Mass is in kilograms.

## @evidence contracts/development/design.md#principled-representation

Overall and blade lengths place the heel and blade tip separately. The grip diameter sets the handle aperture.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the four quantities represented by the saw's bands.
