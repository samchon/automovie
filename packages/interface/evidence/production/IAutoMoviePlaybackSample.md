# src/production/IAutoMoviePlaybackSample.ts#IAutoMoviePlaybackSample

## @evidence contracts/development/design.md#principled-representation

The live entry is the last one whose span contains the instant, so the incoming shot wins inside an overlap; `time` is `offset + (seconds - start)` of that entry, and inside its transition `blend.time` is the same map applied to the previous entry, `alpha` is the elapsed fraction `(seconds - start) / transition.duration`, linear in output time, and `kind` is the transition's own.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One live shot and at most one outgoing tail, because `cutSequence` forbids adjacent transitions from overlapping inside a played span, so no instant ever mixes three shots and a nullable `blend` is the whole state. `kind` is carried so a reader of the sample, such as the render plan's frames, can weigh a fade as `IAutoMovieTransition` states without looking the entry up again.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The progress is the same linear fraction for every kind; the kind's weighting is stated once, on `IAutoMovieTransition`, and computed once, by `playbackLayersAt`. A hard cut is stated by a null `blend` rather than a zero `alpha`.

## @evidence contracts/development/common.md#meaningful-documentation

States the producers and consumers, which entry is live in an overlap, the shot-local clock of both times, what `alpha` measures and weighs for each kind, and how it ramps.
