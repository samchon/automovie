# src/construction/IAutoMovieConstructionJoin.ts#IAutoMovieConstructionJoin

## @evidence contracts/development/design.md#principled-representation

The surface-surface intersection is traced as a function of a declared parameter by Newton's method with exact jets from the implicit function theorem, and the blend is the quintic Hermite between both surfaces' 2-jets along their rails, G2 by construction (Patrikalakis, Maekawa and Cho, Shape Interrogation, ch. 5; Vida, Martin and Varady, A survey of blending methods, 1994).

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record serves the merge and the diff, which differ only in the kept sides; the host as a subtree covers branches, overhangs, corners where two blends meet, and parts merged at both ends without special cases.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No join is made along a section's rays, by a distance field or on a mesh; a failed premise leaves the join out with a diagnostic instead of a fallback shape.

## @evidence contracts/development/common.md#meaningful-documentation

States both kinds, the roles of host and part, what the engine computes, the kept sides, the failure effect and the admission rules.
