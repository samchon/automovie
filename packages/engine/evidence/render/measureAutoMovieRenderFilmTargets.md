# src/render/measureAutoMovieRenderFilmTargets.ts#measureAutoMovieRenderFilmTargets

## @evidence contracts/development/implementation.md#principled-implementation

Counts what render's film stages allocate: `allocateAutoMovieFilmTargets` (linear half-float with depth texture, the pyramid as deep as the deepest glare kernel, two blur targets per kernel at its level, by the same level rule `planAutoMovieFilmGlare` uses), `AutoMovieFilmSampleSum` (two 32-bit float sums), `AutoMovieFilmIndirectStage` (normal prepass with depth texture, raw and blurred visibility), `bakeAutoMovieFilmProbes` (a 192 × 32 float target with a depth renderbuffer, and nine float texels per probe) and `AutoMovieFilmMediumPass` (one half-float target), at the drawing buffer the beauty pass draws into.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The inventory owns the totals; this phase owns only the film stage's allocations, one row pair per stage, beside the feed targets the frame-pass phase counts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The response stage's glare targets are counted whether or not glare is asked for, because the stage allocates them with any optics, and the probe bake's transient target is counted because a budget bounds the frame that bakes. Without settings both totals become gaps rather than a guessed raster.

## @evidence contracts/development/common.md#meaningful-documentation

States each stage's targets, their formats and sizes, the raster they are sized by, the owners and the gap without settings.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: three kernel levels, at most a few pyramid levels, and the probe count as a product of three axis counts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Runs once per inventory; nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh rows and retains nothing.

# src/render/measureAutoMovieRenderFilmTargets.ts#measureAutoMovieRenderFilmTargets.IProps

## @evidence contracts/development/design.md#principled-representation

The subject whose `film` and `medium` decide the stages, the settings whose raster sizes them, and the inventory's own row and gap sinks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the phase reads and writes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses the inventory's sinks rather than a second report format.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what is read from it.

# src/render/measureAutoMovieRenderFilmTargets.ts#measureAutoMovieRenderFilmTargets.IRow

## @evidence contracts/development/design.md#principled-representation

One stage's owner, the setting that makes it allocate, its allocation count and bytes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exactly what becomes the stage's two owner rows.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps one `render-pass:film-*` identity per stage instead of inventing scene owners.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it counts and its unit.

# src/render/measureAutoMovieRenderFilmTargets.ts#measureAutoMovieRenderFilmTargets.IResult

## @evidence contracts/development/design.md#principled-representation

The two sums the inventory adds to its texture totals, null when the raster is unknown.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the inventory reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sums are derived from the rows, not estimated separately.

## @evidence contracts/development/common.md#meaningful-documentation

Each field states what it sums and when it is null.
