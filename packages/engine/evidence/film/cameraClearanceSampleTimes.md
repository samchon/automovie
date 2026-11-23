# src/film/cameraClearanceSampleTimes.ts#cameraClearanceSampleTimes

## @evidence contracts/development/implementation.md#principled-implementation

Inserts admitted causal keys so each interval holds one interpolation segment; endpoint-contained translation and scale then support endpoint obstacle bounds. Overshooting interpolation and open seams are refused instead of hidden by a denser clock. Rotating camera offsets require evaluateCameraClearance's separate arc bound, whose normalized-lerp and scale limits this key enumeration does not remove.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns a per-take function so the clearance compiler validates and collects the take-independent actor and object boundaries once while each take adds only its camera; the loop-seam and boundary helpers stay private because only this clock reads them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No motion, clip or camera is named; each refusal is a stated property of the motion, rotation seams count only for the camera because obstacle bounds are rotation-invariant, and a quaternion seam accepts the negated quaternion because it is the same rotation.

## @evidence contracts/development/common.md#meaningful-documentation

States clock composition, key-segment and endpoint-range premises, the separate rotation bound and its limits, refusals and throwing call, representable-count versus workload limits, and the shared-versus-per-take split.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in fixed-clock samples plus key times times loop cycles, and the per-take sort is `O(T log T)` over that take's instants; a set removes coincident keys so each instant is evaluated once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The validated actor and object boundary set is built once per shot and copied into each take's set, since every take reads the same motions and only its camera clip differs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains the shared set, bounded by the fixed-clock samples plus all actor and object key instants in the shot, until the clearance compiler drops it at the end of the call; each take's array is owned by its caller.
