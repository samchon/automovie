# src/posture/HumanInteractionMeshSide.ts#HumanInteractionMeshSide.ISide

## @evidence contracts/development/common.md#meaningful-documentation

Names the four corners and their reference orientation.

## @evidence contracts/development/design.md#principled-representation

Four point indices identify the oriented simplex whose determinant must remain positive.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the corners are stored; each reading derives its volume from the current points.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Stores no soft margin or fitted penalty that could trade a side against another constraint.

# src/posture/HumanInteractionMeshSide.ts#HumanInteractionMeshSide.record

## @evidence contracts/development/common.md#meaningful-documentation

States which tetrahedra record a side and the bound each keeps.

## @evidence contracts/development/implementation.md#principled-implementation

A tetrahedron flat on the reference is oriented only by the joggle and records no side: the joggle moves each corner by at most `δ` per axis, so each edge by `2 √3 δ` and the triple product of three edges no longer than twice the extent by at most `3 (2 √3 δ)(2 extent)²`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and one map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The flat bound is derived from the engine's joggle, not chosen.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the tetrahedra, once per adaptation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The volume and the joggle are the engine's.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/posture/HumanInteractionMeshSide.ts#HumanInteractionMeshSide.value

## @evidence contracts/development/common.md#meaningful-documentation

States the reading, its unit and its sign.

## @evidence contracts/development/implementation.md#principled-implementation

The scalar triple product divided by the fixed double face area has the signed volume's orientation and the units of altitude.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One triple product.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The line filter uses the same edge triple product.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/posture/HumanInteractionMeshSide.ts#HumanInteractionMeshSide.gradient

## @evidence contracts/development/common.md#meaningful-documentation

States the linearisation and the bound.

## @evidence contracts/development/implementation.md#principled-implementation

The signed determinant's gradient is the opposite face normal at each corner, divided by the fixed reference area.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three edges, four gradients, one row.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

All four vertices contribute, including the negative sum at the origin vertex.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The scalar altitude and its gradient share the same local metric.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function.

# src/posture/HumanInteractionMeshSide.ts#HumanInteractionMeshSide.limit

## @evidence contracts/development/common.md#meaningful-documentation

States that the admissible maximum can cut a step even when its end is oriented.

## @evidence contracts/development/implementation.md#principled-implementation

Expands the trilinear determinant in cubic Bernstein coefficients. The convex hull omits safe elements; the shared cubic root owner finds the earliest contact with 20% of the current determinant as in Li et al. 2020 technical supplement §4.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One element scan, each either passing its coefficient lower bound or reducing the allowed fraction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Endpoint signs alone do not rule out intermediate inversion; nonlinear merit still verifies strict positivity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per element before the root search, which is needed only where the Bernstein interval spans the barrier.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The solver uses the same tetrahedra and determinant as the barrier.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains only the scalar fraction.
