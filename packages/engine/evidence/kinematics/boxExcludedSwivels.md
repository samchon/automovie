# src/kinematics/boxExcludedSwivels.ts#boxExcludedSwivels

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the rotation, why each entry is a sinusoid, each bound's sinusoid for both charts, the margin and why every refusal is certain, and every case that refuses nothing.

## @evidence contracts/development/implementation.md#principled-implementation

Rodrigues' formula makes each entry an exact sinusoid in the swivel, so each bound's crossing swivels are a sinusoid's two arccos roots, and an angle's interval maps through the rest frame and the chart exactly as `decomposeJointRotationOnBasis` and `alternateRigJointAngles` read it. The swing cone couples two angles, so it is refused piece by piece of at most a degree, where its closed-form interval bound certainly exceeds it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Each chart's refused arcs are built once (`boxRefusedArcs`) and the test reads both lists.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Sound by construction, never by sampling: an arc is refused only from its sinusoid's roots with the joints' tolerance to spare, and a case the analysis does not cover refuses nothing rather than guessing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations and nine dot products each fit the entries, a few arcs per reading are merged once, and each test is a scan of a handful of merged arcs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit, the arcs, their union and its test are `swivelArcs`'s, shared with a point's bounds, and each bound's sinusoid and interval are `swivelJointReadings`'s, shared with `boxLeastSwivels`; the arcs are built once per rotation and read by every test of its sweep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the two merged arc lists in the returned test only.
