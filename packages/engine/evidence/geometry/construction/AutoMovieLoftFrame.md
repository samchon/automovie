# src/geometry/construction/AutoMovieLoftFrame.ts#AutoMovieLoftFrame.horizontal

## @evidence contracts/development/implementation.md#principled-implementation

Origin (0,y,0) with +X/+Z planar axes makes station equal world height and v-cross-u point upward.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal record defines the shared unframed-layer convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The given height is preserved without offsets or input-specific frame choices.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the world-height units and default-layer role.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constructs three fixed triples in constant work and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure frame constructor owns no coordinated or cached work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns all returned tuples; the function retains none.

# src/geometry/construction/AutoMovieLoftFrame.ts#AutoMovieLoftFrame.place

## @evidence contracts/development/implementation.md#principled-implementation

Applies origin+x*u+z*v, the affine map that defines the section chart.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The three coordinate formulas expose placement without matrix allocation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not renormalize axes or discard their supplied scale; geometric frame admission belongs to the producer.

## @evidence contracts/development/common.md#meaningful-documentation

Gives planar/world units and the basis-preserving transformation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed three-component affine arithmetic and one tuple take constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One point placement has no interval preparation or shared effects to coordinate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh world tuple and keeps no reference to the frame.

# src/geometry/construction/AutoMovieLoftFrame.ts#AutoMovieLoftFrame.local

## @evidence contracts/development/implementation.md#principled-implementation

Dot products of p-origin against orthonormal u/v give planar projection coordinates; with a nonorthonormal interpolated basis these are dot coordinates, not the affine inverse of place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One displacement and two dot products keep projection at the frame owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Discards the off-plane component by the declared projection rather than moving a ring or solving a hidden corrected frame.

## @evidence contracts/development/common.md#meaningful-documentation

Names the inherited-ring use and explicitly states the orthonormal-basis premise and its limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic allocates one displacement triple and one returned pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both coordinates share the same p-origin displacement.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the new pair escapes; frame and point remain unmodified and unretained.

# src/geometry/construction/AutoMovieLoftFrame.ts#AutoMovieLoftFrame.interpolate

## @evidence contracts/development/implementation.md#principled-implementation

Cubic Hermite interpolates origin; a relative rotation logarithm, exponential and inverse right Jacobian interpolate orientation with endpoint angular velocities on admitted orthonormal frames.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Translation and rotation share the interval parameter while separate local helpers own fixed-size rotation algebra.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing angular velocities use the constant relative turn; near-identical axes and absent or sub-1e-12 total angular velocities take the explicit still branch, which reuses a's axes.

## @evidence contracts/development/common.md#meaningful-documentation

Gives parameter range, tangent/angular units, omitted-velocity meaning and the still-branch ownership/tolerance here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed-size 3x3 rotation operations and one Hermite origin use constant work/storage, with the still branch avoiding rotation construction.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares origin basis values and relative rotation within this reading; repeated interval queries reconstruct that local preparation rather than using a cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Rotation matrices and vectors are local; the output owns its origin and normally new axes, but borrows a's axes in the still branch.

# src/geometry/construction/AutoMovieLoftFrame.ts#AutoMovieLoftFrame.rate

## @evidence contracts/development/implementation.md#principled-implementation

Maps the principal relative rotation logarithm from a's body frame to world axes and divides by the nonzero station span; orthonormal endpoint frames are required.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative-turn calculation returns the world angular velocity consumed by chain frame interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the principal turn in [0,pi], not an inferred multi-turn history; zero or ill-scaled spans are not repaired here.

## @evidence contracts/development/common.md#meaningful-documentation

States radians per station unit, world-axis convention and constant-turn interpretation.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of 3x3 operations and three divisions take constant time and storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The local rotation matrix/logarithm supplies all three returned components; no inter-query turn cache is retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the new angular-velocity triple escapes; endpoint frames and local matrices are not retained.
