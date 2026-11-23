# src/physics/preparePhysicalContactHooks.ts#preparePhysicalContactHooks

## @evidence contracts/development/common.md#meaningful-documentation

States the excluded and admitted pairs, the filter's two consumers, the shared segment record and the fallback for unidentified colliders.

## @evidence contracts/development/implementation.md#principled-implementation

Builds one unordered edge for each joint-adjacent or declared pair, stored under the earlier segment of the profile order and shared by all shapes of a segment, then maps the world's collider handles to their segments; the predicate is symmetric in its arguments because each edge is looked up from the earlier ordinal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table, one symmetric predicate for both contact response and sensor overlaps; the profile rule for unidentified handles stays isPhysicalPairExcluded's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No body, sensor, material or shape category has its own policy. The two non-null assertions read segments the admitted profile declares for its joints and exclusions, which admission checks.

## @evidence contracts/development/implementation.md#efficient-algorithms

Construction is linear in segments, joints, exclusions and colliders. Each query costs two map lookups and one set membership for identified colliders.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One table of admitted immutable data serves every substep of this bound world; a resumed world rebuilds it from its own restored handles.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The filter borrows the input and binding and owns one record per segment and one entry per distinct pair; queries add nothing, and the records leave with the run.
