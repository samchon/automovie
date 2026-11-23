# src/physics/IAutoMoviePhysicalBalanceReference.ts#IAutoMoviePhysicalBalanceReference.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Defines the previous fitted plan and the cache/native boundary used for a new reference.

## @evidence contracts/development/design.md#principled-representation

Cache step and Hz locate the interval; start is local seconds on the native grid, and transforms are world metres/unit rotations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

physicalBalanceReference combines canonical authored targets and fitted plans for continuity-aware support replanning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A noncontiguous previous plan supplies no completed reference; a same-interval revision uses the completed preceding native boundary.

# src/physics/IAutoMoviePhysicalBalanceReference.ts#IAutoMoviePhysicalBalanceReference.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Pairs fitted and authored placements at one completed boundary, or reports no usable reference.

## @evidence contracts/development/design.md#principled-representation

The union with undefined makes absent continuity explicit; both maps contain world bone-origin rigid transforms at the same instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Support target planners use completed for continuity and before to transport correction through current authored coordinates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No synthetic completed pose is substituted when the preceding plan is absent or not contiguous.
