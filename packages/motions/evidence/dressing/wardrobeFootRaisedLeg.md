# src/dressing/wardrobeFootRaisedLeg.ts#wardrobeFootRaisedLeg

## @evidence contracts/development/common.md#meaningful-documentation

States what stays fixed (the seat and the other foot) and what moves (the working foot presented).

## @evidence contracts/development/implementation.md#principled-implementation

A seated base with a planted opposite foot is admitted first; the trunk then inclines and the working hip and knee flex on one minimum-jerk share up, held, and back, while the root is moved so the seat socket stays where the entry put it, and every entry support but the working foot's stays planted over the whole action.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `wardrobeFoot` as the leg phase its footwear exchange is built on; `wardrobeFoot` reads its `footRaised` and `footLowering` events.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Any base other than a stationary chair with an opposite foot plant is refused. The phase times (0.62 s up, 2.4 s held, scaled by tempo) and the angles (105 degrees of trunk incline, 38 of hip and 6 of knee flexion) carry no cited source in the code; that gap remains.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each sample is one trunk incline, one socket read and a constant joint update.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one plan; shares nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds the entry posture it starts from for its own lifetime.
