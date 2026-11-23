# src/soft/IAutoMoviePruningEnvelope.ts#IAutoMoviePruningEnvelope

## @evidence contracts/development/design.md#principled-representation

growPlanting tests branch bases and computes box slab exits or sphere quadratic exits in the recipe frame; children beyond the clipped branch length are omitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The union exposes the two implemented analytic clipping volumes and an explicit unpruned arm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The envelope clips branch centreline structure, not leaf blades or branch thickness; it is not a full canopy containment guarantee.

## @evidence contracts/development/common.md#meaningful-documentation

Arm comments state the recipe frame, strict box ordering and metre radius, with the structure-only pruning limit.

# src/soft/IAutoMoviePruningEnvelope.ts#IAutoMoviePruningEnvelope.INone

## @evidence contracts/development/design.md#principled-representation

growPlanting treats every base as inside and returns no exit for this arm; growth stage and recursion budgets still limit the result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single literal distinguishes absence of pruning without an infinite box.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The arm removes only pruning; it does not bypass branch and leaf caps.

## @evidence contracts/development/common.md#meaningful-documentation

The discriminator states that no clipping envelope participates in structural derivation.

# src/soft/IAutoMoviePruningEnvelope.ts#IAutoMoviePruningEnvelope.IBox

## @evidence contracts/development/design.md#principled-representation

A branch based inside the box exits at the nearest forward slab intersection; zero direction components contribute no crossing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Minimum and maximum corners are the complete box parameters consumed by the analytic clipper.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Clipping uses the declared corners rather than sampled cuts; equality at a boundary is inside and branch thickness is not tested.

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the recipe frame and the required strictly ordered corners.

# src/soft/IAutoMoviePruningEnvelope.ts#IAutoMoviePruningEnvelope.ISphere

## @evidence contracts/development/design.md#principled-representation

growPlanting uses squared-distance inclusion and the positive quadratic exit root for a normalized branch axis starting inside the sphere.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Centre and radius express the only parameters needed by the analytic sphere clipper.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The radius is validated positive; clipping is centreline-only and does not bound leaf blades extending beyond it.

## @evidence contracts/development/common.md#meaningful-documentation

The centre is recipe-local and the radius is measured in metres before instance scaling.
