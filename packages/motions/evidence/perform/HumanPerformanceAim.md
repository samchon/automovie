# src/perform/HumanPerformanceAim.ts#HumanPerformanceAim.aim

## @evidence contracts/development/common.md#meaningful-documentation

States world-point/normal output, film seconds, own-body frame use and the person's existing reaction-time offset; target failures remain with their original branch owners.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves anatomical regions on actual world bones and prop-local points on their actual prop frame. Performer-frame points use +X left, +Y up and +Z forward from yaw in degrees; only point and virtual-opponent branches need that heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per declared target kind, with shared heading construction only where its values are consumed and the existing self-person delegation retained.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Person, self and prop queries retain their full original frame/admission paths. Point-normal normalization and arithmetic grouping are unchanged; a world point still returns the caller's at reference, and no aim result or callback is memoized.

## @evidence contracts/development/implementation.md#efficient-algorithms

Person/self costs include surface placement and their bone reader; prop costs include articulation/hold resolution. Performer points, default world-point normals and none targets need one sine and cosine each; an explicit world normal needs no heading, and a world point needs no left vector or turn closure. Person/self/prop do no heading work. Overall speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each needed heading's sine and cosine supply its forward vector and, for a performer-frame turn, its left vector; different targets and seconds still invoke their own actual readers and no state is shared across queries.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The resolver retains no state or handle. Results keep their original ownership: fresh computed vectors, a borrowed world at point, or a prop provider's own returned record where supplied.

# src/perform/HumanPerformanceAim.ts#HumanPerformanceAim.frame

## @evidence contracts/development/common.md#meaningful-documentation

States the posture root and heading, measure-derived line heights/range, lazy own-bone reader and optional subject used by self and carried-prop aims.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the posture's world root reference and degree heading, derives fixed standing line heights and range from the body's own measures, and carries the supplied own-bone callback without invoking it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record assembly keeps scalar frame construction separate from potentially expensive bone resolution.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every line and the range is a landmark of the body's own measures, stated with its source; does not normalize, resolve or substitute the caller's body, posture or bone callback.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar arithmetic plus one frame and one heights record; construction performs no FK or limb fit.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This constructor stores no memo; callers such as Ahead own any unchanged-input evaluation scope and invalidation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the new frame/heights records; root, body and callback are borrowed. The returned frame retains those inputs until released, and a retained callback keeps its producer's existing lifetime and read semantics.
