# src/handling/HumanTrunkLean.ts#HumanTrunkLean.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the pivot, the unit, what stays and how a free arm hangs through the hinge.

## @evidence contracts/development/implementation.md#principled-implementation `AutoMovieMotionHumanLean.about` turns the whole body about a world point along its left axis; the point is the midpoint of the two hip joints, which lie on that axis, so both joints stay put and the world leg goals keep the knees and feet where they are. A free arm hangs plumb under gravity rather than turning with the trunk, so its shoulder is carried by the hinge's rotation while the arm keeps its world attitude: its wrist and elbow move by the shoulder's displacement and the hand keeps its rotation, so the hanging hand stays where the trunk does not fold it into the thighs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One axis read, one turn of the body and one translation per hanging arm.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Which arms hang free is the caller's, who knows which reach a target; none by default.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `AutoMovieMotionHumanLean.about`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/HumanTrunkLean.ts#HumanTrunkLean.hang

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and where from.

## @evidence contracts/development/implementation.md#principled-implementation

The joints the arm's goal names, read off the shown pose's bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One demanded bone read.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics read of the arm's three bones per plan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `poseBones`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/HumanTrunkLean.ts#HumanTrunkLean.moving

## @evidence contracts/development/common.md#meaningful-documentation

States what is dropped, when, and why the window's premise fails.

## @evidence contracts/development/implementation.md#principled-implementation

The legs-still window (`HumanSegmentLegs`) reuses leg joints only where root and trunk are unchanged; a hinged base changes both, so it states no such window and its world leg goals hold the legs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test and one rest spread.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A base with no hinge keeps its windows unchanged.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/HumanTrunkLean.ts#HumanTrunkLean.least

## @evidence contracts/development/common.md#meaningful-documentation

States the result, its unit and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A rotation about the hip axis carries the shoulder on a circle, so its squared distance to a wrist is affine in `cos θ` and `sin θ`; the reach condition `A cos θ + B sin θ >= K` holds on the arc `|θ - atan2(B, A)| <= acos(K / hypot(A, B))`, and the least angle in every wrist's arc and the hip's range is the answer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shoulder read per wrist, one arc per wrist, one intersection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The arm is the upper arm and the forearm, as the reach owner `pickUp.reachable` refuses by; out of range is refused with the nearest distance, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One trunk read per wrist and constant arithmetic; no search over angles and no solve.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads its own entry.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/handling/HumanTrunkLean.ts#HumanTrunkLean.IHanging

## @evidence contracts/development/common.md#meaningful-documentation

Names the arm, its three joints and the hand's attitude.

## @evidence contracts/development/design.md#principled-representation

World metres and a world attitude.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `lean` carries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.

# src/handling/HumanTrunkLean.ts#HumanTrunkLean.IWrist

## @evidence contracts/development/common.md#meaningful-documentation

Names the arm, the point and the attitude.

## @evidence contracts/development/design.md#principled-representation

World metres and a world attitude.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `least` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every member is required.
