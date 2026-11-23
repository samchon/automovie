# src/kinematics/swivelJointReadings.ts#swivelJointReadings

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the rotation, why each entry is a sinusoid and how each angle is read from the entries.

## @evidence contracts/development/design.md#principled-representation

An angle is the sinusoid of its sine, or the two sinusoids of its vector with the sign its rest-relative angle takes; a joint is its three angles.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reading of one joint and the rest-relative form of a clinical interval: what a range's refused arcs and an immobile axis's roots share.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Exact fits from three rotations, never sampling; the composition order is the decomposition's own.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.Axis

## @evidence contracts/development/common.md#meaningful-documentation

Names the three clinical axes.

## @evidence contracts/development/design.md#principled-representation

The interface's own three axis names.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No alias or index stands for an axis.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.IRead

## @evidence contracts/development/common.md#meaningful-documentation

States both forms and what `turn` is.

## @evidence contracts/development/design.md#principled-representation

The middle angle is `asin` of one entry and an outer angle `atan2` of two, as the decomposition reads them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One sinusoid, or two and a sign.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The two forms are a discriminated union; neither is optional in the other.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.of

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the rotation and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The entries `axis_i · (R axis_j)` are exact sinusoids of the swivel, fitted from three rotations; a distal twist composes Ry(a)·Rx(f)·Rz(t), with flexion in the middle, a proximal one Rz(t)·Ry(a)·Rx(f), and an explicit flexion-first one Rx(f)·Ry(a)·Rz(t), both with abduction in the middle, as `decomposeJointRotationOnBasis` reads them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The entries are sampled once and each axis names the entries it reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling beyond the three rotations that determine a sinusoid; the handedness correction is the decomposition's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations and nine dot products each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit is `swivelArcs.fitted`; one reading serves every bound and root of its joint.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned record.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.rig

## @evidence contracts/development/common.md#meaningful-documentation

States the conversion and the order of the result.

## @evidence contracts/development/implementation.md#principled-implementation

A clinical angle is the neutral plus the sign times the rest-relative one, inverted at both ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two ends converted and ordered.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent frame is the identity map, not a guess.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
