# src/motion/human/everyday/IAutoMovieMotionHumanConversation.ts#IAutoMovieMotionHumanConversation

## @evidence contracts/development/common.md#meaningful-documentation

Names each method's parameters and result with their units: film seconds, metres and subject ids.

## @evidence contracts/development/design.md#principled-representation

Each parameter type holds the arguments of one method, and the result is the Gaze family's own layer request.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The turn, parameter and result types of the Conversation methods only.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; no layer type is redefined.

# src/motion/human/everyday/IAutoMovieMotionHumanConversation.ts#IAutoMovieMotionHumanConversation.IGlances

## @evidence contracts/development/common.md#meaningful-documentation

Names the Gaze family's request type as the readers' result.

## @evidence contracts/development/design.md#principled-representation

An alias: the layer request is the Gaze family's own, so the Conversation adds none.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGaze.ILayer` owns the request; the alias names the readers' result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/everyday/IAutoMovieMotionHumanConversation.ts#IAutoMovieMotionHumanConversation.IGaze

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The arguments the reader takes, one per member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the arguments of `gaze`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the turn and stream types the family and engine own.

# src/motion/human/everyday/IAutoMovieMotionHumanConversation.ts#IAutoMovieMotionHumanConversation.IGroupGaze

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The arguments the reader takes, one per member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the arguments of `groupGaze`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the turn and stream types the family and engine own.

# src/motion/human/everyday/IAutoMovieMotionHumanConversation.ts#IAutoMovieMotionHumanConversation.IShare

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The arguments the reader takes, one per member.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the arguments of `share`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the Gaze family's request type.

# src/motion/human/everyday/IAutoMovieMotionHumanConversation.ts#IAutoMovieMotionHumanConversation.ITurn

## @evidence contracts/development/common.md#meaningful-documentation

speaker: The speaker's subject id. from: Film second the turn starts. to: Film second the turn ends.

## @evidence contracts/development/design.md#principled-representation

speaker: The speaker's subject id. from: Film second the turn starts. to: Film second the turn ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanConversation.ts (HumanConversation.gaze, turns).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanConversation.gaze.

# src/motion/human/everyday/IAutoMovieMotionHumanConversation.ts#IAutoMovieMotionHumanConversation.IGroupTurn

## @evidence contracts/development/common.md#meaningful-documentation

Speaker and addressee identify scene subjects. Inherited from and to give the film-second boundaries.

## @evidence contracts/development/design.md#principled-representation

Each span requires an explicit addressee. HumanConversation.groupGaze validates the roster, distinct roles, finite boundaries and non-overlap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds only the addressee to ITurn for the speaker target read by HumanConversation.groupGaze.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the existing turn and subject identifiers for any group of performers.
