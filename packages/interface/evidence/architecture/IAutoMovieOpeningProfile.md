# src/architecture/IAutoMovieOpeningProfile.ts#IAutoMovieOpeningProfile

## @evidence contracts/development/design.md#principled-representation

outlineHull retains inward-arc chords and bounds outward half-turn-limited arcs by chord/sagitta rectangles, using signed chord-ring winding; zero-area rings keep rectangle expansion. autoMovieOpeningArea adds floating circular-segment area and rounds to the drawing grid. Simple-hull admission does not independently prove circular-arc simplicity, and conservative exact-real geometry does not make overflow-prone binary64 predicates a universal one-sided certificate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One outline with optional per-edge bulges covers rectangles, arches, and circles, and absent bulges mean straight edges, so no opening-type enum or second arc record exists.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Winding and bulge sign determine each arc's conservative ring treatment without shape-specific sampling; arcs past a half turn and zero-area bulge-free two-point outlines refuse, with no invented corner or separate arc-intersection proof.

## @evidence contracts/development/common.md#meaningful-documentation

States edge indexing, inward/outward and zero-winding policies, hull-versus-circular-simplicity limits, planar units, analytic area versus drawing chords, and the bulge's magnitude/sign/half-turn limit.
