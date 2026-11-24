# src/human/generation/IAutoMovieHumanTrunkContext.ts#IAutoMovieHumanTrunkContext

## @evidence contracts/development/common.md#meaningful-documentation

What stays fixed through a solve of the trunk: the fixed inputs and the landmark heights that no course moves, in calibration millimetres.

## @evidence contracts/development/design.md#principled-representation `fixed`: The fixed inputs. `seat`: The neck's bottom ring. `cervicale`: The back neck point `[x, y, 0]`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkSolver.context. Read by AutoMovieHumanTrunkClosure.girthAt, AutoMovieHumanTrunkClosure.tapes, AutoMovieHumanTrunkClosure.courses. Also types AutoMovieHumanTrunkSolver.ctx.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The context carries the actual seat and landmark heights, a median back anchored at that seat, and the aspect ratio of the person's underbust chest-wall ellipse. Tape widths may change through the solve while these inputs stay fixed.
