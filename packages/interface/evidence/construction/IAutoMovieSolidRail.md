# src/construction/IAutoMovieSolidRail.ts#IAutoMovieSolidRail.IRail

## @evidence contracts/development/design.md#principled-representation

Links both trimmed endpoints to one contact point and its kept-side chart directions, with host-face identity after atlas traversal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A plain record exposes coordinates, positions and directions needed by ribbons and clipping without another surface model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not certify normal-section convergence or domain/kept-region membership; sigma uses a positive tie when a square direction's station component is zero.

## @evidence contracts/development/common.md#meaningful-documentation

Gives mm positions, chart coordinates, phase/mode meaning and where unit-world-speed directions are evaluated.

# src/construction/IAutoMovieSolidRail.ts#IAutoMovieSolidRail.Keep

## @evidence contracts/development/design.md#principled-representation

The closed choice determines the part offset's sign against the host's outward normal.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One literal union shares the same side convention across merge/diff and rail evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Selects a side without inferring it from a fixture or a sampled mesh.

## @evidence contracts/development/common.md#meaningful-documentation

Names which solid's kept side changes and the merge/diff mapping.

# src/construction/IAutoMovieSolidRail.ts#IAutoMovieSolidRail.Mode

## @evidence contracts/development/design.md#principled-representation

Station mode preserves a phase column; square mode uses the inverse first fundamental form to define a transverse world direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed discriminator selects only the part strategy; the host keeps its metric-square strategy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed station width is accepted only in station mode, without silently converting it to a chord.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes chart-station and world-square offset semantics.

# src/construction/IAutoMovieSolidRail.ts#IAutoMovieSolidRail.IExplanation

## @evidence contracts/development/design.md#principled-representation

The rail and a nullable refusal partition success from the failed premise; quantities are the solve's own numbers keyed by what they measure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record reports what `at` already computes, so a join can name a refusal without a second solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It changes no solve, threshold or result: `at` returns exactly its rail.

## @evidence contracts/development/common.md#meaningful-documentation

States the units of the recorded quantities: mm, chart units and dimensionless dot products.

# src/construction/IAutoMovieSolidRail.ts#IAutoMovieSolidRail.IAtPartWidth

## @evidence contracts/development/design.md#principled-representation

A number/object union distinguishes physical chord distance from absolute chart station.

## @evidence contracts/development/design.md#minimal-and-owned-surface

SolidRail.at forwards the unchanged request to explain.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

explain rejects fixed stations in square mode and wrong-sided stations; valid finite source charts remain caller/domain-reader premises.

## @evidence contracts/development/common.md#meaningful-documentation

Gives both alternatives' units and the mode/kept-side condition.

# src/construction/IAutoMovieSolidRail.ts#IAutoMovieSolidRail.IToward

## @evidence contracts/development/design.md#principled-representation

A side of a curve in a surface is one of two unit directions square to it; a world vector with a nonzero product with them names one, at any angle between the two surfaces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One vector per rail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A vector square to both candidate directions names no side and the rail is refused, never guessed.

## @evidence contracts/development/common.md#meaningful-documentation

States why the normals fail at a tangential contact, who supplies the vectors and how each rail reads its own.
