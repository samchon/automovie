# src/index.ts#recordAutoMoviePlayback

## @evidence contracts/development/common.md#meaningful-documentation

States what is recorded and how, which backend and why, how the controls are found, the reading cadence, the clocks of the video and the readings, the refusals and the release.

## @evidence contracts/development/implementation.md#principled-implementation

Playback is observed on the page a person uses, through its own controls, so the recording shows the real loop's pacing instead of seeks turned into a supposed playback; Playwright closes the context to finish writing the video.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Launch, open a recording context, load, press Play, read for the duration, close.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing control or video is an error, never a recording of nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

One reading per half second.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each review records afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The browser and its context are closed on every outcome; the readings grow by two per second of observation.
