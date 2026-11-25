# src/capture/compareAutoMovieCaptureRounds.ts#compareAutoMovieCaptureRounds

## @evidence contracts/development/common.md#meaningful-documentation

States both matching rules, how repeated keys and incompatible rows are handled, why the camera matters, when a pair is measured or laid side by side, and what the sheet and difference files hold.

## @evidence contracts/development/implementation.md#principled-implementation

The visual debugging comparison rules require corresponding cells and preserve unmatched causes. Cell matching keeps the view. Time matching uses the recorded second rounded to six decimal places, pass and selection. A unique compatible pair can compare the file view with its source view, and repeated groups pair only where a view identifies exactly one row on both sides. In both modes, unequal reported cameras yield an unmatched entry with both stills. Complete draw camera records compare their projection, placement, lens and clips independently of the requested view text. Other host camera text compares literally. Pixel differences require the same stated backend and raster size.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index every row from both captures by its key and resolve unique counterparts before claiming output names. Read, measure and lay out the resulting entries in current plan order, then the unmatched earlier rows in earlier plan order. The finding diff reads the two records' audits independently.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Repeated keys retain every row. Pass compatibility precedes view selection, and neither insertion order nor a raster resample forces a match. Unmatched cells carry causes in place of pixel metrics.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pairing indexes both captures and visits each row once more for view matching in repeated groups. It uses linear auxiliary space in the number of cells. Pixel work additionally scales with the stills decoded, compared and written to sheets.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pair is read and measured once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The temporary comparison plan retains at most one entry per input cell. Picture work holds at most one pair of decoded stills, one difference image and the sheet being filled. Folder storage owns the written files.
