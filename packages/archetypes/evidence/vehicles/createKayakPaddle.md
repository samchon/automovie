# src/vehicles/createKayakPaddle.ts#createKayakPaddle

## @evidence contracts/development/implementation.md#principled-implementation

The opposed dihedral blades flank one real shaft. The rigid prop can roll and dip either end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the published dimensions and repeat the blade and grip construction once per end.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Grip and blade-tip contacts are on the visible shaft and blade. The grip span and dihedral are stated staging choices.

## @evidence contracts/development/implementation.md#efficient-algorithms

One shaft and a fixed number of convex blade cells.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the blade panel and handle construction, reflected at its two ends.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each returned model owns its parts and input provenance.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the axes, two grips, adjustable length and reference.
