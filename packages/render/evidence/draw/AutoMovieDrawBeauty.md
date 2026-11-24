# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty

## @evidence contracts/development/design.md#principled-representation

One page's beauty stages, the response, indirect and lens scratch, and the held layers of a transition, on the page's one renderer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw host, `installAutoMovieDraw`, and its picture, `AutoMovieDrawFilm`, call every public member; the stages are owned by their own classes and only composed here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a subject, a pass other than the graphics plate it draws, or a film.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment states what `sample`, `draw`, `plate`, `hold`, `composite`, `overlay` and `over` draw and through which stage, the transparent backdrop rule, why the plate is one sample without indirect shading and when that reopens, and the stages' lifetime.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.ILayer

## @evidence contracts/development/design.md#principled-representation

One layer's subject, drawn second on the output clock, drawn raster in pixels, its placement and camera at an output second, and its alpha mode.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The draw host builds one for the live entry and one for a transition's outgoing shot; `seek` is what differs between them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The layer's clock is the caller's placement, so no entry arithmetic is duplicated here.

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its clock, unit or meaning.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.ILayer.seek

## @evidence contracts/development/common.md#meaningful-documentation

States that it places the layer at an output second, the drawn one or a sample's.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the draw host's placement answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the draw host's placement answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the draw host's placement answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the draw host's placement answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the draw host's placement answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject owns what its placement holds.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.ILayer.camera

## @evidence contracts/development/common.md#meaningful-documentation

States that it gives the drawing camera at an output second after the layer's placement there.

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

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.prototype.sample

## @evidence contracts/development/common.md#meaningful-documentation

States what is placed, when samples are accumulated, what is returned and where the scene is left.

## @evidence contracts/development/implementation.md#principled-implementation

Places the layer, reads its optics after the placement, and with `samples` runs `accumulateAutoMovieFilmSamples` with the layer's own placement, so a transition's outgoing shot blurs on its own clock; each sample is drawn inside the indirect stage for its camera, with the backdrop held out of a transparent picture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sample planning, the lens shear and the sum belong to the accumulation and the stages; this method wires them to one layer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Optics without `samples` return undefined and draw one sample, exactly as before.

## @evidence contracts/development/implementation.md#efficient-algorithms

One placement plus, with samples, one placement and one scene draw per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stages' targets are reused while the raster is unchanged; no sample is reused across seconds.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The stages own their targets until `dispose`.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.prototype.draw

## @evidence contracts/development/common.md#meaningful-documentation

States which picture is drawn and onto what.

## @evidence contracts/development/implementation.md#principled-implementation

An accumulated layer is responded alone; a single sample is responded inside the indirect stage, which measures occlusion for the drawn camera first; without optics the response stage draws straight to the canvas. The alpha mode reaches the response stage, and a transparent picture's backdrop is held out around the render.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The response and indirect stages own their passes; this method chooses between them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same calls as before for an opaque picture; the backdrop is restored in a finally block.

## @evidence contracts/development/implementation.md#efficient-algorithms

One response pass, plus one scene draw and the occlusion passes for a single sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Stage targets are reused while the raster is unchanged.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates through the stages only.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.prototype.plate

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn with and without optics.

## @evidence contracts/development/implementation.md#principled-implementation

With optics the graphics plate goes through the response stage with alpha kept as coverage, so a graphic at full coverage takes the beauty pass's exposure, white balance, curve, glare, medium and grade; without optics it is the plain render it always was.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The graphics mode's holdouts are the render mode's; the response is the stage's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The plate keeps no indirect shading because a probe bake under holdout materials would poison the probes the beauty pass reuses; the class comment states this and its reopening condition.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scene draw, the medium march when the scene has one, and one response pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Stage targets shared with the beauty pass at the same raster.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates through the response stage only.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.prototype.hold

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied and where.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `AutoMovieTransitionDisplays.hold` on the page's renderer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The displays own the copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No transformation of the copied bytes.

## @evidence contracts/development/implementation.md#efficient-algorithms

One framebuffer copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The slot's copy is reused at an unchanged size.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most two copies, released by `dispose`.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.prototype.composite

## @evidence contracts/development/common.md#meaningful-documentation

States what is composited.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `AutoMovieTransitionDisplays.composite`, which mixes the held layers through `renderAutoMovieFilmFrame`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The displays and the compositor own the mix.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Weights are the plan's, admitted by the compositor's resolver.

## @evidence contracts/development/implementation.md#efficient-algorithms

One replay per layer and one composite pass.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The compositor state of the renderer is reused across frames.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Compositor states are released by `dispose`.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.prototype.over

## @evidence contracts/development/common.md#meaningful-documentation

States what is drawn over the canvas and that it does not clear.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to `AutoMovieTransitionDisplays.over` on the page's renderer, so a composited picture's witness cubes stand over the composite.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The displays own the overlay scene and its draw.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty overlay draws nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

One render of the overlay's objects.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each picture's overlay is drawn once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates nothing.

# src/draw/AutoMovieDrawBeauty.ts#AutoMovieDrawBeauty.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes the response and indirect stages and the held layers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each owner releases its own resources.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Releases everything the owner made; the renderer is the page's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the handful of targets.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After it the owner holds no GPU resource.
