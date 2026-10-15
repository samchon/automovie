# OpenSubdiv documentation

Pixar Animation Studios, OpenSubdiv documentation, pages "Subdivision Surfaces" and "Modeling Tips". The hosted pages at graphics.pixar.com now redirect, so they were read from the repository sources: https://raw.githubusercontent.com/PixarAnimationStudios/OpenSubdiv/release/documentation/subdivision_surfaces.rst and https://raw.githubusercontent.com/PixarAnimationStudios/OpenSubdiv/release/documentation/mod_notes.rst.

## Licence

The code licence was not checked; Human reads the documentation for technique only and links no OpenSubdiv code.

## What it says

- Subdivision defines a limit surface; refined cage points are not on it, so their normals are approximations; points can be evaluated on the limit or "pushed" onto it.
- Extraordinary vertex: in Catmull-Clark, a vertex without four incident faces. Irregular regions shrink with subdivision, and the limit there "cannot be represented as simply as it can for regular regions".
- Sharpness runs from 0 (no effect) to 10 or more (infinitely sharp); values below 10 give semi-sharp creases and fillet-like blends without extra rows of vertices. Infinitely sharp creases are tangent discontinuities where normal displacement can tear.
- Boundary interpolation: `VTX_BOUNDARY_NONE`, `EDGE_ONLY`, `EDGE_AND_CORNER`.
- Face-varying interpolation for UVs: `FVAR_LINEAR_NONE`, `CORNERS_ONLY`, `CORNERS_PLUS1`, `CORNERS_PLUS2`, `BOUNDARIES`, `ALL`. Face-varying data cannot be interpolated more smoothly than the vertex data.
- Modeling tips: mostly regular faces, few extraordinary vertices, manifold topology; "6 spans are enough to create accurate circular shapes"; avoid high-valence vertices (wavy surfaces, cost); cap cylinders with quads, keeping valence 4; a valence 5 vertex expands three edge loops into five around fingers; a pentagon gathers diverging loops at saddle points such as the arm-torso joint; prefer creases to extra loops; values above 5 are rarely needed; group creases into named sets sharing one value.

## What Human takes

Cage design rules, crease semantics, boundary and face-varying interpolation choices, and the push-to-limit approach (`../techniques/subdivision-and-cage.md`, `../techniques/uv-layout.md`).
