# src/handling/manipulateReach.ts#manipulateReach

## @evidence contracts/development/common.md#meaningful-documentation

States the placement and swing geometry; prepare fixes an unchanged body/hand/rotation and takes each actual digit, world site/normal and metre key depth, returning the wrist's world-metre point.

## @evidence contracts/development/implementation.md#principled-implementation

The chord of a swing about the digit's first joint: a straight digit of length r dropped by d reaches sqrt(r^2 - d^2) ahead.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cold facade invokes the same prepared owner used by manipulation/fingering; one lazy digit record precedes depth-dependent drawback and actual world translation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No offset is chosen: the drawback is the swing's own, from the body's digit and the key's travel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each of at most five supported digits reads skeletal span and rotated tip/direction once per preparation; N subsequent placements perform constant chord/translation work without repeated hand geometry. The cold facade prepares for its one query; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only explicitly unchanged body, side and rotation share digit geometry through a sequence/fingering operation; actual site, normal and depth remain query inputs, with no computed wrist answer reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Cold placement retains nothing. The synchronous sequence/fingering owner retains at most five local digit records until its builder is released before the motion plan returns, without global, pose/time history or external handles.
