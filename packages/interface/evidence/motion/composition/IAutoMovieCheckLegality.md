# src/motion/composition/IAutoMovieCheckLegality.ts#IAutoMovieCheckLegality.IRule

## @evidence contracts/development/common.md#meaningful-documentation

Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieCheckLegality.IRule keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieCheckLegality.IRule contract belongs to interface; packages/engine/src/composition/checkAutoMovieLegality.ts and packages/motions/src/perform/HumanPerformanceState.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/composition/IAutoMovieCheckLegality.ts#IAutoMovieCheckLegality.IViolation

## @evidence contracts/development/common.md#meaningful-documentation

Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieCheckLegality.IViolation keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Production predicates read one borrowed schedule entry and the complete schedule synchronously; null accepts it, while a string becomes a violation with the rule id and walk-order entry index. Every entry/rule pair is visited and exceptions propagate. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieCheckLegality.IViolation contract belongs to interface; packages/engine/src/composition/checkAutoMovieLegality.ts and packages/motions/src/perform/HumanPerformanceState.ts use this boundary. Runtime computation remains with those consumers.
