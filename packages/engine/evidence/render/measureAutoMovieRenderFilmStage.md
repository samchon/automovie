# src/render/measureAutoMovieRenderFilmStage.ts#measureAutoMovieRenderFilmStage

## @evidence contracts/development/implementation.md#principled-implementation

Counts what render's film stages allocate and draw: `allocateAutoMovieFilmTargets` (linear half-float with depth texture, the pyramid as deep as the deepest glare kernel, two blur targets per kernel at its level, by the level rule `planAutoMovieFilmGlare` uses) and its final and glare quads; `AutoMovieFilmSampleSum` (two 32-bit float sums, one scene pass and one accumulation quad per sample, and the average); `AutoMovieFilmIndirectStage` (normal prepass with depth texture, raw and blurred visibility, and per sample one prepass scene pass and two quads); `bakeAutoMovieFilmProbes` (a 192 × 32 float target with a depth renderbuffer, nine float texels per probe, twelve scene passes per probe); and `AutoMovieFilmMediumPass` (one half-float target, two quads per sample). Targets are sized at the drawing buffer the beauty pass draws into, and every scene pass carries the shadow maps three redraws with it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory owns the totals; this phase owns only the film stage's allocations and passes, one owner per stage, computed over the opaque frame before the frame-pass phase adds its own passes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The glare targets are counted whether or not glare is asked for, because the stage allocates them with any optics; the probe bake's target and passes are counted because a budget bounds the frame that bakes, each bake pass bounded by the whole scene since the layer's share is not in the subject. Without settings the totals the raster decides become gaps rather than a guessed raster.

## @evidence contracts/development/common.md#meaningful-documentation

States each stage's targets, formats, sizes and passes, the raster and scene pass they are measured by, the owners and the gaps without settings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work beside the casters: three kernel levels, at most a few pyramid levels, one sum over the shadow casters and the probe count as a product of three axis counts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per inventory; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh rows and retains nothing.

# src/render/measureAutoMovieRenderFilmStage.ts#measureAutoMovieRenderFilmStage.IProps

## @evidence contracts/development/design.md#principled-representation

The subject whose `film` and `medium` decide the stages, the settings whose raster sizes them, the opaque frame and casters a scene pass repeats, and the inventory's own row and gap sinks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the phase reads and writes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the inventory's sinks rather than a second report format.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what is read from it.

# src/render/measureAutoMovieRenderFilmStage.ts#measureAutoMovieRenderFilmStage.ICaster

## @evidence contracts/development/design.md#principled-representation

The two per-pass costs of a shadow caster a scene pass repeats.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The texture phase's caster records satisfy it as they are.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Restates no light identity; the frame-pass phase owns the casters' own rows.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it counts.

# src/render/measureAutoMovieRenderFilmStage.ts#measureAutoMovieRenderFilmStage.IPass

## @evidence contracts/development/design.md#principled-representation

The two whole-frame pass metrics the budget has.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what becomes a stage's pass rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No metric the budget lacks is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its unit.

# src/render/measureAutoMovieRenderFilmStage.ts#measureAutoMovieRenderFilmStage.IRow

## @evidence contracts/development/design.md#principled-representation

One stage's owner, the setting that makes it allocate and draw, its allocations, bytes and passes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what becomes the stage's owner rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps one `render-pass:film-*` identity per stage instead of inventing scene owners.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it counts and its unit.

# src/render/measureAutoMovieRenderFilmStage.ts#measureAutoMovieRenderFilmStage.IResult

## @evidence contracts/development/design.md#principled-representation

The four sums the inventory adds to its totals, null where the raster is unknown.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the inventory reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sums are derived from the rows, not estimated separately.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it sums and when it is null.
