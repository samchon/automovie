# src/fluid/AutoMovieEngineFluid.ts#AutoMovieEngineFluid.fluidCourantNumber

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the dimensionless formula, the positive finite operands and the design-depth condition. It names binary64 endpoint values and directs admission to validateFluidDomain.

## @evidence contracts/development/implementation.md#principled-implementation

The ordinary expression keeps its operation order within a range in which every intermediate is normal. At extreme scales, taking separate square roots avoids premature gravity-depth overflow or underflow. Factoring reciprocal spacing by the shorter side bounds the directional norm between 1 and √2. Binary powers keep the remaining mantissas small until the final product.

## @evidence contracts/development/implementation.md#efficient-algorithms

The calculation reads five scalars, integrates no steps and retains no data. The direct branch keeps the two original square roots. The extreme branch adds four exponent decompositions and a two-component norm.

# src/fluid/AutoMovieEngineFluid.ts#AutoMovieEngineFluid.fluidDomainBudget

## @evidence contracts/development/common.md#meaningful-documentation

The report distinguishes cell and face payload, declared work per replay and spray cap. The documented Courant member shares the design-depth calculation with admission.

## @evidence contracts/development/implementation.md#principled-implementation

The grid supplies columns times rows cells and one staggered count for each velocity direction. Eight bytes per depth or face and cells times the step budget give the stated payload and work. One sum collects emitter caps, and fluidCourantNumber supplies the same dimensionless estimate as the validator.

## @evidence contracts/development/implementation.md#efficient-algorithms

The grid estimates take constant work. One pass over emitters sums their caps; the method never builds cells or runs a simulation. It returns only the budget record.

# src/fluid/AutoMovieEngineFluid.ts#AutoMovieEngineFluid.simulateFluidDomain

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the caller's admission obligation, absolute step clock and per-step update order. It distinguishes the authored design-depth bound from changes caused by later inflow.

## @evidence contracts/development/implementation.md#principled-implementation

The solver copies the authored depth and starts face velocities at zero. Fixed-step pressure and damping update faces, wall and solid boundaries zero prohibited flows, and a shared donor limiter protects each cell's available volume before source addition. The step rejects nonfinite updates before the depth clamp.

## @evidence contracts/development/implementation.md#efficient-algorithms

The absolute seek runs each required step from zero. Cell and face arrays cover the grid, and each step visits the active flow declarations and those arrays. The caller receives the final state, while solver working arrays remain local.

# src/fluid/AutoMovieEngineFluid.ts#AutoMovieEngineFluid.validateFluidDomain

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names admitted grid and solver values, arrays, population budgets and flow rules. It identifies the timestep finding when the computed design-depth Courant value exceeds one.

## @evidence contracts/development/implementation.md#principled-implementation

Field checks own nonfinite and nonpositive scalar findings. Only five valid Courant operands enter the threshold test, so a malformed grid does not generate a second solver diagnosis. The scaled calculator preserves a representable ratio; a computed value above one, including Infinity, produces the located timestep violation. Array, site and activity checks establish the remaining documented conditions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scalar and count checks take constant work, and the validator traverses the supplied cells and flow records to locate their findings. The computation advances no steps. Identity sets and findings are local to the call.
