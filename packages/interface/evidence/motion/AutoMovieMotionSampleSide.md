# src/motion/AutoMovieMotionSampleSide.ts#AutoMovieMotionSampleSide

## @evidence contracts/development/common.md#meaningful-documentation

Joint triples are clinical degrees per second, spins are articulation-frame radians per second and root rates use the pose's parent frame in metres or radians per second. The closed side union chooses a before, after or centred stencil; samplePoseVelocity owns sampling admission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

AutoMovieMotionSampleSide keeps the alternatives closed rather than widening them to arbitrary strings. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Joint triples are clinical degrees per second, spins are articulation-frame radians per second and root rates use the pose's parent frame in metres or radians per second. The closed side union chooses a before, after or centred stencil; samplePoseVelocity owns sampling admission. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical AutoMovieMotionSampleSide contract belongs to interface; packages/engine/src/motion/samplePoseVelocity.ts and packages/engine/src/motion/inertializePose.ts use this boundary. Runtime computation remains with those consumers.
