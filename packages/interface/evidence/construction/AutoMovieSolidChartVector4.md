# src/construction/AutoMovieSolidChartVector4.ts#AutoMovieSolidChartVector4

## @evidence contracts/development/design.md#principled-representation

Four fixed slots match the surface-equality Jacobian; chart units are not interchangeable with world millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

TraceSolve uses this ordering for guesses, solved preimages and implicit parameter rates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Tuple arity excludes missing coordinates, while finite values, valid host indices and regular source jets remain solver premises.

## @evidence contracts/development/common.md#meaningful-documentation

States slot order, chart/rate units and input-copy versus result ownership.
