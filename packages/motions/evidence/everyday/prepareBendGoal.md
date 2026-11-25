# src/everyday/prepareBendGoal.ts#prepareBendGoal

## @evidence contracts/development/common.md#meaningful-documentation

The fitted goal uses the supplied posture and optional same-posture displayed frames of the target and shoulder. It returns the wrist and its flat palm contact in world metres.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist is offset from the original material site by the actual palmar frame. A carried surface supplies its own moving normal and approach tangent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same surface placement and palm alignment consume either a caller's current frames or this goal's own sparse reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller supplies frames of the current unchanged posture. An independent observation uses the original seeded resolver and its actual reader and projection inputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

A carried site reads the target and shoulder from its caller's current displayed pose when available. Otherwise it resolves just those frames. A fixed target needs only its authored point and hand geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller proves that its frames and the independent observation describe the same pose before handing those frames to this private goal builder.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains fixed material geometry and a bound demand. It holds no borrowed frame map or reader after a goal is returned.
