# src/props/AutoMovieArchetypeMoldedCrate.ts#AutoMovieArchetypeMoldedCrate.create

## @evidence contracts/development/common.md#meaningful-documentation

Locates the supported floor, outside dimensions, rim and seedless defaults.

## @evidence contracts/development/implementation.md#principled-implementation

The floor defines support. The rectangular `inside` is inset clear of the open ribs and rim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one floor, four rim sections and a fixed number of ribs directly from one draw.

# src/props/AutoMovieArchetypeMoldedCrate.ts#AutoMovieArchetypeMoldedCrate.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the outside measurements and mass units.

## @evidence contracts/development/design.md#principled-representation

The open crate reports overall exterior sizes even though its floor contact fits within the walls.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four keys cover the actual shape inputs and mass.

# src/props/AutoMovieArchetypeMoldedCrate.ts#AutoMovieArchetypeMoldedCrate.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the single supported inner site.

## @evidence contracts/development/design.md#principled-representation

The frame lies at floor-top height and its extent fits between the opposed inner walls.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The open crate exposes its actual placement footprint as the single stable site.

# src/props/AutoMovieArchetypeMoldedCrate.ts#AutoMovieArchetypeMoldedCrate.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the optional admitted measurements and scene identity.

## @evidence contracts/development/design.md#principled-representation

All fixed settings are relevant to constructing the ribbed shell and supporting floor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses only the settings the named crate actually consumes.
