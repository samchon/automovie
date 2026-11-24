# src/inspector/syncAutoMovieInspectorSoundtrack.ts#syncAutoMovieInspectorSoundtrack

## @evidence contracts/development/common.md#meaningful-documentation

States which mixer and clock make the master, why it is the delivered master, which playhead changes restart it, that it may start after the first frame, how a refusal is reported and what the release does.

## @evidence contracts/development/implementation.md#principled-implementation

The delivery's soundtrack is `mixAutoMovieFilmSound` of the sound list on the render's clock, the exact rate `autoMovieVideoFrameRate` gives for the subject's `fps` and the whole frame count, so mixing the same list on the same clock gives the same WAVE bytes (#4051 item 8). A master starts at sample 0 at film second 0, so playing from the playhead's second at its rate keeps sound and picture on one clock; it restarts only when the playhead starts, stops, changes rate or jumps, the changes a listener can hear.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mixing belongs to render, decoding and playback to the host, and the timing rule to this function, so the mount only starts it and releases it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No second mixer or per-cue playback stands in for the master, and a refused mix is reported rather than replaced by silence that looks like success.

## @evidence contracts/development/implementation.md#efficient-algorithms

One mix of the whole film, linear in its samples, and one decode, both once per mount; each restart is constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One mix per mounted subject; a new mount mixes again because its subject is a new instance.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one decoded master and one playhead subscription from decode to release; a release before decoding finishes frees the master as soon as it arrives.
