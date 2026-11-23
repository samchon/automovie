# src/posture/HumanFoot.ts#HumanFoot.headingPitch

## @evidence contracts/development/common.md#meaningful-documentation

States world rotation input, degree outputs, shared heading and the past-vertical pitch convention.

## @evidence contracts/development/implementation.md#principled-implementation

Uses heading's original lateral-axis direction and pitch's original forward-axis projection; the one heading feeds the same pitchAt formula as raw pitch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One heading read and one forward-axis read supply the pair, with the pitch formula owned once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No normalization, clamp, range or angle convention changes, and neither angle is cached across rotations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; a consumer of both angles omits the repeated lateral-axis rotation and heading atan2 that separate heading/pitch calls require.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both scalar values derive from this same supplied quaternion within this call; no identity, pose or time key is involved.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh scalar pair and retains no input or state.

# src/posture/HumanFoot.ts#HumanFoot.pivot

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot and every angular convention.

## @evidence contracts/development/implementation.md#principled-implementation

The ankle is the fixed world pivot minus its rotated bone-local offset, including a socket carried by the toe joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation and one rigid-point translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses offset as the sole owner of toe articulation.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses rotation and offset.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFoot.ts#HumanFoot.preparePivot

## @evidence contracts/development/common.md#meaningful-documentation

States fixed inputs, frames, units, defaults and the reader's equivalence to pivot.

## @evidence contracts/development/implementation.md#principled-implementation

Uses exactly rotation's yaw-times-roll prefix, normalization and varying pitch multiplication, then the actual default or explicitly supplied contact minus its rotated socket offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed rotation prefix and socket offset precede one pitch reader of the same rigid transform as pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Calls offset for toe articulation and preserves quaternion multiplication order; no pitch or angle bound changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and evaluation; socket lookup and fixed yaw and roll quaternion construction run once per rocker.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller fixes body, side, socket, heading, toes and roll. Default at remains fixed; an explicitly supplied current contact changes translation alone and is actually subtracted each time, without sharing a placed result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader retains its default contact, socket offset and rotation prefix until its solve/action releases it; explicit current contacts and queried results are not retained.

# src/posture/HumanFoot.ts#HumanFoot.preparePoint

## @evidence contracts/development/common.md#meaningful-documentation

States fixed socket inputs, angular default, world-point result and placement reader.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the articulated ankle-local socket once and uses point's same quaternion rotation and ankle translation for every placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One offset preparation and the shared pointAt rigid transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Toe articulation remains offset's formula; no placement is sampled, rounded or retained.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and evaluation; repeated placements skip socket/rest lookups and the fixed toe rotation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, side, socket and toe flexion fix one local offset for the reader's lifetime; the varying placement is always evaluated.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One reader retains one offset until its owning rocker or action releases it, without query history.
