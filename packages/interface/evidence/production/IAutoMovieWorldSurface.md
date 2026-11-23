# src/production/IAutoMovieWorldSurface.ts#IAutoMovieWorldSurface

## @evidence contracts/development/design.md#principled-representation

Finite simple footprints and representable height arithmetic are caller premises; the retired production world validator no longer establishes them. Ground queries select the first containing footprint, including its 1e-9 m edge band, without comparing elevation or skipping a nonwalkable winner; the shared height rule evaluates that record with its own representability limits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Footprint, height and walkability keep geometric sampling distinct from performer permission without baking terrain into dense mesh samples in this contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ground queries do not validate self-intersections, repeated vertices or area. No containing surface means the nullable ground-query absence result rather than fabricated walkable terrain; the source oracle explicitly converts that absence to zero height.

## @evidence contracts/development/common.md#meaningful-documentation

Defines stable id, simple XZ polygon requirements, meter coordinates, height-law ownership and explicit walkability.
