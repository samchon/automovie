# src/physics/solveXpbdJoints.ts#solveXpbdJoints.positions

## @evidence contracts/development/common.md#meaningful-documentation

States the tree solve per articulation and the block correction of the loop joints.

## @evidence contracts/development/implementation.md#principled-implementation

Each articulation's joints projected together by the tree's direct Newton solve (`solveXpbdJointTree`, Baraff 1996); each loop joint by block point and rotation corrections toward the anchor and the admitted rotation (projectPhysicalJointRotation, limitPhysicalSwingTwist).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build the joints' forest; its trees, then one loop over the loop joints: anchor, then rotation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Joints between two kinematic bodies are skipped; limits are the profile's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in joints per Newton step and per pass.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each pass reads the current poses; nothing carries over.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.

# src/physics/solveXpbdJoints.ts#solveXpbdJoints.motors

## @evidence contracts/development/common.md#meaningful-documentation

States the tree solve, the coupled rows of the remaining joints, the implicit damper and its cap.

## @evidence contracts/development/implementation.md#principled-implementation

Trees by the articulated-body algorithm; each remaining joint's attachment and motor velocity rows as one linear system (J M^-1 J^T + diag(0, 1 / (h c))) x = rhs, solved directly; a capped motor becomes a fixed impulse.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The forest belongs to solveXpbdArticulation; here one loop over the remaining joints: assemble the block by its unit responses, solve, clamp, apply.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A motor without damping or torque is skipped; a singular block applies nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

The trees cost solveXpbdArticulation's linear sweeps; at most six unknowns and three re-solves per remaining joint.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Motors are reset by their owner each step.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.
