# src/render/IAutoMovieRenderBudgetAssessment.ts#IAutoMovieRenderBudgetAssessment

## @evidence contracts/development/design.md#principled-representation

A shot assessment distinguishes not-run from a report's incomplete status and uses nullable inventory, mask and target fields when no renderer was identified.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record keeps measurement, attribution and sealed target together for one compiled shot's budget decision.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent graphics identity is represented by not-run and a reason, not a fabricated renderer or empty passing report.

## @evidence contracts/development/common.md#meaningful-documentation

Members explain nullable state, the not-run versus incomplete distinction and how semantic owners resolve through the mask.
