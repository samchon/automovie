# src/soft/IAutoMovieSoftBodyHeldLoads.ts#IAutoMovieSoftBodyHeldLoads.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Gives the multiplier-to-newton relation, final-position timing, edge selection, result mutability and missing-entry meaning.

## @evidence contracts/development/design.md#principled-representation

World-metre positions, kg^-1 inverse masses and kg*m multipliers with second-based dt yield world-newton loads; compatible topology and finite arithmetic are caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

softBodyHeldLoads reuses the core's prepared lattice and completed-step buffers to supply observer loads without adding a force accumulator to solver state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Zero inverse mass identifies held particles; the recovered edge forces do not claim a complete contact/reaction-force model.
