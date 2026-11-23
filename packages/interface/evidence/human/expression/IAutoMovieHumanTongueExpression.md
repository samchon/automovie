# src/human/expression/IAutoMovieHumanTongueExpression.ts#IAutoMovieHumanTongueExpression

## @evidence contracts/development/common.md#meaningful-documentation

Tongue position, tip first, then the dorsum.

## @evidence contracts/development/design.md#principled-representation `tipElevation`: Tip elevation toward the alveolar ridge and palate (1), or depression to the floor of the mouth (-1). `tipProtrusion`: Tip protrusion past the incisors (1), or retraction into the mouth (-1). `tipLateral`: Tip deviation toward the person's left mouth corner (1) or right (-1).

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTongueExpression is the canonical exchange used by IAutoMovieHumanTongueExpressionSchema, IAutoMovieHumanMouthExpression.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `tipElevation`: Tip elevation toward the alveolar ridge and palate (1), or depression to the floor of the mouth (-1). `tipProtrusion`: Tip protrusion past the incisors (1), or retraction into the mouth (-1). `tipLateral`: Tip deviation toward the person's left mouth corner (1) or right (-1). `dorsumHeight`: Dorsum height: raised against the palate (1), as for /k/, or lowered (-1), as for an open vowel. `dorsumBacking`: Dorsum backing toward the pharyngeal wall, from rest (0) to maximum (1), as for back vowels.
