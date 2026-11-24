# src/physics/AutoMoviePhysicalJointChart.ts#AutoMoviePhysicalJointChart.angles

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the output's order and units.

## @evidence contracts/development/implementation.md#principled-implementation

Shoemake 1994 Tait-Bryan extraction from the rotation matrix, with the aligned case resolved onto the first axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Matrix, parity, three atan2 readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A repeated axis throws instead of picking one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array; retains nothing.

# src/physics/AutoMoviePhysicalJointChart.ts#AutoMoviePhysicalJointChart.nearest

## @evidence contracts/development/common.md#meaningful-documentation

States the reading of a joint whose locked axes lead its order, then both triples and the choice for any other joint.

## @evidence contracts/development/implementation.md#principled-implementation

A joint whose locked axes lead its order moves only on `R_j(b) R_k(c)` (or `R_k(c)`): `b` is read from the last axis's image, `R_j(b) e_k = cos b e_k + sin b (e_j x e_k)`, and `c` as the twist about `e_k` of `R_j(-b) R` (the swing-twist decomposition, Dobrowolski 2015), which has no singularity at a quarter turn of the middle axis where the extraction trades a locked first angle against the twist. Any other joint: a Tait-Bryan chart covers each rotation twice away from the aligned case, and the joint's ranges pick the branch its coordinates live on. An angle and the same angle a whole turn away are one rotation, so each angle is read at the turn nearest its range, and a half turn on a range ending at -pi does not depend on the sign rounding gave it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mark the free axes; a leading-locked joint takes the family reading, any other joint extracts and forms the twin; each angle is taken at its turn nearest the range, and the two branches are compared by distance.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The family reading is chosen by the joint's own free and locked axes, not by a consumer; for any other joint both branches are measured and neither is assumed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array; retains nothing.

# src/physics/AutoMoviePhysicalJointChart.ts#AutoMoviePhysicalJointChart.compose

## @evidence contracts/development/common.md#meaningful-documentation

States the composition.

## @evidence contracts/development/implementation.md#principled-implementation

Three axis-angle quaternions multiplied in order, the rig's own composition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two products.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh quaternion; retains nothing.

# src/physics/AutoMoviePhysicalJointChart.ts#AutoMoviePhysicalJointChart.directions

## @evidence contracts/development/common.md#meaningful-documentation

States what each vector is and its frame.

## @evidence contracts/development/implementation.md#principled-implementation

For q = R_i(a) R_j(b) R_k(c), dq/dt carries a about e_i, b about R_i(a) e_j and c about R_i(a) R_j(b) e_k.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One running product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh vectors; retains nothing.

# src/physics/AutoMoviePhysicalJointChart.ts#AutoMoviePhysicalJointChart.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

States what a chart reading needs of a joint and when the chart is absent.

## @evidence contracts/development/design.md#principled-representation

The free axes' ranges in radians and the chart's composition order, the two fields `IAutoMoviePhysicalJoint` declares for them, so a physical joint and a geometry joint with a chart are both read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `nearest` and by `measurePhysicalJointLimits`; nothing else is required of a joint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field is copied or restated: the axis type and the order type are the interface's own.

# src/physics/AutoMoviePhysicalJointChart.ts#AutoMoviePhysicalJointChart.IRange

## @evidence contracts/development/common.md#meaningful-documentation

States the free axis and its range's unit.

## @evidence contracts/development/design.md#principled-representation

The axis and its inclusive range in radians, picked from `IAutoMoviePhysicalJointAxis`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members the chart's branch choice reads; motor and channel fields stay with the physical axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A `Pick` of the interface's own axis record, not a restated one.
