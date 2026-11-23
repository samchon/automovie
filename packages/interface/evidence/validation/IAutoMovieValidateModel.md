# src/validation/IAutoMovieValidateModel.ts#IAutoMovieValidateModel.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Assemble id/reference, primitive/mesh, skeleton (with declared joint axes), gaze, transform, body/profile/affordance and material checks in stable order. Member documentation states the supplied records, units and absence meanings used by validateModel.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This input does not widen the model to an arbitrary object or imply that a type alone proves runtime geometry validity; admission reports faults without repair.

## @evidence contracts/development/design.md#principled-representation

model is the canonical typed artifact joining geometry, skeleton, profiles, affordances and materials; validateModel collects their scalar and reference violations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateModel.IProps, used by validateModel. Its model members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
