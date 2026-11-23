# src/physics/IAutoMovieDistributePhysicalSupportWrench.ts#IAutoMovieDistributePhysicalSupportWrench.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States real contact locations, friction-pyramid limits and the total upward-force cap.

## @evidence contracts/development/design.md#principled-representation

A world wrench in N and N m is applied about a world-metre origin; contact rows carry their actual carrier and coefficient.

## @evidence contracts/development/design.md#minimal-and-owned-surface

distributePhysicalSupportWrench consumes the collected contact population and explicit demand without requiring native solver handles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

At most 1024 points and finite nonnegative friction/cap are admitted; zero capacity cannot fabricate support.

# src/physics/IAutoMovieDistributePhysicalSupportWrench.ts#IAutoMovieDistributePhysicalSupportWrench.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes allocated wrench from demand and documents borrowed point references.

## @evidence contracts/development/design.md#principled-representation

Per-contact world forces in N and moments about input.origin in N m retain requested-minus-allocated residuals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The wrench allocator creates result rows for the actuation caller while retaining the original contact-point references.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Residuals expose infeasible demand and the allocation does not assert native impulses or successful balance.
