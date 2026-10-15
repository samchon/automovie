# UV layout

## Seam placement

- LSCM (Lévy et al. 2002) places chart boundaries "in zones where they will not cause texture artifacts": in high-curvature zones, because there shading variation dominates any texture discontinuity; and it notes that a user segments a model "into parts resembling cylinders" (`../sources/levy-2002-lscm.md`).
- LSCM's parameterization is quasi-conformal, has a unique minimum independent of mesh resolution, and cannot flip triangles (`../sources/levy-2002-lscm.md`).
- Bommes et al.: semi-regular quad meshes map each patch trivially to a rectangle of texture (`../sources/bommes-2013-quad-mesh-survey.md`).
- Ptex avoids UVs altogether with one texture per face and seamless filtering, and supports Catmull-Clark surfaces (`../sources/ptex.md`). It does not suit Human's output contract: glTF and `IAutoMovieMesh` carry UV coordinates, and downstream users author textures against a UV layout.

For Human the seams follow the plan in #2795 and the LSCM criterion together: inner arm, inner leg, behind the hairline, under the foot, along the side of the hand between palm and dorsum, and around each separate part's attachment.

## Deterministic UVs from semantic coordinates

Human does not need an optimizing parameterization such as LSCM, because every part generator already has a natural parameter domain: a limb tube is (station along the bone, angle around it), a patch is (u, v). The UV of a cage corner is a fixed function of those semantic coordinates, so:

- The layout is identical for every identity in a profile: the chart rectangles and their placement in the atlas are constants of the profile, and only positions change with identity.
- Texel density varies with identity because the 3D size changes and the UV rectangle does not. Use average adult proportions to size the rectangles; record the per-identity stretch as a diagnostic, not as a layout change.
- A downstream user authors one texture for the published layout, and it fits every person.

## UVs through subdivision

UVs are face-varying data: each cage face corner carries its own UV, so a seam is a pair of corners with the same position and different UVs. OpenSubdiv's face-varying modes range from `FVAR_LINEAR_NONE` (smooth everywhere) to `FVAR_LINEAR_ALL`; `CORNERS_ONLY`, `CORNERS_PLUS1`, `CORNERS_PLUS2` and `BOUNDARIES` progressively pin corners, junctions of three or more regions, darts and concave corners, and whole boundaries. Face-varying data cannot be smoother than the vertex data (`../sources/opensubdiv-documentation.md`). Blender exposes the same choice as UV Smooth (`../sources/blender-manual.md`).

For Human: `FVAR_LINEAR_BOUNDARIES` (Blender "Keep Boundaries") keeps every chart's rectangle exact after subdivision, which is what a published layout needs; interior UVs smooth with the surface. The choice is part of the versioned layout contract.

## Seams in the mesh output

A UV seam duplicates render vertices. `IAutoMovieMesh.physicalVertices` already records that duplicated render vertices are one physical point, so welding, topology checks and normals treat the seam as continuous. Human writes limit normals itself (`subdivision-and-cage.md`), because the viewer's fallback `computeVertexNormals` averages per render vertex and would split shading at every UV seam.

## Versioning

The layout is published as a typed constant with a version literal. A layout change is a breaking change for anyone who authored textures, so it bumps the version and keeps the previous layout addressable until the downstream textures move.
