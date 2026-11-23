# src/motion/distalTwistRange.ts#distalTwistRange

## @evidence contracts/development/common.md#meaningful-documentation

States what is read from the preparation, the frame of the carried axis, the premise on the branch's mid rotation and every null case.

## @evidence contracts/development/implementation.md#principled-implementation

The zero-twist condition is `solveDistalTwist`'s own equation, `P cos z - Q sin z = 0` with `P` and `Q` the twisted carried axis's components on the rest-carried abduction and flexion axes, and `P sin z + Q cos z > 0` selects the reading at the zero itself; the range is the constraint's clinical interval taken to rest-relative degrees, the angle the mid joint's twist composes about its axis.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The range, the two directions, the carried axis, then the shared reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A joint the analysis does not cover returns null rather than a guess; nothing here accepts a pose, the fit scores the swivel chosen.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work: three posed swivels through `distalTwistSwivelRange.of`, each four quaternion products and one vector rotation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed effector readings are the caller's shared `solveDistalTwist.prepare` record; the interval lift is `swivelJointReadings.rig`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned test, which its fit releases.
