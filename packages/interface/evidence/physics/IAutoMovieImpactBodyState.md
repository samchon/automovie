# src/physics/IAutoMovieImpactBodyState.ts#IAutoMovieImpactBodyState

## @evidence contracts/development/design.md#principled-representation

resolveImpact validates exactly these values before normal impulse arithmetic and its material/speed classifications; the record deliberately omits geometry and angular state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps the minimum normal-response inputs together instead of introducing a full rigid-body simulation model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Hardness/penetrability are dimensionless advisory controls, not measured constitutive fracture laws; no fixture-specific material behavior belongs to this record.

## @evidence contracts/development/common.md#meaningful-documentation

Members state positive finite mass, velocity units, [0,1] ranges and what each material trait influences.
