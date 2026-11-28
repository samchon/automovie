# src/schema/IAutoMovieHumanExtremityDimensionsSchema.ts#IAutoMovieHumanExtremityDimensionsSchema

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies independent hand and foot pairs with the dimensional units. Both sides are present whenever a pair is supplied.

## @evidence contracts/development/design.md#principled-representation

Each hand uses the arm identity's hand length, palm length, thumb length and hand breadth. Each foot uses the leg identity's foot length, foot breadth and lateral malleolus height. Typia adds their existing bounds at each side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parent parameter input can omit either domain. These selections reuse arm and leg identity definitions. The inherited foot assembly field declares intent and has no generation implementation.
