# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.create

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed board, archive grid axes and printable material top.

## @evidence contracts/development/implementation.md#principled-implementation

Square sockets match the centres of the fixed grid at the same height as the actual slab. The top size is the slab size and its binding points to the slab itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one box and computes one surface and the 64 square frames directly.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.IBoard.border

## @evidence contracts/development/common.md#meaningful-documentation

States the estimated border on each side of the playing area.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.IBoard.mass

## @evidence contracts/development/common.md#meaningful-documentation

States the provisional mass in kilograms.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.IBoard.square

## @evidence contracts/development/common.md#meaningful-documentation

Gives the metric square side and hence the coordinate spacing.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.IBoard.thickness

## @evidence contracts/development/common.md#meaningful-documentation

Relates the thickness above Y zero to the shared playing height.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable default scene ID.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Names the material top and the individual placement sockets.

## @evidence contracts/development/design.md#principled-representation

The playing surface and piece positions share the slab's upper plane, with distinct surface and socket roles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One surface name and the exact square names expose the model's actual authored sites.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines the two measured lengths and whole-board mass unit.

## @evidence contracts/development/design.md#principled-representation

The real side combines eight squares and two borders. The other recorded quantity is the assembled board mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the small record of measurements exposed by the fixed scene prop.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.File

## @evidence contracts/development/common.md#meaningful-documentation

Names the letters and their measured order along X.

## @evidence contracts/development/design.md#principled-representation

Each file selects a single X position within the grid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eight literals represent the actual file sockets without another lookup name.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.IBoard

## @evidence contracts/development/common.md#meaningful-documentation

Defines the fixed geometry record and mass.

## @evidence contracts/development/design.md#principled-representation

Square spacing, border and thickness determine the playing plane and outside geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four physical settings describe the whole single-slab construction.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies scene identity as the authorable input.

## @evidence contracts/development/design.md#principled-representation

The geometry record is fixed and instances are distinct through IDs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One optional setting covers what the factory accepts.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.Rank

## @evidence contracts/development/common.md#meaningful-documentation

Names the digits and their measured order along Z.

## @evidence contracts/development/design.md#principled-representation

Each rank selects a single Z position in the same grid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eight admitted digits share one concise rank type.

# src/props/AutoMovieArchetypeChessBoard.ts#AutoMovieArchetypeChessBoard.Square

## @evidence contracts/development/common.md#meaningful-documentation

States how a file and rank combine into a stable ID.

## @evidence contracts/development/design.md#principled-representation

Each combination refers to the intersection of one column and one row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Composes the existing two coordinate types to describe all sixty-four names.
