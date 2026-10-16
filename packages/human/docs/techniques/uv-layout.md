# UV layout

## Seam placement

- LSCM (Lévy et al. 2002) places chart boundaries "in zones where they will not cause texture artifacts": in high-curvature zones, because there shading variation dominates any texture discontinuity; and it notes that a user segments a model "into parts resembling cylinders" (`../sources/levy-2002-lscm.md`).
- LSCM's parameterization is quasi-conformal, has a unique minimum independent of mesh resolution, and cannot flip triangles (`../sources/levy-2002-lscm.md`).
- Bommes et al.: semi-regular quad meshes map each patch trivially to a rectangle of texture (`../sources/bommes-2013-quad-mesh-survey.md`).
- Ptex avoids UVs altogether with one texture per face and seamless filtering, and supports Catmull-Clark surfaces (`../sources/ptex.md`). It does not suit Human's output contract: glTF and `IAutoMovieMesh` carry UV coordinates, and downstream users author textures against a UV layout.

For Human the seams follow the plan in #2795 and the LSCM criterion together: inner arm, inner leg, behind the hairline, under the foot, along the side of the hand between palm and dorsum, and around each separate part's attachment.

## Deterministic UVs from semantic coordinates

Human does not need an optimizing parameterization such as LSCM, because every part generator already has a natural parameter domain: a limb tube is (station along the bone, angle around it), a patch is (u, v). The UV of a cage corner is a fixed function of those semantic coordinates, so:

- Constant atlas rectangles alone do not prove a common layout: the emitted corner coordinates inside them must also be independent of identity. Audit the emitted face-corner UVs, not only the packing constant.
- Texel density varies with identity because the 3D size changes and the UV rectangle does not. Use average adult proportions to size the rectangles; record the per-identity stretch as a diagnostic, not as a layout change.
- A downstream user authors one texture for the published layout, and it fits every person.

## UVs through subdivision

UVs are face-varying data: each cage face corner carries its own UV, so a seam is a pair of corners with the same position and different UVs. OpenSubdiv's face-varying modes range from `FVAR_LINEAR_NONE` (smooth everywhere) to `FVAR_LINEAR_ALL`; `CORNERS_ONLY`, `CORNERS_PLUS1`, `CORNERS_PLUS2` and `BOUNDARIES` progressively pin corners, junctions of three or more regions, darts and concave corners, and whole boundaries. Face-varying data cannot be smoother than the vertex data (`../sources/opensubdiv-documentation.md`). Blender exposes the same choice as UV Smooth (`../sources/blender-manual.md`).

For Human: `FVAR_LINEAR_BOUNDARIES` (Blender "Keep Boundaries") keeps every chart's rectangle exact after subdivision, which is what a published layout needs; interior UVs smooth with the surface. The choice is part of the versioned layout contract.

## Seams in the mesh output

A UV seam duplicates render vertices. `IAutoMovieMesh.physicalVertices` already records that duplicated render vertices are one physical point, so welding, topology checks and normals treat the seam as continuous. Human writes limit normals itself (`subdivision-and-cage.md`), because the viewer's fallback `computeVertexNormals` averages per render vertex and would split shading at every UV seam.

## Versioning

The layout is published as a typed constant with a version literal. A layout change is a breaking change for anyone who authored textures, so it bumps the version and keeps the previous layout addressable until the downstream textures move.


## Hand chart repair in campaign 2831

Version 3 reused physical sweep parameters as hand texture coordinates. The longitudinal palm address included physical root reach and middle-fingertip reach, root columns included the geometric angles and web widths, and digit bands used physical station lengths. Therefore the same topology did not imply the same UV layout. The shared-web candidate moved 552 coarse corners per hand by up to 0.0034171 atlas units; even the four unchanged gate identities differed from one another. Three web strips and each tip cap additionally collapsed to zero-area UV lines.

Version 4 keeps those physical evaluation addresses unchanged, because relief, landmarks and other physical consumers share them. The hand emits optional face-varying `IAutoMovieHumanCage.IFace.uvs` separately; joining preserves them, and the existing engine face-varying subdivision consumes them. No new core UV algorithm or copied geometry is required.

`AutoMovieHumanHandChart` declares the texture domain from the same named block sequence as the physical network:

- Eight equal logical palm bands have boundaries wrist, collar, carpus, thenar, mid-palm, metacarpals, heads, roots, web. The first seven occupy the lower 7/8 of the hand rectangle. Root columns use their logical strip coordinate, not a geometric angle.
- The upper eighth is split into three equal web rectangles. Each web uses both parameters of its Coons domain, preserving nonzero texture area.
- Each digit bridge keeps its existing share 0.1; the five sweep blocks and final cap each take one sixth of the remaining chart length. The cap uses its square patch domain, so neither its boundary nor its triangles collapse to a UV line.
- The first logical column is the texture cut. Hand addresses are already local rectangle coordinates, packed directly after handedness conversion. Applying the tubular modular mapper again would fold the planar cap at its half-turn. This moves the cut to the palmar meridian. Quarter-turn cuts cannot be edges of all twelve-, eighteen- and twenty-six-column transitions. The webs and caps are also explicitly cut from their neighbours; these are texture cuts and do not split the physical surface or its normals.

Equal logical bands, rectangular web/cap domains and the texture cut are chart conventions, not anatomical measurements. Their packing is fixed across identity; physical texel density may stretch. The separate web/cap rectangles still need material inspection under the intended texture filtering and mip levels before claiming acceptable texture appearance.

The public version is bumped to 4. `AUTOMOVIE_HUMAN_UV_LAYOUT_V3` preserves the old rectangle/seam record, and the already-public `meshAutoMovieHumanCage({ uvLayout: 3, ... })` explicitly uses the preserved physical evaluation coordinates. This reproduces the previous output for callers that need the old texture layout. No new option is added to `AutoMovieHuman.getModel`; its current output uses version 4. Rectangles and other parts' mappings are unchanged; the hand audit does not prove their identity invariance.

Validation must compare physical source identities, positions, normals and triangle ordering separately from render vertex count: adding valid texture cuts creates more render aliases. Numerical UV invariance does not establish anatomy, material appearance, raking-light form or the Human visual gates. Test a current source build and render the actual joined consumer before visual acceptance.
