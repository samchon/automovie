# src/geometry/curve/IAutoMovieEvaluateBernstein64.ts#IAutoMovieEvaluateBernstein64.IResult

## @evidence contracts/development/common.md#meaningful-documentation

A Bernstein evaluation returns a millimetre point and derivative per normalized local t, before enclosing phase-width scaling. Position and derivative remain distinct tuples; their presence alone certifies neither regularity nor a valid rational denominator.

## @evidence contracts/development/design.md#principled-representation

A Bernstein evaluation returns a millimetre point and derivative per normalized local t, before enclosing phase-width scaling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

evaluateAutoMovieBernstein64 publishes the common jet used by source-curve evaluators.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Position and derivative remain distinct tuples; their presence alone certifies neither regularity nor a valid rational denominator.
