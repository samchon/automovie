# src/architecture/IAutoMoviePatternTextureSheet.ts#IAutoMoviePatternTextureSheet

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `kind`: the module variant fixes the sheet to each piece's centre, and the face variant maps a piece centre to sheet turns by subtracting `origin`, rotating by the grain and dividing by the tile size, which is the rigid placement of one continuous sheet on the face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two variants for the two meanings of a repeated finish, with `origin` present only where it is read, so a module sheet cannot carry an ignored origin.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No material or finish name selects a variant; the caller chooses one per call, and the consumer throws on a non-finite origin rather than substituting zero.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what each variant means physically, how the consumer maps a piece centre under each, and the non-finite origin refusal; each member states its role and unit.
