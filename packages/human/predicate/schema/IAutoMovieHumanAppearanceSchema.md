# src/schema/IAutoMovieHumanAppearanceSchema.ts#IAutoMovieHumanAppearanceSchema

## @evidence contracts/development/common.md#meaningful-documentation

The appearance block identifies five required groups and separates scalp hair from the two independent side pairs around the eyes.

## @evidence contracts/development/design.md#principled-representation

The intersection keeps the existing appearance shape and adds each group's refinements. Side pairs need both anatomical sides. The selected validators check child fields when callers include an appearance block.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Appearance composes shared bilateral records and the five dedicated child schemas. The parent Human input can omit the whole block. Material and rendering support are determined by the consumer.
