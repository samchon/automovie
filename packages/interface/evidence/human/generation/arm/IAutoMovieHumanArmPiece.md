# src/human/generation/arm/IAutoMovieHumanArmPiece.ts#IAutoMovieHumanArmPiece

## @evidence contracts/development/common.md#meaningful-documentation

One span of the arm between two named anatomical loci, built from fixed inputs alone.

## @evidence contracts/development/design.md#principled-representation `name`: Name of the piece, for findings and part identities. `from`: Locus at the piece's proximal end. `to`: Locus at the piece's distal end.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmPieces.build, AutoMovieHumanDeltoidSpan.piece, AutoMovieHumanElbowSpan.piece. Read by AutoMovieHumanArmGirth.knots, AutoMovieHumanArmGuides.shape. Also types AutoMovieHumanArmLaw.pieces.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `from`, `to`, `walk`, `rows`, `knots`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmPiece.ts#IAutoMovieHumanArmPiece.IRow

## @evidence contracts/development/common.md#meaningful-documentation

A landmark station of the shape channel.

## @evidence contracts/development/design.md#principled-representation `s`: Walk length of the landmark, mm. `channels`: Sixteen channels in units of the section's girth over 2 pi: the radius, its first and second derivative in the angle for the forward, lateral, back and medial guides in turn, then the fullness of the four sectors that follow those guides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmRows.row, AutoMovieHumanDeltoidSpan.end, AutoMovieHumanElbowSpan.end. Also types AutoMovieHumanArmGuides.rows, AutoMovieHumanArmGuides.last.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `s`, `channels`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmPiece.ts#IAutoMovieHumanArmPiece.ITapes

## @evidence contracts/development/common.md#meaningful-documentation

The four tapes the spans read, mm, each at its published site.

## @evidence contracts/development/design.md#principled-representation `bicep`: Upper arm girth midway between acromion and olecranon. `elbow`: Elbow girth over the olecranon. `forearm`: Forearm girth at its relaxed maximum below the elbow.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmPieces.inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bicep`, `elbow`, `forearm`, `wrist`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmPiece.ts#IAutoMovieHumanArmPiece.IInputs

## @evidence contracts/development/common.md#meaningful-documentation

What a piece is built from.

## @evidence contracts/development/design.md#principled-representation `bones`: The bones, left frame. `axis`: The walk on the bones. `tapes`: The tapes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmPieces.inputs. Read by AutoMovieHumanArmPieces.build, AutoMovieHumanDeltoidSpan.insertion, AutoMovieHumanDeltoidSpan.end. Also types AutoMovieHumanArmLaw.pieceInputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `bones`, `axis`, `tapes`, `stylion`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmPiece.ts#IAutoMovieHumanArmPiece.ISize

## @evidence contracts/development/common.md#meaningful-documentation

The size a bony prominence or a hollow is asked for.

## @evidence contracts/development/design.md#principled-representation `height`: Height at the centre, mm; negative for a hollow. `reach`: Half width of the window along the walk, mm. `along`: Distance of the window's centre past its landmark along the walk, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmPiece.ISize belongs to IAutoMovieHumanArmPiece; its public declaration is reached by the Human main-entry export closure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `height`, `reach`, `along`; callers supply the complete record.
