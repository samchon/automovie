# src/climbing/treeLimbs.ts#treeLimbs.IBole

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

The axis's foot, its height and the radius.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the climb reads of the trunk.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by read.

# src/climbing/treeLimbs.ts#treeLimbs.IBranch

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit.

## @evidence contracts/development/design.md#principled-representation

The root on the trunk face, a unit direction, the length, the radius, the frame load and the seat.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the climb reads of a branch.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by read.

# src/climbing/treeLimbs.ts#treeLimbs.ITree

## @evidence contracts/development/common.md#meaningful-documentation

States the members.

## @evidence contracts/development/design.md#principled-representation

The bole and the branches from the lowest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The whole reading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by read.

# src/climbing/treeLimbs.ts#treeLimbs.read

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Transforms each bar's frame to the world and takes its root half a length in.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission, then one pass over the affordances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a tree it cannot read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the affordances.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/climbing/treeLimbs.ts#treeLimbs.on

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

The root plus the direction times the distance plus up times the lift.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A distance past the tip is clamped to it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/climbing/treeLimbs.ts#treeLimbs.face

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

The axis point turned out by the radius and the slide's angle on the round face.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One turn and one sum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The point lies on the round face, not a tangent plane.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/climbing/treeLimbs.ts#treeLimbs.limit

## @evidence contracts/development/common.md#meaningful-documentation

States the cantilever scaling.

## @evidence contracts/development/implementation.md#principled-implementation

A cantilever's root moment is load times distance, so the bearable load scales inversely with the distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ratio.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A load at the root is bounded by the nearest finite distance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/climbing/treeLimbs.ts#treeLimbs.refusal

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and result.

## @evidence contracts/development/implementation.md#principled-implementation

One refusal for a tree that cannot carry the climb.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds one record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names the actual parameter and value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
