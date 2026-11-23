# src/architecture/IAutoMovieBuildingUnit.ts#IAutoMovieBuildingUnit

## @evidence contracts/development/design.md#principled-representation

Two root ids name a unit's visible and logical trees; `validateBuiltEnvironment` requires each root to resolve with a null parent, refuses a root claimed by two units, and reports any element or space whose topmost ancestor is no unit root.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An identity and two root ids express visible/logical ownership without duplicating either hierarchy. Only the element tree inherits its root transform; the logical root is ownership, not a coordinate transform over world-space geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No unit is implied: a work with zero units is refused, and an unattributed element or space is reported rather than assigned to a default unit.

## @evidence contracts/development/common.md#meaningful-documentation

States that the element root is the coordinate root, the exclusive ownership of roots, the total coverage of the work, and the no-parent rule on each root.
