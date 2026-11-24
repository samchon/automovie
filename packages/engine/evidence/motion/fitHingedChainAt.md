# src/motion/fitHingedChainAt.ts#fitHingedChainAt

## @evidence contracts/development/implementation.md#principled-implementation

Tolani, Goswami and Badler 2000: the hinge angle is fixed by the span and the swivel is the remaining degree of freedom, so a given swivel determines the chain in closed form; the decomposition, clamp and orientation are the fit's own owners.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareHingedChainAt owns the preparation; this pose one branch at one swivel, decomposes and clamps both joints, and orients the end joint.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No candidate is scored and no other swivel is visited; an unreachable target reports its shortfall rather than claiming a reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation, one branch root solve and one pose, two decompositions and clamps, and one final orientation: constant work per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call evaluates its own request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the preparation ends with the call.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs read and ignored, the swivel frame, the result and the null cases.

# src/motion/fitHingedChainAt.ts#fitHingedChainAt.free

## @evidence contracts/development/common.md#meaningful-documentation

States what the angles are (before the range of motion, no placement), how each joint is read, the source naming them, the units and the null answer.

## @evidence contracts/development/implementation.md#principled-implementation

Tolani, Goswami and Badler 2000 (Graphical Models 62:353, sections 3.2.3-3.3): the joint angles theta_1 to theta_7 as functions of the swivel, with the elbow a pure hinge and the wrist a spherical joint. The root and mid joints are the fit's own decomposition of the swivel's pose before its clamp (shared with `fitHingedChainAt`); the end joint is the requested rotation relative to the hinge-only mid bone on its own clinical basis and domain, as `orientChainEffector` reads that rotation before its twist split and projection.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The chain's preparation, the swivel's pose and the decompositions are the fit's own functions; no clamp, projection or placement runs, so a caller needing only the angles pays for no pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant or tolerance; the branch is clamped to the branches the target has, as the fit clamps it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One chain preparation, one swivel pose and three decompositions per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning.

# src/motion/fitHingedChainAt.ts#fitHingedChainAt.IFree

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its joint, its unit and when the end joint is null.

## @evidence contracts/development/design.md#principled-representation

Three clinical joint poses in degrees, Tolani's theta_1 to theta_7 grouped by joint, the end joint read as one spherical joint whose twist a distally twisting limb takes in its mid bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the hinged chain's evaluation at a swivel; read by the arm's attitude choice (`AutoMovieMotionHumanArmReach`) through `HumanLimbAt.free`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The end joint is null, not a zero pose, when no rotation is requested, so a reader cannot take a missing wrist for a centred one.