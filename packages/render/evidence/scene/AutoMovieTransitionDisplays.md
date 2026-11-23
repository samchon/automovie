# src/scene/AutoMovieTransitionDisplays.ts#AutoMovieTransitionDisplays

## @evidence contracts/development/design.md#principled-representation

Held RGBA8 copies of the drawing buffer, one per slot at the buffer's pixel size, and the raw copy program that writes them back unchanged.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw page's beauty owner and the interactive viewer's transition use `hold`, `composite` and `dispose`; the mix is `renderAutoMovieFilmFrame`'s and the compositor's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Slots are numbers the caller assigns per layer; no shot, kind or host is named.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment states why the layers are held, what `hold` copies, how `composite` replays and mixes, the fade's transparent target and the copies' lifetime.

# src/scene/AutoMovieTransitionDisplays.ts#AutoMovieTransitionDisplays.prototype.hold

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied.

## @evidence contracts/development/implementation.md#principled-implementation

The renderer's `copyFramebufferToTexture` copies the drawing buffer's bytes into the slot's `FramebufferTexture`, after the same state reset `AutoMovieDisplayCompositor` uses so the copy acts on the selected texture unit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One copy per call; sizing is the slot's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bytes are copied as drawn, associated colour and alpha alike.

## @evidence contracts/development/implementation.md#efficient-algorithms

One GPU copy of the drawing buffer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A slot's copy is reused while the drawing buffer keeps its size, the only input that decides its storage.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One copy per slot used, two for a transition; a resized copy disposes the old one.

# src/scene/AutoMovieTransitionDisplays.ts#AutoMovieTransitionDisplays.prototype.composite

## @evidence contracts/development/common.md#meaningful-documentation

States the layer order and what each names.

## @evidence contracts/development/implementation.md#principled-implementation

The film frame renderer, `renderAutoMovieFilmFrame`, admits the weights and runs the compositor, whose source callbacks replay each layer's held bytes with a raw, unblended, untone-mapped copy, so the compositor's byte operator sees exactly what each layer drew; a fade with `transparent` falls to alpha 0.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composition is the compositor's; this owner only supplies sources.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A slot never held is refused by name instead of replaying stale or empty bytes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One replay per layer plus the compositor's copies and its one pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The renderer's compositor state is reused across frames, as `renderFadeToBlackFrame` and `renderCrossDissolveFrames` keep it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Records the renderer so `dispose` releases its compositor states.

# src/scene/AutoMovieTransitionDisplays.ts#AutoMovieTransitionDisplays.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes the copies, the program and quad, and the fade and dissolve compositor states of each renderer it composited on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The compositor states are released through their own disposal functions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Releases only what this owner made or used.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After it the owner holds no GPU resource.
