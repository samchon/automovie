# src/film/compileCameraClearanceReports.ts#compileCameraClearanceReports

## @evidence contracts/development/implementation.md#principled-implementation

Builds static boxes and moving root-centred deformation spheres from the validated portable part/proxy representation. Key refinement and interpolation admission supply endpoint-bound premises for represented motion, while morph weights are refused without an expansion bound. External asset bytes and renderer-only deformation are not inspected, and the evaluator's normalized-lerp limitation still applies.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This adapter owns reading the shot, measuring obstacles and addressing violations, while the clock, the deformation bound and the interval sweep live in `cameraClearanceSampleTimes`, `cameraClearanceDeformationRadius` and `evaluateCameraClearance`, each a pure function reused by no other path; the split keeps the file under the size limit and each bound testable on its own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no camera, node or model; an absent model, an unmeasurable bound or an unboundable motion is refused rather than skipped or given a stand-in size, and the collector baseline lets a caller pass a collector holding earlier items without them being read as clearance failures.

## @evidence contracts/development/common.md#meaningful-documentation

States which takes are inspected, when `runtime` is read, how each obstacle is bounded, every refusal and its effect on the return value, and that earlier collector items are the caller's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validates and measures each staged node's model once, then caches obstacle states per distinct instant. State construction includes object clip-sequence sampling and actor sampleMotion work for animated nodes; each take also samples its camera and delegates the interval/part/obstacle sweep. Total cost includes those sampled track, pose and geometry populations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Obstacle states depend only on the shot-local instant, the staged nodes and the shot's motions, which every take shares, so they are cached by exact instant across takes; the actor and object part of the clock is built once per call, and models are measured once per node rather than per take.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The obstacle-state cache and measured obstacles are locals released when the call returns, bounded by distinct instants across takes times staged nodes; returned reports are owned by the caller and hold only their sample times and findings, not the cached boxes.
