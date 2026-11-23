# src/animals/EquineBodyPose.ts#EquineBodyPose.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

The anchor is the terminal endpoint in the base model's space; fold is the relative carpus or hock fold in degrees.

## @evidence contracts/development/design.md#principled-representation

An anchor and a fold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A `Limb` member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineBodyPose.ts#EquineBodyPose.IFolded

## @evidence contracts/development/common.md#meaningful-documentation

The chain's five joints are in the rest model's space, which moves with the trunk; each angle turns the bar below its joint and everything under it about the limb's lateral axis, degrees, positive swinging the distal end backward.

## @evidence contracts/development/design.md#principled-representation

A source chain and four joint angles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A `Limb` member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineBodyPose.ts#EquineBodyPose.Limb

## @evidence contracts/development/common.md#meaningful-documentation

Placed or folded.

## @evidence contracts/development/design.md#principled-representation

A discriminated union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The limbs of `IGoal`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineBodyPose.ts#EquineBodyPose.IGoal

## @evidence contracts/development/common.md#meaningful-documentation

The trunk's rigid motion from the rest model into the base model's space, and every limb's state.

## @evidence contracts/development/design.md#principled-representation

One rigid motion and four limbs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `IPrepared.solve` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineBodyPose.ts#EquineBodyPose.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States what each member gives and its frame.

## @evidence contracts/development/design.md#principled-representation

The rest chains and centre of mass in the rest model's space, and the solver.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the stance planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineBodyPose.ts#EquineBodyPose.IPrepared.chain

## @evidence contracts/development/common.md#meaningful-documentation

Returns the solved or folded chain; refuses an unreachable anchor.

## @evidence contracts/development/implementation.md#principled-implementation

A placed limb is the exact oriented limb solve toward its anchor carried into the trunk's frame with the base terminal direction; a folded limb turns its chain joint by joint about the lateral axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per limb state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reach is refused by the limb owner, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per limb.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepared limb solvers serve every call.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh points and retains nothing.

# src/animals/EquineBodyPose.ts#EquineBodyPose.IPrepared.sole

## @evidence contracts/development/common.md#meaningful-documentation

Metres; the direction runs from the bar's start to its endpoint.

## @evidence contracts/development/implementation.md#principled-implementation

A capsule's cap reaches its radius below its endpoint; a cylinder's end disc reaches its radius times the bar's horizontal share, the rim's lowest point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per primitive.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Read from the terminal part.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The terminal parts are read once when prepared.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineBodyPose.ts#EquineBodyPose.IPrepared.solve

## @evidence contracts/development/common.md#meaningful-documentation

Returns the model; refuses an unreachable limb or a part under the floor at the given placement.

## @evidence contracts/development/implementation.md#principled-implementation

Move the axial bones rigidly, pose each limb with `chain`, turn each bar onto its posed direction and emit through the carriers; then measure every part's lowest point under the placement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Trunk, four limbs, emission, floor check.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reach and floor are refused, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four constant-size limb poses, O(B) frames and O(P+A) emission and floor work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepared chains, solvers and carriers serve every sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh model and retains nothing.

# src/animals/EquineBodyPose.ts#EquineBodyPose.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the input and output.

## @evidence contracts/development/implementation.md#principled-implementation

Read the rest FK frames, each limb's five joints from its four bars, the rest centre of mass and the declared carriers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rig read, one chain read per limb, one carrier read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Chains come from the bars, never from a species table.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B+P) once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Everything prepared serves every pose.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the rest frames, chains, carriers and the source model for as long as the caller keeps the solver.

# src/animals/EquineBodyPose.ts#EquineBodyPose.turn

## @evidence contracts/development/common.md#meaningful-documentation

States each argument's unit, axis and sign.

## @evidence contracts/development/implementation.md#principled-implementation

A turn about X by minus the pitch raises +Z, a turn about Z by the roll raises +X, conjugated into the heading's frame, composed about the pivot and followed by the shift.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two axis-angle turns and one translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every stance row.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineBodyPose.ts#EquineBodyPose.point

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Rotation then translation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the stance planner's centre-of-mass and pivot reads.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
