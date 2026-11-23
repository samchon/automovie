# src/core/ArchetypeMassPrimitive.ts#ArchetypeMassPrimitive

## @evidence contracts/development/common.md#meaningful-documentation

States SI dimensions, local frame, planar null result and finite representability premises.

## @evidence contracts/development/implementation.md#principled-implementation

Closed-form uniform box, sphere, cylinder, cone and cylinder-plus-two-hemisphere capsule properties, the same solids used by rendering. Capsule moments use component volume fractions before multiplication; scaled products preserve finite volume and principal-moment results across intermediate overflow.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit dimensions, dispatch one closed form, then admit finite positive volume and finite positive principal moments for nondegenerate solids.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses unrepresentable local properties rather than substituting a density, size cap, zero volume, zero local moment from underflow or approximate tensor; a plane still contributes no solid.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of scalar operations per primitive, with fixed-width exceptional arithmetic through ArchetypeMassArithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local record supplies volume, centroid and all principal moments to of and parts.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned scalar record retains no input, resource or cache.
