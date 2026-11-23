# src/scene/inspection/measureAutoMovieCameraNearClip.ts#measureAutoMovieCameraNearClip

## @evidence contracts/development/common.md#meaningful-documentation

States the clipping premise, the units and frame of depth and point, the opacity flag, the budget and every outcome.

## @evidence contracts/development/implementation.md#principled-implementation

Uses Three's normalized frustum planes from the actual delivery projection, so distances are world metres and any crop or aspect is included. A triangle part counts only beyond a tolerance of 32 ulps of its plane arithmetic plus, for an owned skin, its stated float32 GPU tolerance scaled by the largest world row norm; touching the near plane is not an intrusion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mesh admission stays with listAutoMovieCameraSubjectMeshes; this function first lets a certified envelope that lies wholly beyond the near plane or outside a side plane settle the subject, then prefilters meshes by world box, counts the drawn triangles against the budget and clips.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bounds overlap stands for a cut surface; an exceeded budget is reported apart from an uncheckable subject, and neither is reported clear.

## @evidence contracts/development/implementation.md#efficient-algorithms

A mesh whose world box lies wholly beyond the near plane or outside a side plane costs O(1); the rest cost O(T) for T drawn triangles, at most the budget, with constant work per triangle on fixed scratch vectors; the loop allocates only a small record when it finds a deeper intrusion.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the geometry box Three caches and the skin's pose cache, which its writers invalidate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Uses fixed scratch arrays per call and returns plain values only.
