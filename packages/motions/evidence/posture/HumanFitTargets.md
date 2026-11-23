# src/posture/HumanFitTargets.ts#HumanFitTargets.rows

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, units and row families.

## @evidence contracts/development/implementation.md#principled-implementation

Relative point velocity is R_on^-1(v_eff-v_on_at_eff), and angular velocity is R_on^-1(omega_eff-omega_on). Rotation log rows differentiate with the inverse right SO(3) Jacobian (Sola et al. 2018, arXiv:1812.01537, eq.117); a point ball is one Euclidean-distance inequality.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target frame and its variable twists, then each requested row family.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps metric point radii, moving reference frames and antiparallel-normal refusal; identical effector/anchor point twists are read once but their original subtraction and rotation remain, including nonfinite-result propagation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(t*n) time and coefficient storage for t targets and n variables with fixed axis counts; each current anchor inverse and angular derivative column is produced once rather than once per variable or selected axis.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one current target frame and its anchor inverse across relative motions; full rotation/normal derivative columns serve all selected axes, and callbacks reuse that same unchanged model reading while new trial readings are recomputed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Model callbacks retain their target and current reading/frame until the model is released; temporary derivative columns are consumed into owned scalar coefficients, and no prior-reading or global body cache is kept.

# src/posture/HumanFitTargets.ts#HumanFitTargets.misses

## @evidence contracts/development/common.md#meaningful-documentation

Gives units, frame and ordering.

## @evidence contracts/development/implementation.md#principled-implementation

Measures the same goal-frame quantities and ball inequality the rows linearise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Point errors followed by optional rotation and normal errors.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The physical radius is subtracted from Euclidean distance only; numerical acceptance remains the merit's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per target.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares frame and rotation owners with the rows.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitTargets.ts#HumanFitTargets.residual

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes actual distance from permitted radius.

## @evidence contracts/development/implementation.md#principled-implementation

Euclidean goal-frame distance and quaternion or normal geodesic error.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame and two norms.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A caller can compare the actual distance with its declared bound.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the row and merit frame.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitTargets.ts#HumanFitTargets.turn

## @evidence contracts/development/common.md#meaningful-documentation

Names direction, frame and unit.

## @evidence contracts/development/implementation.md#principled-implementation

Principal quaternion logarithm from atan2 of sine and cosine of the half-angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative quaternion and scale.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Quaternion signs select the same principal turn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rows and merit share this function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitTargets.ts#HumanFitTargets.tilt

## @evidence contracts/development/common.md#meaningful-documentation

Both normals use the goal frame; antiparallel normals select the first transverse axis for reporting.

## @evidence contracts/development/implementation.md#principled-implementation

atan2 of the two unit normals' cross length and dot product.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the effector normal, then its principal turn.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An opposite normal reports a half turn, never zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by row readings and final errors.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitTargets.ts#HumanFitTargets.across

## @evidence contracts/development/common.md#meaningful-documentation

States the normal premise and orthonormal result.

## @evidence contracts/development/implementation.md#principled-implementation

Crosses the normal with its least-aligned Cartesian basis, then completes the frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One basis selection and two crosses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The least-aligned basis prevents a zero cross.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rows and merit project onto the same axes.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
