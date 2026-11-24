# src/draw/AutoMovieDrawFilm.ts#AutoMovieDrawFilm

## @evidence contracts/development/design.md#principled-representation

One draw call's picture on the drawn second: the layers a film picture composites, the shown layer's placement on its own entry clock and the samples accumulated for it, all on the output clock of the subject's `cut`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw host, `installAutoMovieDraw`, reads `layers`, `seekShown` and `composites` and calls `prepare` and `draw`; the plan is `planAutoMovieDrawPicture`'s, the placement `placeAutoMovieDrawLayer`'s, the stages and held layers `AutoMovieDrawBeauty`'s.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a subject, a shot or a transition kind; the plate and the beauty picture go through one path, so the plate cannot fall back to the shown shot alone.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment states how the shown layer is chosen and placed, what a film picture is, the order `prepare` places, samples, draws and holds the layers in and with which slots, where `beforeDraw` runs, when the clear alpha is set, what a weight-0 layer and a fade's midpoint draw, and what `draw` composites.

# src/draw/AutoMovieDrawFilm.ts#AutoMovieDrawFilm.prototype.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States what is placed, drawn and held before the host places the shown layer.

## @evidence contracts/development/implementation.md#principled-implementation

Every layer of positive weight but the shown one is placed on its own entry clock (`placeAutoMovieDrawLayer`), fed by `beforeDraw`, drawn and held in its slot, a plate under the `graphics` render mode; then a sampled beauty picture's shown layer accumulates its shutter and lens samples on that layer's clock, so a cut's first frame integrates only the incoming shot's handle (an editor's handle frames, the source before a trim's start); the clear alpha is set before any sample.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Holding a layer and sampling a layer are private steps; placement is `placeAutoMovieDrawLayer`'s and accumulation `AutoMovieDrawBeauty.sample`'s.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A layer of weight 0 is skipped, not drawn and mixed at nothing; a shot that needs `seekShot` without it is refused rather than placed by the film second.

## @evidence contracts/development/implementation.md#efficient-algorithms

One placement and draw per other drawn layer, plus its samples, and the shown layer's samples; a weight-0 layer costs nothing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The beauty owner's stages and slot copies are reused; no layer is placed twice for the same purpose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds only the shown layer's accumulated optics until `draw`; the beauty owner owns the copies.

# src/draw/AutoMovieDrawFilm.ts#AutoMovieDrawFilm.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn and when the held layers are composited.

## @evidence contracts/development/implementation.md#principled-implementation

The shown layer is drawn with its samples; inside a transition it is held in its slot and the drawn layers are mixed by `AutoMovieDrawBeauty.composite`, toward alpha 0 for a transparent picture or the plate, so the plate is mixed exactly as the picture (Porter and Duff 1984 associated colour); no drawn layer is the cleared canvas, which is what a fade at weight 0 shows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Drawing a layer is the private `render`; the mix is the compositor's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Outside a transition it is the one draw it always was.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw, one copy and one composite pass inside a transition; one draw otherwise.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The held copies of `prepare` are composited without redrawing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing; the beauty owner's copies stay its own.

# src/draw/AutoMovieDrawFilm.ts#AutoMovieDrawFilm.IProps

## @evidence contracts/development/design.md#principled-representation

The subject, the page's renderer and beauty owner, the shade, the drawn second and raster, the alpha mode and whether the picture is the film picture, with the host's camera, canvas preparation and inspection restore.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by the picture; the beauty owner is picked to the five members it calls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The host keeps the inspection and view resolution; the picture only borrows them through callbacks.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, clock or role.

# src/draw/AutoMovieDrawFilm.ts#AutoMovieDrawFilm.IProps.camera

## @evidence contracts/development/common.md#meaningful-documentation

States that it gives the drawing camera at an output second after its placement.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the draw host's view resolution answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the draw host's view resolution answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the draw host's view resolution answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the draw host's view resolution answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the draw host's view resolution answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the camera is the subject's or the view resolver's.

# src/draw/AutoMovieDrawFilm.ts#AutoMovieDrawFilm.IProps.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States that it sizes the canvas and sets its clear alpha.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the draw host's canvas preparation answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the draw host's canvas preparation answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the draw host's canvas preparation answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the draw host's canvas preparation answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the draw host's canvas preparation answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the renderer is the page's.

# src/draw/AutoMovieDrawFilm.ts#AutoMovieDrawFilm.IProps.restore

## @evidence contracts/development/common.md#meaningful-documentation

States that it ends the current inspection before the picture places the subject.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; `AutoMovieDrawPlacement.restore` answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; `AutoMovieDrawPlacement.restore` answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; `AutoMovieDrawPlacement.restore` answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; `AutoMovieDrawPlacement.restore` answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; `AutoMovieDrawPlacement.restore` answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the placement owns the inspection.
