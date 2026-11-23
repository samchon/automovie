# src/physics/AutoMoviePhysicsCache.ts#AutoMoviePhysicsCache

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes native restart snapshots from sampled replay records, describes producer-enforced retention bounds and makes the mutable ownership boundary explicit. Frame clocks use film seconds and physical records use their interface-defined SI units.

## @evidence contracts/development/design.md#principled-representation

Stores completed fixed-step frames beside native, controller and balance checkpoints because resumption requires all three state owners. The constructor records identity, rate and duration; admission belongs to simulation or archive decoding, and at rejects invalid time or incomplete frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Engine owns the mutable cache populated by simulation and read by playback, tracking and archive encoding; interface owns the shared records. Separate support predictions and measured contact receipts preserve their different meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Body and segment identifiers address runtime data without fixing a particular skeleton. Readonly properties retain mutable arrays and maps intentionally for producers; direct writes can violate frame or checkpoint consistency and are not an admission API.

# src/physics/AutoMoviePhysicsCache.ts#AutoMoviePhysicsCache.prototype.at

## @evidence contracts/development/common.md#meaningful-documentation

Documents time/frame failures, the cross-frame schema premise and ownership of the interpolated result.

## @evidence contracts/development/implementation.md#principled-implementation

Selects floor/ceil sample frames, linearly interpolates position and linear/angular velocities, and uses Quaternion.slerp for shortest-arc unit rotations. Simulation producers supply complete SI records with a common schema.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cache addressing stays here while Vector3 and Quaternion own interpolation; no native solver participates in a read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The two asserted next-frame lookups rely on producer-maintained body/segment coverage. The public mutable container does not admit arbitrary direct writes, so a manually corrupted schema can still fail during lookup.

## @evidence contracts/development/implementation.md#efficient-algorithms

For s cached segments, one traversal emits O(s) segment records in O(s) time and space. The scalar time selects two frames; it is not the input dimension driving traversal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses completed frames without advancing physics or copying the full film. Each query emits a fresh interpolated frame and does not retain a time-indexed result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The containing cache retains the complete film and checkpoints until its owner releases it. This read retains no additional state; its O(s) returned frame belongs to the caller.

# src/physics/AutoMoviePhysicsCache.ts#AutoMoviePhysicsCache.prototype.ownershipAt

## @evidence contracts/development/common.md#meaningful-documentation

Defines local film seconds, last applicable authority transition, invalid-time rejection and the missing-segment failure.

## @evidence contracts/development/implementation.md#principled-implementation

samplePhysicalOwnership validates finite time in [0,duration] and scans backward for the matching body/bone transition at or before that instant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Live and archived readers delegate to the same transition selector, so substep authority changes have one interpretation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads recorded native transitions instead of reconstructing contact activation or return completion from an authored clock.

## @evidence contracts/development/implementation.md#efficient-algorithms

For e retained ownership events the backward scan is O(e) worst-case and O(1) additional space; it stops at the first applicable matching event.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the retained event history without advancing physics or caching a second event index.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The lookup retains no new state; the containing cache or playback reader owns the event history for its lifetime.
