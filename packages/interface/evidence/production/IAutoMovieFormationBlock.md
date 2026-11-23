# src/production/IAutoMovieFormationBlock.ts#IAutoMovieFormationBlock

## @evidence contracts/development/common.md#meaningful-documentation

States what a block is, how slots are numbered across blocks and the order of the placements, with units.

## @evidence contracts/development/design.md#principled-representation

The interface's layout union reused with a count, a planar offset in metres and a facing in degrees; the frame order is the one formation placement already uses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four members a block's slots are placed by; read by the engine's slot placement and written by the motions package's population.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No `square` layout: four faced blocks are one, and the layout union is not widened.
