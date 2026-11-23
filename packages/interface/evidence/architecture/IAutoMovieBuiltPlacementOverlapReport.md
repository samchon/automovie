# src/architecture/IAutoMovieBuiltPlacementOverlapReport.ts#IAutoMovieBuiltPlacementOverlapReport

## @evidence contracts/development/design.md#principled-representation

The sweep sorts resolved bodies by their lower x corner and keeps an active list, so `compared` counts only the union-box tests the x-axis prune leaves, and each admitted pair is then confirmed part box against part box before it lands in `pairs`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Census, proxy findings and unresolved locators travel together. Empty pairs with no unresolved bodies establishes only that this static box-volume sweep emitted no findings; it does not certify a clean rendered building, continuous collision freedom or structural correctness.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unresolved locators are listed and present-body derivation errors still propagate. No overlap threshold or fixture identity selects findings; volume <= 0 suppresses nonpositive computed intersections, while nonfinite grading remains the pair record's stated limitation. `compared` does not conceal a claim of total cost.

## @evidence contracts/development/common.md#meaningful-documentation

States resolved-body and candidate counters, batch sharing and excluded cost, proxy/numeric result limits, finite-metric pair sorting and declaration-order unresolved locators.
