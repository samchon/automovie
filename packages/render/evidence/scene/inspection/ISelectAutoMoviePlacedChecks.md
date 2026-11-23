# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Names the sample clock, the output rate used for the previous output frame and each declaration list.

## @evidence contracts/development/design.md#principled-representation

The sample time and the output rate define the evaluated pair. Lists stay separate by relation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A production passes the placed sample's scene and time and its own declarations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No previous visit or cached history is part of the input, so forward and reverse queries are identical.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.IRule

## @evidence contracts/development/common.md#meaningful-documentation

Names the report key, delivery requirement, source path, entity paths and optional received evidence.

## @evidence contracts/development/design.md#principled-representation

The same fields form the observer's check envelope.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nothing beyond the envelope is required.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Received evidence is optional and only supplements a measurement.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.IRule.contact

## @evidence contracts/development/common.md#meaningful-documentation

States what evidence is returned, for which pair and second, and that it is optional.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the producer that supplies it answers.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

Defines limits in metres and the phase list.

## @evidence contracts/development/design.md#principled-representation

A rolling or transferring contact is a sequence of phases, each with its own socket, support and anchor.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The limits are the observer's support limits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Outside every phase the support is released and unchecked.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.ISupportPhase

## @evidence contracts/development/common.md#meaningful-documentation

Names the clock, the observed socket, the support frame and the anchor.

## @evidence contracts/development/design.md#principled-representation

The socket origin is the contacting point and the anchor is fixed in the support's frame, so a moving support carries its target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Matches the observer's native support sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The anchor is authored, never the observed point.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.IGrip

## @evidence contracts/development/common.md#meaningful-documentation

Defines limits in metres and radians and the window list.

## @evidence contracts/development/design.md#principled-representation

Each window binds one hand socket, prop and expected relative frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The limits are the observer's grip limits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Outside every window the prop is not held by this rule.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.IGripWindow

## @evidence contracts/development/common.md#meaningful-documentation

Names the clock, the two displayed frames and the expected relation.

## @evidence contracts/development/design.md#principled-representation

The expected frame may follow authored in-hand motion as a function of film time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Matches the observer's native grip sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The expected frame is authored, never the observed one.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.ICustody

## @evidence contracts/development/common.md#meaningful-documentation

Defines the holder names, the schedule clock and how the actual holder is read.

## @evidence contracts/development/design.md#principled-representation

The actual holder is the nearest ancestor of the prop among the declared holders, or null when none carries it; the schedule gives the allowed holder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Feeds the observer's custody check.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Before the first entry no custody is declared, and proximity never names a holder.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.IContinuity

## @evidence contracts/development/common.md#meaningful-documentation

Names the cut, its layout, the declared breaks and the tracks.

## @evidence contracts/development/design.md#principled-representation

Boundaries come from the canonical cut, so trims, retimes, transitions and seams follow the playback mapping.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The producer supplies the cut and layout it already plays.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No frame index, boundary or break is assumed.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.ITrack

## @evidence contracts/development/common.md#meaningful-documentation

Defines the observation function, the three answers it can give and rate limits per source second.

## @evidence contracts/development/design.md#principled-representation

Limits are rates on the shot clock, so a retimed entry keeps the same allowed motion per source second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The track is evaluated by the producer's own pure evaluation, without seeking the scene.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absence, a missing required record and an unknown answer stay distinct.

# src/scene/inspection/ISelectAutoMoviePlacedChecks.ts#ISelectAutoMoviePlacedChecks.ITrack.observe

## @evidence contracts/development/common.md#meaningful-documentation

States the clock of the argument and the four answers.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the producer that supplies it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the producer that supplies it answers.
