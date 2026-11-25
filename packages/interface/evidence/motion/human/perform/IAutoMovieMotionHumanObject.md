# src/motion/human/perform/IAutoMovieMotionHumanObject.ts#IAutoMovieMotionHumanObject.IModel

## @evidence contracts/development/common.md#meaningful-documentation

body: Its physical data (an archetype's model body); none when absent or null.

## @evidence contracts/development/design.md#principled-representation

body: Its physical data (an archetype's model body); none when absent or null.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, model); perform/HumanObject.ts (HumanObject.seat, model); perform/HumanObstacle.ts (HumanObstacle.apertures, model); perform/HumanObstacle.ts (HumanObstacle.object, model); perform/HumanObject.ts (HumanObject.prop).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieAffordance, IAutoMoviePhysicalShape, IAutoMovieBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanObject.ts#IAutoMovieMotionHumanObject.ISpanEnds

## @evidence contracts/development/common.md#meaningful-documentation

States endpoint order, frame and units.

## @evidence contracts/development/design.md#principled-representation

The ordered endpoints use the canonical vector and are resolved at one articulation state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A provider can return its existing span state. Motion uses only the endpoints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No model class or algorithm is required by this record.

# src/motion/human/perform/IAutoMovieMotionHumanObject.ts#IAutoMovieMotionHumanObject.ISpanModel

## @evidence contracts/development/common.md#meaningful-documentation

Names span identity, physical lengths and the no-rest-length case.

## @evidence contracts/development/design.md#principled-representation

A stable span id identifies geometry in metres, including the declared length of a line allowed to slack.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanObject.cord reads the same declaration and endpoint method the provider uses to lay out the line.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The span reader is required. Its provider's own span records may carry other data without motions importing the provider package.

# src/motion/human/perform/IAutoMovieMotionHumanObject.ts#IAutoMovieMotionHumanObject.ICord

## @evidence contracts/development/common.md#meaningful-documentation

Names subject and owner identity, linear topology, mass, friction and the fixed-step solver.

## @evidence contracts/development/design.md#principled-representation

Rest length and radius belong to the model. The caller supplies its cord mass in kg, number of links and the engine's timebase and material settings.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanObject.cord consumes only the owning prop, the separate cord identity and the soft settings absent from the model's span declaration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No gravity, mass, timestep, friction or animation is inferred from the model name.

# src/motion/human/perform/IAutoMovieMotionHumanObject.ts#IAutoMovieMotionHumanObject.Placement

## @evidence contracts/development/common.md#meaningful-documentation

at: World floor point beneath the object's origin, metres; the object builder places its origin above this floor point. yaw: Object yaw in degrees about world +Y. fixed: Whether the object is immovable; omitted leaves the normal movable placement behavior.

## @evidence contracts/development/design.md#principled-representation

at: World floor point beneath the object's origin, metres; the object builder places its origin above this floor point. yaw: Object yaw in degrees about world +Y. fixed: Whether the object is immovable; omitted leaves the normal movable placement behavior.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanObject.ts (HumanObject.frame, placement); perform/HumanObject.ts (HumanObject.prop, placement); perform/HumanObject.ts (HumanObject.prop, motion); perform/HumanObject.ts (HumanObject.seat, placement); perform/HumanObstacle.ts (HumanObstacle.apertures, placement); perform/HumanObstacle.ts (HumanObstacle.object, placement).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieRigidTransform, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
