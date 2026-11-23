# src/production/IAutoMovieCompiledInstancePrototype.ts#IAutoMovieCompiledInstancePrototype

## @evidence contracts/development/design.md#principled-representation

Stable prototype identity and positive weight define seeded choices; compiled tiers and the maximum applicable radius estimate supply LOD/culling inputs. Missing estimates use base then 0.5m with a 0.01m floor, without proving root-centered model enclosure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Prototype-specific model, weight, tiers and radius live once in the compiled table instead of repeating model definitions and selection parameters on each generated slot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Prototype selection uses the declared weighted seeded law rather than instance labels, and per-slot scale must act on the stored source radius rather than silently treating every instance as unit sized.

## @evidence contracts/development/common.md#meaningful-documentation

Defines engine compilation, positive deterministic weight, LOD ordering, model group ownership and the radius's metre units before slot scaling.
