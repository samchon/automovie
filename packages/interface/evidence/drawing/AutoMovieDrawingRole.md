# src/drawing/AutoMovieDrawingRole.ts#AutoMovieDrawingRole

## @evidence contracts/development/design.md#principled-representation `deriveAutoMovieDrawing` takes the minimum and maximum corner distance of each element: a minimum above `AUTOMOVIE_DRAWING_EPSILON` with a cut means overhead, a maximum below `-depth` means hidden, and otherwise the cut edges and the clipped silhouette are drafted; occlusion is never computed, which the `hidden-line-removal` gap declares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four roles are the line types a drafting convention distinguishes, and each maps to one pen in the view's style, so classification and styling stay separate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The classification is drafting semantics and says so; it does not pretend to visibility, and no element kind receives a different rule.

## @evidence contracts/development/common.md#meaningful-documentation

States the per-element basis of the decision, the test behind each role, that an element can yield two roles, and the sort order.
