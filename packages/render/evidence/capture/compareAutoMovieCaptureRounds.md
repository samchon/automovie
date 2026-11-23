# src/capture/compareAutoMovieCaptureRounds.ts#compareAutoMovieCaptureRounds

## @evidence contracts/development/common.md#meaningful-documentation

States both matching rules and why the camera matters, when a pair is measured or laid side by side, every unmatched cause, what a sheet row holds and what files are written.

## @evidence contracts/development/implementation.md#principled-implementation `.agents/skills/visual-debugging/comparison.md`: pair two cells only when everything but the compared thing agrees, and report a cell one capture lacks as unmatched with its cause; the campaign's renderer decision compares pixels only within one backend, since bit identity across backends is not documented.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Index the earlier rows by their key, decide every entry, claim the files, then read, measure and lay out each entry in order; the findings are diffed by diffAutoMovieCaptureFindings from the two records' audits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No picture is resampled to force a comparison, and an unmatched cell is never counted as unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the cells of both captures for the pairing, plus each pair's pixels once for decoding and measuring.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pair is read and measured once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One pair of decoded stills, one difference image and the comparison sheet being filled are held at a time.
