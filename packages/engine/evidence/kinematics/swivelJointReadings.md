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

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.interval

## @evidence contracts/development/common.md#meaningful-documentation

States which interval each axis is read by and why the coupled ceiling's highest value bounds every flexion.

## @evidence contracts/development/implementation.md#principled-implementation

The coupled ceiling rises monotonically to its value at the coupling's own flexion (`abductionRange`), so that ceiling holds the abduction's interval at every flexion; the other axes are their own intervals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional over `abductionRange`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The coupling is read by its owner, not restated.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Moved from `boxExcludedSwivels`; read by it and by `boxLeastSwivels` alike.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.cone

## @evidence contracts/development/common.md#meaningful-documentation

States the cone's condition on the two cosines, which sinusoids give them, the alternate chart's sign and every case that gives none.

## @evidence contracts/development/implementation.md#principled-implementation

The cone `swingConeAngle` is `2 acos(cos(f/2) cos(a/2))` and `4 cos²(f/2) cos²(a/2) = (1 + cos f)(1 + cos a)`; the middle angle's cosine is `sqrt(1 - s²)` and the outer angle's vector `x` is that cosine times its own, as the decomposition reads them; the alternate chart's half turns negate both cosines.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three guards and one record of two sinusoids and the limit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact readings of the cone's own formula; a frame whose neutral would change the cosines gives none rather than guessing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the sinusoids the joint's reading already fitted; `boxExcludedSwivels` and `boxLeastSwivels` share it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a record of the reading's own sinusoids and retains nothing.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.coneExceeded

## @evidence contracts/development/common.md#meaningful-documentation

States the certainty, the interval, the chart, the margin and the case that answers false.

## @evidence contracts/development/implementation.md#principled-implementation

Interval arithmetic on closed forms: each sinusoid's range over the interval is exact, `sqrt(1 - s²)` and `x / ρ` are monotone in their arguments, and a product of two non-negative factors is at most the product of their greatest values, so the bound holds at every swivel of the interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two ranges, two cosine ranges, one product and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Certain by construction, never sampled; a middle cosine that may vanish refuses nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per interval.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.coneWithin

## @evidence contracts/development/common.md#meaningful-documentation

States the certainty, the interval, the chart, the margin, why no part of the interval is then refused and the case that answers false.

## @evidence contracts/development/implementation.md#principled-implementation

The same interval arithmetic as `coneExceeded` read the other way: a product of two non-negative factors is at least the product of their least values, so the cone's angle is at most the bound at every swivel of the interval, and every part's `coneExceeded` bound, which reads the product at its greatest, refuses nothing there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared ranges, one least product and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Certain by construction, never sampled; a middle cosine that may vanish certifies nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per interval.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the cosine ranges `coneExceeded` reads, from one private reader.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.ICone

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The cone's two cosines are read off two sinusoids of the swivel, and its limit is one number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members `coneExceeded` and `boxLeastSwivels` read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sinusoids are the reading's own, not copies of other forms.

# src/kinematics/swivelJointReadings.ts#swivelJointReadings.bounds

## @evidence contracts/development/common.md#meaningful-documentation

States each bound's sinusoid for both charts, the result's sign convention and every case that gives none.

## @evidence contracts/development/implementation.md#principled-implementation

The middle angle is `asin` of a sinusoid, so it passes a bound where the sinusoid passes the bound's sine; an outer angle's vector times `sin(δ - β)` is a combination of two sinusoids; the alternate chart's half turn negates the vector and reflects the middle angle, as `alternateRigJointAngles` reads it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch per reading form, each returning its bounds' sinusoids.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact sinusoids, never sampling; a case the analysis does not cover gives none rather than guessing.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Moved from `boxExcludedSwivels`; its refused arcs and `boxLeastSwivels`'s least-violated swivels read the same sinusoids.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh sinusoids and retains nothing.

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
