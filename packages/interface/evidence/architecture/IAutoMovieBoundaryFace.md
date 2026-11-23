# src/architecture/IAutoMovieBoundaryFace.ts#IAutoMovieBoundaryFace

## @evidence contracts/development/design.md#principled-representation

The rigid frame places local XY into world space and shared planar predicates test outlines and opening hulls in that frame. Their binary64 and scale-dependent tolerances can round or overflow; sharing a frame establishes coordinate compatibility rather than exact geometric containment or agreement with visible wall geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Origin, rotation, outline and thickness are the minimum that locate a slab in space; the thickness extrudes along local `+Z`, so no second outline or depth record exists.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record is not reoriented at admission. `builtEnvironmentEnvelopeFaces` applies its one-probe orientation heuristic to exposed boundaries, preserving authored direction when the probe is outside; thin, off-volume or concave geometry can defeat an outward interpretation, so the result is not an orientation certificate.

## @evidence contracts/development/common.md#meaningful-documentation

States the frame's axis meaning, the unit, why the face is planar, the outline's simplicity rule and its reason, and exactly what validation checks and leaves to the envelope derivation.
