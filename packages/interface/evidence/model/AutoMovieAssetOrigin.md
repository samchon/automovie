# src/model/AutoMovieAssetOrigin.ts#AutoMovieAssetOrigin

## @evidence contracts/development/design.md#principled-representation

An explicit provenance discriminator separates generated geometry from an imported appearance; forging and viewer loading read origin and the sealed imported closure rather than guessing provenance from whether parts contain meshes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The two provenance states belong to the model, leaving primitive-versus-mesh representation on each part; a deterministic generator can therefore emit mesh geometry without becoming imported.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No filename or mesh presence substitutes for provenance, and imported appearance does not acquire semantic traits without its registered deterministic proxy.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes generated and user-supplied geometry and explains the explicit generation-versus-import pipeline branch rather than implying that triangle data proves origin.
