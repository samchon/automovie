# src/props/AutoMovieArchetypeClipboard.ts#AutoMovieArchetypeClipboard.create

## @evidence contracts/development/common.md#meaningful-documentation

Names the two shared A4 board dimensions, default model and writing and pinch locations.

## @evidence contracts/development/implementation.md#principled-implementation

The selected catalogue row supplies the whole board and mass. The precision grip and upward writing face follow its width, length and thickness.

## @evidence contracts/development/implementation.md#efficient-algorithms

Selects one catalogue row, builds one board and reuses the panel-contact constructor.

# src/props/AutoMovieArchetypeClipboard.ts#AutoMovieArchetypeClipboard.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

States the scene identity and its seed-independent default.

# src/props/AutoMovieArchetypeClipboard.ts#AutoMovieArchetypeClipboard.IParams.model

## @evidence contracts/development/common.md#meaningful-documentation

Names both selectable Esselte IDs and the seedless default.

# src/props/AutoMovieArchetypeClipboard.ts#AutoMovieArchetypeClipboard.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Locates the upper face and the precision grip on the near edge.

## @evidence contracts/development/design.md#principled-representation

The face covers the board along X and Z. The pinch is placed at half its thickness on the positive Z edge.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two public contact names correspond to the physical writing surface and board hold.

# src/props/AutoMovieArchetypeClipboard.ts#AutoMovieArchetypeClipboard.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Defines width, length, thickness and mass in the model's coordinate and unit convention.

## @evidence contracts/development/design.md#principled-representation

The model's three metre-valued measurements define its box, and the same row supplies kilograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four keys describe exactly the amounts supplied by both catalogue rows.

# src/props/AutoMovieArchetypeClipboard.ts#AutoMovieArchetypeClipboard.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Explains the optional ID and recorded Esselte model.

## @evidence contracts/development/design.md#principled-representation

Each model chooses a complete and internally consistent measured board.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Takes an identity and a model choice, the two controls the named clipboard exposes.
