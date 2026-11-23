# src/production/IAutoMoviePlaybackSample.ts#IAutoMoviePlaybackSample

## @evidence contracts/development/design.md#principled-representation

The live entry is the last one whose span contains the instant, so the incoming shot wins inside an overlap; `time` is `offset + (seconds - start)` of that entry, and inside its transition `blend.time` is the same map applied to the previous entry and `alpha` is the elapsed fraction `(seconds - start) / transition.duration`, linear in output time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One live shot and at most one outgoing tail, because `cutSequence` forbids adjacent transitions from overlapping inside a played span, so no instant ever mixes three shots and a nullable `blend` is the whole state. Remaining gap: the private `sampleAt` that builds it is written out twice, in `resolveFromTimeline.ts` and `playbackCursor.ts`, rather than shared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No transition kind is special-cased: every transition yields the same linear weight, and a hard cut is stated by a null `blend` rather than a zero `alpha`.

## @evidence contracts/development/common.md#meaningful-documentation

States the producers and consumers, which entry is live in an overlap, the shot-local clock of both times, and what `alpha` weighs and how it ramps.
