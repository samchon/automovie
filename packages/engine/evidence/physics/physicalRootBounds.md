# src/physics/physicalRootBounds.ts#physicalRootBounds

## @evidence contracts/development/common.md#meaningful-documentation

States which limbs are bounded, by which share, in which order, and that a foot fully in has none.

## @evidence contracts/development/implementation.md#principled-implementation

A leaving limb's contacts are bounded by its bearing share of the vertical force, ramping to zero before it lifts (Herzog et al. 2016, Section 5.3); an entering foot's by the lesser of its bearing and entry shares, mirrored at lift-off (design-4017-qp3, Section 3, rule 3). Shares are clamped to [0, 1].

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The leaving bounds, then the entering ones, by limb; the caller maps limbs to their carriers' bodies (`physicalRootTransitions`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

There are no casts or special cases; an absent share defaults to one.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the stance limbs times the requested ones, at most two.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalRootBounds.ts#physicalRootBounds.IBound

## @evidence contracts/development/common.md#meaningful-documentation

Documents a limb's bound and its units.

## @evidence contracts/development/design.md#principled-representation

The bound by limb, before its carriers' bodies are known.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by physicalRootTransitions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members.
