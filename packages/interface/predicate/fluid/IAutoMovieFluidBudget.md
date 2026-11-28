# src/fluid/IAutoMovieFluidBudget.ts#IAutoMovieFluidBudget

## @evidence contracts/development/common.md#meaningful-documentation

The record names what each count represents, its byte model and the design-depth Courant estimate. The listed consumer reads cell and spray budgets for bound fluid domains.

## @evidence contracts/development/design.md#principled-representation

Each field describes one domain, preserves its identity and uses counts or scalar estimates. fluidDomainBudget derives the counts from its input; validateFluidDomain owns the limits and Courant admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The report groups values related to one lattice and solver. It exposes the quantities simulation budgeting and inspection consume while leaving the solver's working arrays private.

# src/fluid/IAutoMovieFluidBudget.ts#IAutoMovieFluidBudget.courant

## @evidence contracts/development/common.md#meaningful-documentation

The member gives the dimensionless reference-depth equation and final zero or Infinity rounding. fluidCourantNumber supplies the estimate, and validateFluidDomain applies the one threshold.
