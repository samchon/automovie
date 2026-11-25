# src/core/AutoMovieArchetypeMass.ts#AutoMovieArchetypeMass.IInertia

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

The six independent components of the symmetric inertia tensor about the centre of mass in the model's axes, kg m squared; symmetry is carried by storing each product once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; computed by `of` and read by `about` and by tests of mass properties.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; no redundant lower triangle.

# src/core/AutoMovieArchetypeMass.ts#AutoMovieArchetypeMass.IProperties

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Total mass in kilograms, the centre of mass in the model's space in metres and the inertia about it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; computed once per archetype by `of` and published as `AutoMovieArchetype.properties`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None; all three members are required.

# src/core/AutoMovieArchetypeMass.ts#AutoMovieArchetypeMass.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' units, the default density and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

ArchetypeMassLocal shares primitive closed forms or prepared cell volume, centroid, principal moments and principal-to-part rotation. Cell principal axes compose with the part's rigid rotation; primitives keep their existing operation order. Weights normalize before reduction; coordinate-scaled means avoid overflowing mass products, and direct transverse parallel-axis terms avoid squared-distance subtraction. Exceptional allocated masses remain factored with geometric terms until the final contribution rounds. Unit rotations and scale remain the builder's premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the masses and centre, one for the tensor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid or unrepresentable numeric data are refused rather than capped or replaced. Relative weights, primitive local properties and final tensor must be representable; an implicit positive volume-density product refuses zero or inexact subnormal representation before normalization, while exact subnormal weights and explicit authored zero shares remain supported; no density or mass is invented. Overlapping solids still count twice; producers keep overlaps to joints.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local-solid record supplies weight, centroid and principal data; declared cell integration is prepared once by the builder and reused here and in parts. One normalized total serves all part masses. The weighted-product reader retains existing ordinary and exceptional arithmetic, and both reductions share local/weight admission.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeMass.ts#AutoMovieArchetypeMass.parts

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the zero.

## @evidence contracts/development/implementation.md#principled-implementation

Uses of's same primitive/cell local and weight owners. An inventory with no supported solids has only zero part masses; of still refuses constructing a positive-mass body without solids. Otherwise weights normalize by their maximum, and allocation retains the existing exact exceptional quotient fallback for unrepresentable intermediate products.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the weights, one for the masses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid total mass is refused even for a no-solid inventory. Solid-bearing inputs still refuse invalid density/share and all-zero solid weights; implicit volume-density products also require normal or exact positive subnormal local representation, preserving exact MIN_VALUE products and explicitly authored zero shares; only the geometry's absence of solid support yields zero part masses, never a failed-normalization fallback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the parts.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `of`'s volume rule.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeMass.ts#AutoMovieArchetypeMass.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's unit or meaning.

## @evidence contracts/development/design.md#principled-representation

Mass properties in the body's own space and a rigid placement in metres with a unit quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; the input of `combine`, written by `AutoMovieArchetypeAssembly`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The placement carries no scale, which mass properties cannot follow.

# src/core/AutoMovieArchetypeMass.ts#AutoMovieArchetypeMass.combine

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' spaces, the result and the failure.

## @evidence contracts/development/implementation.md#principled-implementation

Coordinate-scaled weighted means avoid m*x overflow. Tensors rotate as R I R transposed; direct transverse squared offsets and negative cross-products apply the parallel-axis theorem. Source finite positive masses, finite centres/tensors and nonnegative axis moments are admitted; physically consistent tensors and unit rigid placements remain caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the mass and centre, one for the tensor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bodies that overlap are counted twice, as `of` counts overlapping parts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bodies.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computed once per assembly.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/core/AutoMovieArchetypeMass.ts#AutoMovieArchetypeMass.about

## @evidence contracts/development/common.md#meaningful-documentation

States the line's inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Largest-component direction scaling admits subnormal and very large finite directions. The central tensor quadratic form adds m*|offset cross unitDirection|², the perpendicular distance without inf-inf projection subtraction. Exceptional products preserve a small mass times a large squared lever; non-finite or negative results are refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One quadratic form and one distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid inputs and unrepresentable moments are refused, without a size cap, direction epsilon or zero-axis fallback.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
