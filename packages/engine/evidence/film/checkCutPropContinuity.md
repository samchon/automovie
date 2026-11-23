# src/film/checkCutPropContinuity.ts#checkCutPropContinuity

## @evidence contracts/development/implementation.md#principled-implementation

The trim end and next trim start are the shot-local limits at a hard cut. Playback supplies the sampled values. The outgoing inclusive sample represents the left limit only when the winning track neither starts, steps nor wraps at the cut. Same-stage addresses share their staged coordinate frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This gate owns editorial boundary checks and distance metrics, delegating track validation and interpolation to the same sequence sampler as object playback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no expected prop values in the plan. Missing values, unsupported overlaps and exact outgoing discontinuities are named instead of assuming staged defaults or subtracting a frame.

## @evidence contracts/development/common.md#meaningful-documentation

States prerequisites, requirement-list order, failure paths, and which side of each trim the continuity check reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each used entry side samples its clips at most once, plus one track scan and STEP-key checks on outgoing sides. Each comparison reads two indexed channels and visits their sampled components.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All requirements for one entry side share its playback sample and its discontinuity index, including a failed sample. Separate entry sides may use different source times.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The compiled cut demands, sampled vectors and pending findings are local to the call. Findings retain addresses and measured differences or fault text, without retaining clips or a scene.
