# src/physics/solveXpbdJointTree.ts#solveXpbdJointTree.project

## @evidence contracts/development/common.md#meaningful-documentation

States the projection, the rows, the elimination, when a limit row is instantiated and the termination.

## @evidence contracts/development/implementation.md#principled-implementation

The least mass-weighted displacement meeting every joint row, `[M J^T; J 0]`, eliminated over the body-joint tree leaves first with no fill-in (Baraff 1996; Deul, Kugelstadt, Weiler and Bender 2018), relinearised by Newton's method. The angular rows are MuJoCo's per-degree-of-freedom ones: each locked coordinate always, and each free coordinate while past a bound, as MuJoCo instantiates a joint limit while its distance side (range - q) is below its zero default margin, each row the coordinate's gradient (the dual of readXpbdJointDirections); a swing-twist gate or clinical limit is one row along the turn into it, as MuJoCo's ball-joint limit is one row along the rotation's axis (google-deepmind/mujoco, src/engine/engine_core_constraint.c, mj_instantiateLimit, lines 1312-1325 and 1349-1363 at c6ac13326758a41e3c04c07ef7e7afb38d50b1ea, Apache-2.0, Copyright 2021 DeepMind Technologies Limited). The loop ends by MuJoCo's Newton termination (src/engine/engine_solver.c, inertiaScale lines 508-517, lines 3961-3962 and 4068-4080): the step's decrement 1/2 scale a^T M a, scale the inverse trace of the inertia, below opt.tolerance 1e-8 (src/engine/engine_init.c line 60), or the cap opt.iterations 100 (line 95); a position step dx over the substep h is the acceleration dx / h^2 (Mueller et al. 2020, section 3.3, f = lambda n / h^2).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Visit the tree; per iteration read each joint's rows, eliminate, back-substitute, read the decrement, then take the step or stop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or stop of its own: MuJoCo's solver tolerance and iteration cap, at their defaults; a singular block leaves the poses as they are.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the tree's bodies and joints per Newton step (6x6 body blocks, joint blocks of at most four rows).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each step's elimination gives both its displacement and its decrement.

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

The Jacobians and the right-hand side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/solveXpbdJointTree.ts#solveXpbdJointTree.IStep

## @evidence contracts/development/common.md#meaningful-documentation

States the decrement's units and what taking the step does.

## @evidence contracts/development/design.md#principled-representation

A solved Newton step and MuJoCo's decrement of it, read before the step is taken.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The decrement and the step.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.