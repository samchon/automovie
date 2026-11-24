# src/film/compilePerformShotCameras.ts#compilePerformShotCameras

## @evidence contracts/development/implementation.md#principled-implementation

Every take compiles through the one framing grammar with its own staged camera as the parameter, so the side the director staged is the side the angle plays from; subjects come from one framer and lens marks from the positional target gate at their individual cue times.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The camera stage of `performShot` in one place. It reads the delivery raster and clock once, as an aspect and an exact rate shared by hero and coverage takes, and reports a refused rate, or a moving take with no rate (`cameraFrameEntryMoves`), to the collector before any take compiles, delegating the solve to `compileCameraMove` and `compileCameraCoverage`, measurement to the subject framer and obstruction to `compileCameraClearanceReports`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Hero and coverage are compiled by the same grammar and framer; a coverage take gets no invented lens intent, a moving take without the delivery rate is refused rather than keyed at an assumed one, and an obstructed take is reported rather than nudged.

## @evidence contracts/development/common.md#meaningful-documentation

States each compiled field, how the delivery raster and clock become the aspect and key rate, when a missing rate is a violation, the clip id formats, the locked-off case, what an intent carries and who reads it, how coverage plays, the shared framer, and where clearance refusals go.

## @evidence contracts/development/implementation.md#efficient-algorithms

One camera compile per take plus one subject measurement per frame move and coverage job, with model extents memoized across takes by the framer, and the clearance sweep's own cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One framer is built per shot and shared by every take, so a subject's model extent is measured once however many cameras frame it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The framer and its memo are dropped on return; the caller owns the returned clips, intents, takes and reports.
