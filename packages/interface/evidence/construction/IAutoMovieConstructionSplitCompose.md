# src/construction/IAutoMovieConstructionSplitCompose.ts#IAutoMovieConstructionSplitCompose.IBasis

## @evidence contracts/development/design.md#principled-representation

An origin and three unit axes carry a point or a direction written in the frame into the kernel's coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four vectors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only.

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

# src/construction/IAutoMovieConstructionSplitCompose.ts#IAutoMovieConstructionSplitCompose.IChild

## @evidence contracts/development/design.md#principled-representation

The child's skin, its kept side, its own stations and its facing end's frame are what a cut of it needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values only; the realization admits the face before it builds this record.

## @evidence contracts/development/common.md#meaningful-documentation

States each field's unit.

# src/construction/IAutoMovieConstructionSplitCompose.ts#IAutoMovieConstructionSplitCompose.IDerived

## @evidence contracts/development/design.md#principled-representation

The seams' host phases, their planes' headings and the children's rails are exactly the members the split otherwise reads from its declaration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values derived from the children's skins and the host's ring alone.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's indexing and unit.

# src/construction/IAutoMovieConstructionSplitCompose.ts#IAutoMovieConstructionSplitCompose.ISection

## @evidence contracts/development/design.md#principled-representation

Keeps the surface, physical plane, cut and actual section together.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No alternate ring, interpolated source or parent fork coordinate belongs to the child datum.

## @evidence contracts/development/common.md#meaningful-documentation

States each member's source and that the plane is in the source's world millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by `AutoMovieConstructionSplitCompose.section` and accepted by `derive` as a prepared section. The child, plane and count are what `derive` compares before it borrows the cut and the section.

# src/construction/IAutoMovieConstructionSplitCompose.ts#IAutoMovieConstructionSplitCompose.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States each member's source: the declaration, the host's surface, terminal station and frame, the ordered children and the sample count.

## @evidence contracts/development/design.md#principled-representation

The declared composition (`IAutoMovieConstructionSplit.ICompose`) with the host's regular surface, its terminal station and its kernel frame, the children in the declaration's order, and the composition's sample count per section. Units follow the member types. That the children match the declaration's order and that the count is a usable sample count remain for the derivation's runtime refusals and the caller.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `AutoMovieConstructionSplitCompose.derive`, which consumes each of the four members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values and borrowed surfaces only, all required; no optional member and no consumer-specific field.
