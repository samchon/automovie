# src/motion/human/everyday/IAutoMovieMotionHumanBend.ts#IAutoMovieMotionHumanBend.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its meaning, unit and the default an absent value takes.

## @evidence contracts/development/design.md#principled-representation

The target is the shared motion target union, read once at the start; the hand is the shared hand side; the hold is seconds, and a negative hold is refused at plan time, the one invalid value the type does not rule out.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by this law and read only by its plan; the target and hand types are imported from their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field names a scene or body, and every combination of fields is meaningful.

# src/motion/human/everyday/IAutoMovieMotionHumanBend.ts#IAutoMovieMotionHumanBend.Strategy

## @evidence contracts/development/common.md#meaningful-documentation

States what each strategy does to the hips and what `auto` defers to.

## @evidence contracts/development/design.md#principled-representation

A closed union of the three postures the lifting literature compares plus the deferred choice; each concrete strategy keys the `bendLower.HIPS` and `bendLower.HEEL` tables, so no other value can be written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the bend law; read by its parameters, its helpers and the capture cases that sweep the strategies.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Variation enters as table rows keyed by the union, not as members per strategy; `auto` is excluded from the tables by `Exclude`, so it cannot reach the posture code unresolved.

# src/motion/human/everyday/IAutoMovieMotionHumanBend.ts#IAutoMovieMotionHumanBend.IShares

## @evidence contracts/development/common.md#meaningful-documentation

States the origin and the unit; each member gives its direction and sign.

## @evidence contracts/development/design.md#principled-representation

Three shares along the trunk's own axes, scaled by the upper arm, so the hint keeps its place on a short and a long arm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, the least that places a point; read by `arm` and held by `ARM`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required and named by direction, instead of a positional tuple.

# src/motion/human/everyday/IAutoMovieMotionHumanBend.ts#IAutoMovieMotionHumanBend.Arm

## @evidence contracts/development/common.md#meaningful-documentation

Says what the names are and where each is described.

## @evidence contracts/development/design.md#principled-representation

The distinct places an elbow takes about the trunk: hanging, close, behind, in front, across, ahead, wide low and wide high.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eight names, each with a first user among the shipped laws; a law that needs another passes shares.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union that keys the table exhaustively; the names describe the elbow, not an action.

# src/motion/human/everyday/IAutoMovieMotionHumanBend.ts#IAutoMovieMotionHumanBend.ISolve

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame, its unit and what its absence means.

## @evidence contracts/development/design.md#principled-representation

The inputs of the swivel choice of two-bone inverse kinematics: the trunk that carries the shoulder, the wrist's place and, when the hand is turned, its rotation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members read by `solve` and `strain`; the trunk is stated as `arm` states it, so one posture serves the preset and the solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A refusal is an error unless the caller names the preset to fall back on; nothing is defaulted silently.
