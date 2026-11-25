# src/soft/IAutoMovieSolveSoftBodyCompliantSweep.ts#IAutoMovieSolveSoftBodyCompliantSweep.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Gives the XPBD equation, metre/newton compliance, multiplier reset/accumulation, mutation scope and finite-iteration limits.

## @evidence contracts/development/design.md#principled-representation

P row-major particles use 3P metre positions, P kg^-1 masses and 12P rest/multiplier slots; runtime preparation establishes layout and representable arithmetic.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solveSoftBodyCompliantSweep consumes the core's existing prepared topology plus three family compliances and mutable multipliers, without owning the clock or iteration loop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Compliance varies by structural/shear/bend data; no fixed fixture, iteration-invariant solution or general stability guarantee is encoded.
