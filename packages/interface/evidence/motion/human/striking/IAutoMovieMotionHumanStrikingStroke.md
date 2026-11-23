# src/motion/human/striking/IAutoMovieMotionHumanStrikingStroke.ts#IAutoMovieMotionHumanStrikingStroke

## @evidence contracts/development/common.md#meaningful-documentation

point: Chamber or via point in world metres. begin: Start of the motion toward the via point, film seconds. end: Arrival at the via point, film seconds.

## @evidence contracts/development/design.md#principled-representation

point: Chamber or via point in world metres. begin: Start of the motion toward the via point, film seconds. end: Arrival at the via point, film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingStroke.ts (StrikingStroke.create, return); striking/StrikingStroke.ts (StrikingStroke.delivery, d); striking/StrikingStroke.ts (StrikingStroke.create, input); striking/punchGeometry.ts (punchGeometry.build).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieSuperposeMinimumJerk.IUnit, IAutoMovieMotionHumanStrikingAim.ITracker identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingStroke.ts#IAutoMovieMotionHumanStrikingStroke.IDelivery

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

World points and a direction, film-second instants, an optional via point with its timing, a speed share and an optional peak speed in m/s; the delivery's span is checked when building.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a punch and a kick (with its chamber) pass to the builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface vector.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingStroke.ts#IAutoMovieMotionHumanStrikingStroke.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and the meaning of an absent value.

## @evidence contracts/development/design.md#principled-representation

The delivery's units, optional tracking, the return in world metres and seconds, an optional own-scan gap and the jointly resolved stop, where null means resolved to meet nothing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the punch and kick laws pass; the gap and scan serve a stroke not resolved jointly, which the strike laws no longer use, and remain for that capability and its CI test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the engine's units and the tracker type.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingStroke.ts#IAutoMovieMotionHumanStrikingStroke.IStroke

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its timebase and frame.

## @evidence contracts/development/design.md#principled-representation

The shown path, the free path and the stop as functions of the film second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three readings the strike laws compose and record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface vector.
