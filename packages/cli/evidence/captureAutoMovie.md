# src/captureAutoMovie.ts#captureAutoMovie

## @evidence contracts/development/common.md#meaningful-documentation

States how options are read and split, both sources, their written records, the optional record and output callbacks, the displayed findings and the exit status.

## @evidence contracts/development/implementation.md#principled-implementation

Every rule of a capture is the render package's; the command loads that package from the production, supplies the browser or FFmpeg, and reports.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read, then one branch per source, then one report.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown option is refused by the request reader instead of ignored, and FFmpeg is resolved only for a video so a drawn capture never needs it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One host or two FFmpeg runs plus the probe; printing is linear in the record.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One capture per command.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The host is closed on every outcome.
