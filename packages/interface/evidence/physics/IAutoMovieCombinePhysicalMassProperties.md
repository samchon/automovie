# src/physics/IAutoMovieCombinePhysicalMassProperties.ts#IAutoMovieCombinePhysicalMassProperties.IPart

## @evidence contracts/development/common.md#meaningful-documentation

Specifies SI mass, common-frame centre and principal inertia orientation.

## @evidence contracts/development/design.md#principled-representation

Kilograms, metre centres, kg m² moments and a principal-to-common quaternion describe each rigid mass contribution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

combinePhysicalMassProperties reads these contributions to aggregate centre and inertia without inferring collision geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies compatible frames and admitted mass properties; vector and number types do not establish positive inertia or unit rotation.
