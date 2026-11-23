# src/scene/IAutoMovieSurface.ts#IAutoMovieSurface

## @evidence contracts/development/design.md#principled-representation

A closed simple outer XZ ring with optional interior holes and exactly one height representation defines support; shared constant/plane/bilinear height laws and legacy anchors produce the same single-valued ground query.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Semantic label remains independent from footprint and height, while explicit void rings express one slab without splitting its support ownership into neighbouring patches. Color opts the same mesh into beauty rendering. An optional shot-local opening time affects scoped support eligibility alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Conflicting or missing height statements refuse; hole rims belong to the closed slab and invalid rings refuse. The gate requires absolute double plan area above 1e-9 square metres and legacy squared ramp span at least 1e-9 square metres. Finite fields do not guarantee finite derived heights, and multi-valued ground and true curved footprints remain unsupported.

## @evidence contracts/development/common.md#meaningful-documentation

Defines XZ and ignored-y ownership, concavity and hole rules, mutually exclusive height/anchor spelling, opaque color, scoped availability time and single-valued-ground limitations.
