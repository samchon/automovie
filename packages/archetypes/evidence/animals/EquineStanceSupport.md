# src/animals/EquineStanceSupport.ts#EquineStanceSupport.placed

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

One placed limb per anchor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every row.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceSupport.ts#EquineStanceSupport.folded

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Scales every turn by the share, so share 0 is the release chain itself and the pose is continuous there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the lifting rows.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the chain it is given.

# src/animals/EquineStanceSupport.ts#EquineStanceSupport.moved

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

The rotation is kept and the shift added after it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every row.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceSupport.ts#EquineStanceSupport.heading

## @evidence contracts/development/common.md#meaningful-documentation

States what the heading is and its identity case.

## @evidence contracts/development/implementation.md#principled-implementation

The bearing of the trunk's forward axis on the floor, as one turn about +Y; the trunk's own pitch and roll are left out, so turns and shifts authored in the horse's frame stay level.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bearing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every row that turns or shifts in the horse's frame.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceSupport.ts#EquineStanceSupport.along

## @evidence contracts/development/common.md#meaningful-documentation

States both frames.

## @evidence contracts/development/implementation.md#principled-implementation

The vector turned by `heading`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `heading`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceSupport.ts#EquineStanceSupport.arc

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the rise's shape.

## @evidence contracts/development/implementation.md#principled-implementation

A linear blend plus a half-sine lift that is zero at both ends, so the hoof leaves and meets the floor at its places.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the comfort rows' swings.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceSupport.ts#EquineStanceSupport.blend

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the premise that both share a rotation.

## @evidence contracts/development/implementation.md#principled-implementation

Linear interpolation of the translation; the rows only blend level shifts of one rotation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the lifting and stepping rows.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineStanceSupport.ts#EquineStanceSupport.transfer

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the margin and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each edge's inward signed distance is linear along the segment from the triangle's centroid to the centre of mass, so the farthest admitted point on it has a closed form; the shift moves the centre of mass there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Centroid, three edge bounds, one point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The centroid of a nondegenerate triangle is always inside, so a solution exists; no search or clamp beyond the segment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by the hoof and step-aside rows.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
