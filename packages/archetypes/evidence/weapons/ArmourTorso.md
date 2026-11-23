# src/weapons/ArmourTorso.ts#ArmourTorso

## @evidence contracts/development/common.md#meaningful-documentation

Defines model +Y up, +Z front, cavity and openings, literal unfitted envelope and fitted body's exact inner breadth/depth; authored opening fractions are not historical measurements.

## @evidence contracts/development/implementation.md#principled-implementation

Nonoverlapping rectangular wall cells surround the same admitted body rectangle, omit neck/arm/hem domains and continue into genuinely hollow sleeve regions. The identical coverage has the quadratic volume used to derive mail's steel-equivalent wall.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Build front/back lower panels and shoulders, lower side walls, then a mail-only set of four walls per sleeve through one interval-panel owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No filled torso, hidden mass box, mail ring-thickness claim, Human fixture, ornamental lames or reconstructed missing armour component supplies identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight cuirass panels or sixteen shirt panels, with eight points per cell; no Boolean, inverse mesh search or repeated whole-model sampling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every boundary derives from one prepared profile and ArmourCell.box; the shared core owns hull, mass and collision and no torso dimensions are read back from its triangles.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh scalar corners and cell records, retaining no profile, model, geometry cache or external handle.
