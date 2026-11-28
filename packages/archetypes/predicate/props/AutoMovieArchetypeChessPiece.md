# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.create

## @evidence contracts/development/common.md#meaningful-documentation

Explains the fixed upright profile, choice of height and color, physical base and head contacts, and defaults.

## @evidence contracts/development/implementation.md#principled-implementation

One selected height scales the base, body and head and their two contact positions. Side changes colour for the same physical geometry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Selects kind and finish once and directly builds three parts and two frames.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable default scene identity.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the physical height selector.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.IParams.side

## @evidence contracts/development/common.md#meaningful-documentation

Defines the finish selection and default light form.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

Lists the six admitted sizes in height order.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.SIDES

## @evidence contracts/development/common.md#meaningful-documentation

Names the two colours and their default ordering.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Locates the stable head pinch and underside socket.

## @evidence contracts/development/design.md#principled-representation

The base socket aligns a piece with an individual square. The grip is placed near the head at a height derived from the model size.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two IDs expose the semantic pickup and placement roles.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Explains the measured height, proportional base and estimated mass.

## @evidence contracts/development/design.md#principled-representation

The base diameter and estimated mass are determined by the piece height in the recorded units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three keys completely describe the built metric scale and mass.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Identifies required kind and optional side and identity.

## @evidence contracts/development/design.md#principled-representation

Geometry, appearance and naming correspond to the selected kind, side and scene ID respectively.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The model accepts precisely those physical and placement selectors.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Names all six measured piece kinds.

## @evidence contracts/development/design.md#principled-representation

Each kind determines its geometry scale and associated base size and mass.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The six literals are the complete set keyed by measured height.

# src/props/AutoMovieArchetypeChessPiece.ts#AutoMovieArchetypeChessPiece.Side

## @evidence contracts/development/common.md#meaningful-documentation

Names the two visual sides and their finishes.

## @evidence contracts/development/design.md#principled-representation

The same size and frames can be rendered with either of the two materials.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two admitted labels cover the exact palette used by both sets of pieces.
