# src/architecture/IAutoMovieOpeningOperation.ts#IAutoMovieOpeningOperation

## @evidence contracts/development/design.md#principled-representation `validateBuiltEnvironment` requires a fill, at least one panel and one state, unique panel, state, and hardware ids, and a current state that resolves; `lowerBuiltEnvironment` composes each panel's axis-angle or translation delta after its element's rest transform so the travel rides down the element hierarchy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Panels own the degrees of freedom, states own the values, and the current state picks one, so adding a vocabulary term is a new state record and swing, slide, and fold reuse one panel type with the element hierarchy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No state name has built-in meaning and no `open` keyword is special-cased; an operation without a fill is refused instead of being attached to an inferred element.

## @evidence contracts/development/common.md#meaningful-documentation

States why states replace a word, how swing, slide, and fold map onto panels, the fill requirement, the minimum counts, what the current state must name, and that lowering stages it.
