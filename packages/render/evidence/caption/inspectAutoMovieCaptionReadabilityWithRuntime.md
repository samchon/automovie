# src/caption/inspectAutoMovieCaptionReadabilityWithRuntime.ts#inspectAutoMovieCaptionReadabilityWithRuntime

## @evidence contracts/development/implementation.md#principled-implementation

Graphemes are counted by the injected segmenter rather than by code units, so a combining sequence or emoji counts as one, and the verdict compares each measurement to the profile's boundary with its declared inclusive or exclusive sense; the gap and rate formulas rely on film assembly's sorted, positive-duration cues.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Thresholds and identity matching live here, while the runtime binding lives in production's `inspectAutoMovieCaptionReadability`, so the render package stays free of Node globals and a test can inject a fixture runtime through the same seam.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An identity mismatch yields `not-run` instead of substituting the resident runtime, and a cue with an unparseable language gets no profile and no gap rather than a guessed language; no profile or cue is special-cased.

## @evidence contracts/development/common.md#meaningful-documentation

The doc states why the runtime is injected, every measured quantity and its basis, both `not-run` conditions, how profiles match, and the ordering and duration premises with their failure effect.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C cues, total text length L, profile/cue language length A and G yielded segmentation items, local work is O(C+L+A+G+P) for P profiles, including language parsing, normalization and streamed counts. The injected runtime owns segmentation cost and termination; an arbitrary iterable can yield unbounded items, so text length alone does not bound work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One call measures one timeline once; the profile index is built per call because profiles arrive with each call and are not known to be equal across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-local indexes hold at most P profiles and one prior end per distinct cue language; normalized lines and each runtime iterable live during measurement. Returned cue records share the runtime/profile segmentation identity objects and retain one outcome per cue. There is no cue/text quota, segmentation timeout or iterator cancellation; the runtime owns any resources hidden in its iterable.
