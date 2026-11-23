# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Grapple laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

## @evidence contracts/development/common.md#meaningful-documentation

States that both roles share one authored scene.

## @evidence contracts/development/design.md#principled-representation

A closed scene kind and explicit staged outcome separate choreography from partner identity.

# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Each literal names one selectable judo, wrestling or mat scene.

## @evidence contracts/development/design.md#principled-representation

Closed scene kinds select the named staging rows and their corresponding support movements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The scene input uses these fourteen names to select its choreography.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scene kind and scene outcome are separate inputs.

# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple.Role

## @evidence contracts/development/common.md#meaningful-documentation

The initiator supplies the moving hand goals and the receiver supplies their partner-relative frames.

## @evidence contracts/development/design.md#principled-representation

Each actor plays one of two distinct position and contact schedules.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two roles are sufficient for the paired composition.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actor identities are bound separately from their chosen roles.

# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

A complete scene proceeds to its selected finish and a denied scene returns to standing.

## @evidence contracts/development/design.md#principled-representation

The two outcomes select the shared completion or interruption path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One authored outcome is shared by both roles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A contact distance or a score never chooses the outcome.

# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple.IScene

## @evidence contracts/development/common.md#meaningful-documentation

Each input describes its staging meaning and default.

## @evidence contracts/development/design.md#principled-representation

A named scene, lead side, selected branch and per-scene duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These four settings are the inputs common to the two actors.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The outcome is an input, independent of body dimensions or performance sampling.

# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the role and the other actor.

## @evidence contracts/development/design.md#principled-representation

The scene is common, while role and reciprocal subject identify this actor's part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The motion law consumes the shared settings and the two actor-specific fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No participant placement or score is embedded in the inputs.

# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple.IClinchPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

Two required members typed by the clinch law's own named members, so a preset always fixes exactly the grip and the hold and the clinch keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanGrapple.JUDO_GRIP` is its data and the `judoGrip` row reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the clinch's parameters.

# src/motion/human/next/IAutoMovieMotionHumanGrapple.ts#IAutoMovieMotionHumanGrapple.IClinchRow

## @evidence contracts/development/common.md#meaningful-documentation

Names the parameters a clinch row takes and the two it fixes.

## @evidence contracts/development/design.md#principled-representation

The clinch's own parameters less exactly the members of `IClinchPreset`, so a row cannot be given what its preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanClinch.IParams` owns the shape; the lexicon's social map names the row's parameters by this alias.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: one named projection instead of an inline `Omit`.
