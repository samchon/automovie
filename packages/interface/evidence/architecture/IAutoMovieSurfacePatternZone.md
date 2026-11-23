# src/architecture/IAutoMovieSurfacePatternZone.ts#IAutoMovieSurfacePatternZone

## @evidence contracts/development/design.md#principled-representation

A zone is a convex clip region plus a lattice whose enumeration is widened by the declared reach, so every cell whose modules could touch the region is visited and the generator's output is clipped rather than trusted to stay inside.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Holds only what is per zone: id, region, lattice origin and pitch, reach, material and generator; joint and neighbour rules are pattern-wide and live on the pattern.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A module beyond its declared reach is refused with a throw rather than silently clipped away, and the lattice cell cap is a contract constant that applies to every zone.

## @evidence contracts/development/common.md#meaningful-documentation

States what clipping to the region means for ownership, the occurrence id form, the convexity and overlap rules of the region, the metre units, why the reach must be stated, the refusals, the cell cap, and the null material.
