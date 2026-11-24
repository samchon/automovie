# src/render/measureAutoMovieRenderFilmStage.ts#measureAutoMovieRenderFilmStage

## @evidence contracts/development/implementation.md#principled-implementation

Counts what render's film stages allocate and draw: the response stage's targets through `measureAutoMovieFilmResponseTargets`, the one owner of `allocateAutoMovieFilmTargets`'s rule, with its final quad and one glare quad per glare target; `AutoMovieFilmSampleSum` (two 32-bit float sums, one scene pass and one accumulation quad per sample, and the average); `AutoMovieFilmIndirectStage` (normal prepass with depth texture, raw and blurred visibility, and per sample one prepass scene pass and two quads); `bakeAutoMovieFilmProbes` (a 192 × 32 float target with a depth renderbuffer, nine float texels per probe, twelve scene passes per probe); and `AutoMovieFilmMediumPass` (one half-float target, two quads per sample). Targets are sized at the drawing buffer the beauty pass draws into, and every scene pass carries the shadow maps three redraws with it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory owns the totals; this phase owns only the film stage's allocations and passes, one owner per stage, computed over the opaque frame before the frame-pass phase adds its own passes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The glare targets are counted whether or not glare is asked for, because the stage allocates them with any optics; the probe bake's target and passes are counted because a budget bounds the frame that bakes, each bake pass bounded by the whole scene since the layer's share is not in the subject. Without settings the totals the raster decides become gaps rather than a guessed raster.

## @evidence contracts/development/common.md#meaningful-documentation

States each stage's targets, formats, sizes and passes, the raster and scene pass they are measured by, the owners and the gaps without settings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work beside the casters: one response-target measure, one sum over the shadow casters and the probe count as a product of three axis counts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per inventory; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh rows and retains nothing.
