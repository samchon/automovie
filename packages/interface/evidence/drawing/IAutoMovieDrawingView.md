# src/drawing/IAutoMovieDrawingView.ts#IAutoMovieDrawingView

## @evidence contracts/development/design.md#principled-representation `autoMovieDrawingFrame` resolves an orthonormal page basis from the view, with normal `-direction`, right `up x normal` and up re-orthogonalized as `normal x right`, negating right for a reflected ceiling plan; the drafter classifies geometry by signed distance to the plane through `origin` against `depth` and `overhead`, and filters by `spaces` and `elementKinds`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The view holds only the parameters of the question and no geometry of its own, and the pen sits in a nested style the serializer alone reads, so derivation and presentation stay separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown space ids produce one view-space-filter gap containing sorted distinct names; an unmatched open kind remains an empty selection. Duplicate dimension/annotation ids throw, but the view is not otherwise admitted as an arbitrary runtime object or exhaustively checked for id/text/style/projection values. Discipline selects nothing, and projection intent does not enforce a cardinal viewing direction.

## @evidence contracts/development/common.md#meaningful-documentation

States that the view holds no geometry, its relation to design references and the placement/id admission boundaries; members give units, axis conventions, which origin components place the cut, the null meanings of depth and overhead, how each filter selects and what it leaves alone, and draw order.
