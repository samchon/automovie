# src/architecture/AutoMovieSurfacePatternGenerator.ts#AutoMovieSurfacePatternGenerator

## @evidence contracts/development/design.md#principled-representation

A caller-supplied pure function from one lattice cell to module candidates; the engine enumerates cells over the region bounds widened by `reach` and divided by `period`, so every cell whose modules could touch the region is called exactly once, and the result is deterministic exactly when the function is.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A plain function type is the smallest seam that lets any bond be authored without an engine-side preset, and the cell argument carries only the lattice index, origin and period a module program needs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Purity is a premise the engine cannot check, so an impure generator would break determinism silently, as the documentation states; what the engine does check is each candidate's id, finiteness, size and reach, throwing on the first violation.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why the program is the author's, the purity premise and its consequence, the call order and cell bound, and every check applied to the result; each cell member states its unit and that the period is a fresh copy.
