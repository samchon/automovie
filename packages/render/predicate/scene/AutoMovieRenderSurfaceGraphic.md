# src/scene/AutoMovieRenderSurfaceGraphic.ts#AutoMovieRenderSurfaceGraphic.hide

## @evidence contracts/development/common.md#meaningful-documentation

The caller can see which mounted roots are hidden and that the returned operation restores the pass's temporary changes.

## @evidence contracts/development/implementation.md#principled-implementation

The pass traversal records only graphic roots that are currently visible. Restore changes those same roots back without touching their key groups, so a hidden key stays hidden.

## @evidence contracts/development/implementation.md#efficient-algorithms

The hide operation traverses the supplied scene once. The restore closure holds only roots it changed and the caller releases it after the pass.

# src/scene/AutoMovieRenderSurfaceGraphic.ts#AutoMovieRenderSurfaceGraphic.prepare

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies the shot clock, the rigid carrier and model-rest frame, the asset sources and the caller's disposal responsibility.

## @evidence contracts/development/implementation.md#principled-implementation

For a moving surface, the inverse part-rest transform maps the authored reading frame into the part's coordinates. The native scene graph then follows articulation and object placement. For a fixed surface, the model root supplies the same frame directly. Key selection remains in the shot's own time domain.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare builds each declared key once, converts each moving reading frame once and decodes each distinct carried or project image once. Its shot handle releases roots, resources and texture cache on disposal. A refused prepare releases its partial build before propagating the error.
