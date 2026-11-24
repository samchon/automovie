# src/physics/solveXpbdJointTree.ts#solveXpbdJointTree.project

## @evidence contracts/development/common.md#meaningful-documentation

States the projection, the rows, the elimination and the stopping rule.

## @evidence contracts/development/implementation.md#principled-implementation

The least mass-weighted displacement meeting every joint row, `[M J^T; J 0]`, eliminated over the body–joint tree leaves first with no fill-in (Baraff 1996; Deul, Kugelstadt, Weiler and Bender 2018), relinearised by Newton's method.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Visit the tree, read each joint's rows, eliminate, back-substitute, displace; repeat while the worst row is above its tolerance and still falls.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No iteration count: it stops when every row is within the precision one more step can reach, or when a step no longer lowers the worst row; a singular block leaves the poses as they are.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the tree's bodies and joints per Newton step (6x6 body blocks, joint blocks of at most four rows).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each joint's rows are read once per step and shared by the elimination and the stopping test.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the tree's dynamic bodies' poses; the nodes are released at return.

# src/physics/solveXpbdJointTree.ts#solveXpbdJointTree.IVisit

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

A tree edge with its two bodies.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a joint's rows read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/solveXpbdJointTree.ts#solveXpbdJointTree.IJointRows

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its frame.

## @evidence contracts/development/design.md#principled-representation

A joint's linearised constraint rows on its two bodies and their right-hand side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Jacobians, the right-hand side and the worst row's ratio to its tolerance.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
