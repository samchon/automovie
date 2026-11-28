# src/text/AutoMovieEngineText.ts#AutoMovieEngineText.compareCodeUnits

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies the comparison alphabet, return values, prefix order and the caller's normalization choice.

## @evidence contracts/development/implementation.md#principled-implementation

JavaScript string relational comparisons apply lexicographic UTF-16 code-unit order. The function maps the two strict comparisons and equality to the three comparator results.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation compares the supplied strings directly. Its work depends on the compared prefix, and the strings remain in their supplied representation.

# src/text/AutoMovieEngineText.ts#AutoMovieEngineText.withArticle

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the first-code-unit rule, case treatment, empty result and diagnostic scope.

## @evidence contracts/development/implementation.md#principled-implementation

The function lowercases the first code unit and checks a fixed vowel set. The chosen prefix is followed by a space and the full original label.

## @evidence contracts/development/implementation.md#efficient-algorithms

Article selection inspects one code unit and a fixed set. Work beyond the selection is constructing the returned label.
