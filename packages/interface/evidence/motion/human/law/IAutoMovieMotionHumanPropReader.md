# src/motion/human/law/IAutoMovieMotionHumanPropReader.ts#IAutoMovieMotionHumanPropReader

## @evidence contracts/development/common.md#meaningful-documentation

A capability for reading a performance prop and its world frame at film instants, with optional articulation state. Action planning reads this view instead of owning prop placement.

## @evidence contracts/development/design.md#principled-representation

state: The travel of each of its articulations an act or its own track has moved by a film second (`HumanPerformance.state`); an articulation absent from the record is at rest. Read at plan time like `frame`, so an act that operates a part starts from where the part is. Absent from a context that tracks no state, where every articulation is at rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

ActionContext.prop supplies a prop and its evaluated frame/state to manipulation and other interaction laws; authored prop geometry remains in IAutoMovieMotionHumanProp.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Frame queries use film seconds and return a world rigid transform; articulation state is a readonly named-number view. Performance prop readers own lookup, placement and admission.

# src/motion/human/law/IAutoMovieMotionHumanPropReader.ts#IAutoMovieMotionHumanPropReader.IFlightApproach

## @evidence contracts/development/common.md#meaningful-documentation

Names the borrowed publication and the ordering and frames of the samples.

## @evidence contracts/development/design.md#principled-representation

One launch identity pairs two world frames selected by the same collision horizon.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes the samples needed by the catch law without the sweep or continuation data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries the published identity rather than reconstructing a launch.

# src/motion/human/law/IAutoMovieMotionHumanPropReader.ts#IAutoMovieMotionHumanPropReader.IHolder

## @evidence contracts/development/common.md#meaningful-documentation

Names the performer and the hand.

## @evidence contracts/development/design.md#principled-representation

A performer's subject and one side identify a holding hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Exposes the holder a law asks for without the grip's spans or offsets.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the subject and side vocabulary of the grips.
