# src/exercise/ExerciseKey.ts#ExerciseKey.standing

## @evidence contracts/development/common.md#meaningful-documentation

States what the key holds and who owns its identity.

## @evidence contracts/development/implementation.md#principled-implementation

The stand law's relaxed arms, the one owner of a hanging arm.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The workout plan builds it once and keeps it for its spans; nothing is cached here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.shown

## @evidence contracts/development/common.md#meaningful-documentation

States what the key holds and why a law reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The pose's own clinical angles, the joints a key holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the pose's joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent angle is zero, as the pose states it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the pose's joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.from

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Starts from the body's relaxed standing, so the fingers and every joint not named keep their standing angles.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the two sides and three trunk joints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent member takes the value its type states; nothing is inferred.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the body's relaxed standing (`standing`).

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.stood

## @evidence contracts/development/common.md#meaningful-documentation

States the three inputs and what the angles keep.

## @evidence contracts/development/implementation.md#principled-implementation

The thigh leans back by the knee's flexion less the shank's lean, so the hip's flexion is the pitch plus that, and the ankle's dorsiflexion is the shank's lean.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three sums.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; a combination past a joint's range is the kind table's to avoid.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.mirror

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The left and right bones exchange their angles, which are clinical and so already mirrored; the roll, the turn and the midline joints' lateral bend and twist change sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the bones.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in bones.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.mean

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

Forward kinematics of the posture's joints, without limb goals, then the mean of the named origins.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One supplied or raw resolved map and one sum in the given pin order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bone the rig lacks throws with its name.

## @evidence contracts/development/implementation.md#efficient-algorithms

The default resolves the trunk; a supplied synchronous map removes repeated resolution, leaving one pass over the named pins.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller may lend only a map resolved for this body and posture whose demand contains every named bone or socket bone; no map is retained here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.at

## @evidence contracts/development/common.md#meaningful-documentation

States the two kinds of pin and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A socket is placed on its bone by the body's own surfaces, as a held prop's grip is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A bone the rig lacks throws with its name.

## @evidence contracts/development/implementation.md#efficient-algorithms

A requested bone origin is one map read; a socket uses one actual point rotation/addition, omitting the full frame's unread normal/forward rotations and wrapper.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual resolved bone and body socket pass to the shared canonical surface.point expression; the caller's map is borrowed synchronously and no placed point is cached.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.posed

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and where the root is.

## @evidence contracts/development/implementation.md#principled-implementation

The key's tilt and joints with its turn added to the heading and no limb goal, so the joints alone say where the limbs are.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse or cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/exercise/ExerciseKey.ts#ExerciseKey.pinned

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and what the result keeps.

## @evidence contracts/development/implementation.md#principled-implementation

The root is the point less the bones' mean on the key posed at the origin, so the support stays where it is whatever the joints do; the lift is added in the stature's unit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One forward kinematics and one difference.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only the mean is kept: two pinned bones that the joints move apart each move by half of it, which the kind tables avoid by pinning a pair only in a symmetric key.

## @evidence contracts/development/implementation.md#efficient-algorithms

Full canonical admission remains; an explicit demand computes only its ancestor closure before the pin mean, while omitted demand retains full FK.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one exact map of the posed key is consumed synchronously by mean; no pose or query history is kept.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
