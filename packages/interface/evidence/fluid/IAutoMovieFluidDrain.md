# src/fluid/IAutoMovieFluidDrain.ts#IAutoMovieFluidDrain

## @evidence contracts/development/design.md#principled-representation

Active steps request flowRate * dt when the step-start free surface exceeds sillLevel, then share one donor scaling factor with outgoing faces. For finite representable arithmetic that factor bounds removal by held water; overflowed requests and NaN ledger values are not independently admitted by this type or fully rejected by the current integrator.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single-cell point outflow with a rate cap, a sill and a time window covers floor drains, overflow weirs and timed returns without a pump or pipe model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Drain and face fluxes share the same held-volume limiter and ledger path, without a drain-specific depth clamp. An overflowed request can produce a NaN scaled removal, so the current implementation does not establish the intended bounded-removal identity for every finite authored rate.

## @evidence contracts/development/common.md#meaningful-documentation

States the validation rules and where removed volume is counted; members give units, index ranges, how the realized rate is limited, the sill comparison and the half-open activity window.
