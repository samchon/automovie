# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene

## @evidence contracts/development/design.md#principled-representation

Seconds are the subject's own timebase, the raster is whole pixels, and `seek` returns a promise that resolves when the subject is ready, such as once a texture has loaded, so the draw function waits for exactly that and nothing else; a subject that is ready at once resolves at once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Every member is read by `installAutoMovieDraw`: the scene and camera to draw, the clock, raster and named instants for the capture plan, the delivery intent, sound list and cut for the delivery render, `sequence` and `seekShot` for the film picture's transitions, which the interactive inspector reads too, `speak` for the dialogue mouths the capture and the render hand, `views` and `marks` for the inspection, `seek` and `dispose` for its life. View placements and marks use the shapes `resolveAutoMovieInspectionView` and `IAutoMovieMark` already own, and the sequence is the interface's `IAutoMovieSequence`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a film, a figure or a case. A positive clock and raster are checked by the capture planner at runtime. `sequence` without `seekShot` is a state the type admits, because a cut whose transitions are all outside the drawn seconds needs no shot placement; a picture that needs one refuses by name in `planAutoMovieDrawLayers`, or in `placeAutoMovieDrawLayer` for a shutter sample before a cut.

## @evidence contracts/development/common.md#meaningful-documentation

States who holds it, the order the draw function calls its members in, which placement every reader describes and what alone follows the output second, and each member's unit and absent meaning.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.marks

## @evidence contracts/development/common.md#meaningful-documentation

States what is returned, when it is asked for, and what absence means.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.optics

## @evidence contracts/development/common.md#meaningful-documentation

States when it is asked for, after either placement, what it changes about the beauty draw and the graphics plate, what absence draws, the refusal and that the other structural passes never ask.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.shading

## @evidence contracts/development/common.md#meaningful-documentation

States when it is asked for, which stage measures it, what absence leaves, the refusal without optics and that structural passes never ask.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.inspectPlaced

## @evidence contracts/development/common.md#meaningful-documentation

States the observation's position relative to placement and inspection, and that participation is optional.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The producer implements this signature using the supplied placed sample.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

This signature has no body.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The producer owns its check. The host supplies the unmasked settled sample.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The producer owns its budget.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The host supplies the already placed sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The producer borrows inputs for the call.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.beforeDraw

## @evidence contracts/development/common.md#meaningful-documentation

States when it runs relative to placement and inspection, what it is for, and the render-target state it must leave.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject owns its render targets.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.speak

## @evidence contracts/development/common.md#meaningful-documentation

States who hands the mouths and when, where and how the subject reads them, what absence gives in the report, and why the interactive inspector hands none with its reopening condition.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.seek

## @evidence contracts/development/common.md#meaningful-documentation

States what is placed and what the promise means.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.seekShot

## @evidence contracts/development/common.md#meaningful-documentation

States what is placed, on which two clocks, what the subject reads at the output second and what every other reader then describes, the handle and pre-zero times it can be asked for, the order the hosts place a transition's shots in, and when it is required.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.place

## @evidence contracts/development/common.md#meaningful-documentation

States the equivalence with `seek` and who uses it.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released and when.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.IPlacedSample

## @evidence contracts/development/design.md#principled-representation

The clock, world scene, camera and delivery raster describe a single evaluated sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries the placed inputs and the capture and delivery renderer access that diagnostics use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Review views never determine the delivery projection. Full raster inspection is available only where the offscreen capture or delivery host supplies its renderer and sample factor.

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the origin of the projection, the raster dimensions and when the renderer is available.

# src/draw/IAutoMovieDrawScene.ts#IAutoMovieDrawScene.IPlacedSample.place

## @evidence contracts/development/common.md#meaningful-documentation

States where it comes from, that a shot placed by `seekShot` offers none, and the caller's obligation after placing another second.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the subject that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the subject that implements it answers.
