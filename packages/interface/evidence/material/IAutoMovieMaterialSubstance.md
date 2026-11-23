# src/material/IAutoMovieMaterialSubstance.ts#IAutoMovieMaterialSubstance

## @evidence contracts/development/design.md#principled-representation

Separates physical substance measurements from optical material values so layers cite one substance independently of its visible finish; `validateAutoMovieMaterialSubstance` checks each present quantity's physical range and preserves null measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A substance record owns classification and measured properties, with an optional surface id linking to the independent PBR record; assemblies reference it by stable id rather than copying its measurements.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No real-world substance values or classification catalogue are supplied, and null density or conductivity is not replaced with a guessed default; the standalone validator checks surface-id text without claiming to resolve it.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the optical-versus-physical distinction, production ownership, measurement absence, units and bounds for density, conductivity, heat capacity, absorption, vapour resistance and service life.
