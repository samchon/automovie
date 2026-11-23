# src/reaction/stuntFallPose.ts#stuntFallPose.offset

## @evidence contracts/development/common.md#meaningful-documentation

States the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

One resolve at the origin; the offset is translation-invariant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve and one subtraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the resolved hips bone.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller keeps the offset.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/stuntFallPose.ts#stuntFallPose.lowest

## @evidence contracts/development/common.md#meaningful-documentation

States the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

One resolve at the origin; the least height over its placed colliders' bounds, the floor audit's own reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve and one minimum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads every collider of every resolved bone.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve, linear in the colliders.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller keeps the height.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/stuntFallPose.ts#stuntFallPose.onto

## @evidence contracts/development/common.md#meaningful-documentation

States the placement.

## @evidence contracts/development/implementation.md#principled-implementation

The root sits under the surface point by the hips' horizontal offset and above it by the lowest bone's depth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moves only the root.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/stuntFallPose.ts#stuntFallPose.rest

## @evidence contracts/development/common.md#meaningful-documentation

States the placement, the sloped plane and why a blend is read itself.

## @evidence contracts/development/implementation.md#principled-implementation

One resolve at the origin gives both the hips' offset and each collider's support against the normal (a sphere's centre less its radius, a capsule's nearer end less its radius, a box's centre less its half extents projected, a hull's furthest vertex); the root follows from them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve, one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads every collider of the posture shown, exactly along the normal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve per placement, linear in the colliders.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each posture is its own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/stuntFallPose.ts#stuntFallPose.feet

## @evidence contracts/development/common.md#meaningful-documentation

States the result's frame.

## @evidence contracts/development/implementation.md#principled-implementation

One resolve of the placed posture; each foot bone's world position and rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve, two reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the resolved foot bones.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller keeps the feet.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/stuntFallPose.ts#stuntFallPose.plant

## @evidence contracts/development/common.md#meaningful-documentation

States the placement, the goals and why.

## @evidence contracts/development/implementation.md#principled-implementation

One resolve at the origin gives the feet and the lowest surface; the root carries the feet's mean onto the planted mean, and each knee bends toward its own resolved place carried forward along the foot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve, one placement, two leg goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The goals are the planted feet themselves; nothing is tuned.

## @evidence contracts/development/implementation.md#efficient-algorithms

One posture resolve per placement.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each posture is its own.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/stuntFallPose.ts#stuntFallPose.at

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

Root equals the wanted hips less the offset.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One subtraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moves only the root.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/reaction/stuntFallPose.ts#stuntFallPose.blend

## @evidence contracts/development/common.md#meaningful-documentation

States what is blended and what is taken.

## @evidence contracts/development/implementation.md#principled-implementation

Linear in each joint angle and the root, the yaw wrapped.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over both ends' joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every joint either end names is blended, a joint one end leaves out from or to its rest.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
