# src/human/generation/web/IAutoMovieHumanWebInput.ts#IAutoMovieHumanWebInput

## @evidence contracts/development/common.md#meaningful-documentation

What a web needs from the surface being built: the skin buffers, the parent's ring and its children's shares of it.

## @evidence contracts/development/design.md#principled-representation `mesh`: Skin buffers. `coordinates`: Loft coordinates of every vertex, grown with each new vertex. `chain`: Chain by name.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanWebColumns.of, AutoMovieHumanWebCrest.of, AutoMovieHumanWebMesh.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `mesh`, `coordinates`, `chain`, `index`, `parent`, `down`, `phase`, `shares`; callers supply the complete record.

# src/human/generation/web/IAutoMovieHumanWebInput.ts#IAutoMovieHumanWebInput.IShare

## @evidence contracts/development/common.md#meaningful-documentation

One child's share of the parent's ring.

## @evidence contracts/development/design.md#principled-representation `name`: Child chain name. `arcs`: Its arcs as parent ring vertices, inclusive, in ring order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanWebInput.IShare is the canonical exchange used by AutoMovieHumanWebColumns.children.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `arcs`; callers supply the complete record.
