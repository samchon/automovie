# src/physics/IAutoMovieSolvePhysicalCompliantContacts.ts#IAutoMovieSolvePhysicalCompliantContacts.ISurface

## @evidence contracts/development/common.md#meaningful-documentation

Admitted material and response policy associated with one native outer collider.

## @evidence contracts/development/design.md#principled-representation

compliance is m/N, damping seconds, friction a Coulomb coefficient and gain a dimensionless explicit response multiplier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The native binding builds this borrowed surface record; solvePhysicalCompliantContacts combines material pairs and applies their response gains separately.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Material/profile admission owns finite nonnegative values and permitted gains. Zero compliance alone does not initiate a soft pair; body identity prevents duplicate same-owner soft response.

# src/physics/IAutoMovieSolvePhysicalCompliantContacts.ts#IAutoMovieSolvePhysicalCompliantContacts.IMeasurement

## @evidence contracts/development/common.md#meaningful-documentation

One positive compliant-contact solve and the actual rounded transfer to each body.

## @evidence contracts/development/design.md#principled-representation

point is world metres, normal a world unit vector from handle to other, impulse N s and signed separation metres at the supplied native instant.

## @evidence contracts/development/design.md#minimal-and-owned-surface

solvePhysicalCompliantContacts emits a new record after applying rounded impulses; recordPhysicalContact maps collider handles to scene endpoints and merges the observation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

impulse is the pre-gain solve while appliedImpulse records transferred normal components, zero for a nondynamic side. Handles identify the current world only and are not portable checkpoint identities.
