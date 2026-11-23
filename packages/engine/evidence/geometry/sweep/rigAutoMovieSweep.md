# src/geometry/sweep/rigAutoMovieSweep.ts#rigAutoMovieSweep

## @evidence contracts/development/implementation.md#principled-implementation

Sweep-based deformation (Hyun et al. 2005, The Visual Computer 21(8-10):542-550): key sections ride their links or turn halfway at joints, the centre curve and orientations are re-interpolated, and the joint section is rescaled to the rest volume; split into its pose-invariant shape and its per-pose frames and scale.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The spine, orientation, volume and secant are the kernels `compileAutoMovieSweep`, `measureAutoMovieSweepVolume` and `poseAutoMovieSweep` use, so the rig and the record path compute the same surface.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bindings that do not align with the sweep are refused, and volume preservation changes only the joint stations' scale.

## @evidence contracts/development/common.md#meaningful-documentation

States the rest and posed rules, the volume rule and its sources, and every refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compile: one sweep compile, O(1) per registered slot, and for volume preservation the 400 x 256 section moments and the rest volume summed from them. Pose, for N spine points, S stations, F registered planes, L registered scale slots, P probes and K scale knots: O(N) transport plus 64 (N - 1) reflections, O(S) orientation, O(F) plane queries and O(P) four-point probe writes and, with volume preservation, 801 more planes and at most ten volume sums of O(400 + K), plus O(L) scale refresh; nothing allocates. Each probe registers four sample writers, up to 36 shape reads, at most three frame slots and nine scale slots before deduplication. These differentiate the same fixed footprint at four neighbouring parameters; they do not differentiate changes of footprint size across the network.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shapes, rest planes, section moments and the rest volume are computed once; a pose recomputes only what bones move.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the compiled surface, registered frame/scale parameter maps, 24 F frame numbers, 5 L current/rest/girth/staging scale numbers and 12 P current/staging probe outputs, plus four dynamic sample writers and one span per probe. Each writer retains one frame slot and one to three weighted scale terms. Bound rigs retain spine/rotation buffers; volume preservation owns its documented moments and staging arrays. Registration ends at seal and all storage is released with the rig.
