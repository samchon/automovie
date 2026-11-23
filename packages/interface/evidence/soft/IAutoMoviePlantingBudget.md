# src/soft/IAutoMoviePlantingBudget.ts#IAutoMoviePlantingBudget

## @evidence contracts/development/design.md#principled-representation

plantingBudget walks the admitted branching depth and maximum length-jitter law, summing complete-tree branches and density-derived worst-case leaves before multiplying by requested cluster members.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Derived worst-case demand remains separate from authored branch/leaf caps so validation compares a recipe's actual bound with its declared affordability.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Leaf cost is not copied from maxLeaves and bare foliage has zero leaves; admitted depth bounds are a premise so an unbounded declared tree cannot exhaust the budget computation itself.

## @evidence contracts/development/common.md#meaningful-documentation

Defines recipe attribution, unpruned full-growth bounds, declared caps and standalone-versus-cluster member multiplication.
