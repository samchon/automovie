# Procedural skin fields

Human evaluates deterministic fields in rest millimetres and delivers them through generated textures. This makes field size independent of vertex indices and atlas coordinates, while the bake still depends on the actual surface and UV footprint. It does not make a world-space sphere field an anatomical surface process.

## Eligibility and physical meaning

Geometry-owned pad/dorsum and lip-band roles exclude ordinary follicular pits and acne-like marks from glabrous, vermilion, oral and uncertain domains. Those authored regions are not clinical segmentation. Glabrous friction ridges and eccrine structures need their own model. [Skin-feature distribution sources](../sources/skin-feature-distribution.md) records the primary protocols and exceptions; no universal freckle density, acne elevation or whole-body pore-depth distribution was established.

The current seeded spheres use density `rho` per 100 square millimetres and radius `r` in millimetres. A uniform-hash ensemble has nominal centre intensity `rho/(200r)` per cubic millimetre; an ideal plane intersects a slab of thickness `2r`, yielding `rho/100` expected intersections per square millimetre. The seeded stratified grid is not a Poisson process, and overlapping visible marks need not have that count.

Uniformly offset sphere sections have mean diameter `pi/4` of the sphere diameter and mean area `2/3` of its equatorial area before thresholding, overlap and filtering. The authored diameter therefore bounds section size rather than setting every visible diameter. Changing diameter changes the grid, so a fixed seed does not preserve individual addresses. Strongest-bump ownership can also introduce gradient jumps where bumps overlap.

A surface-attached alternative needs the metric `G=J^T J`, where `J=[S_u,S_v]` is the 3-by-2 derivative of a surface in millimetres. Area is `sqrt(det(G)) du dv`; a local radius uses `delta^T G delta <= r^2`, including the cross term for chart shear. This tangent approximation is insufficient across singular charts, chart boundaries or strong curvature. The assembly's placement Jacobian is a different quantity.

Persistent semantic marks require stable surface correspondence and seam ownership. A changing body area cannot preserve both mark count and marks per square centimetre. Independent editable size, count and placement remain limits of the present sphere representation; a bounded surface sampler is not implemented.

## Sampling and cost

The baker integrates each texel over its incident rest-surface UV triangles. Degenerate charts, disagreeing overlaps and preparation budgets limit support. Point-extended padding does not establish filtering correctness at every mip or grazing angle. [PBRT's texture sampling chapter](https://pbr-book.org/4ed/Textures_and_Materials/Texture_Sampling_and_Antialiasing) explains why the actual footprint matters.

At nominal atlas width 1800 mm, a 2048-pixel chart has 1.1378 texels/mm, so a 2 mm mark spans only 2.28 texels before local stretch. The 512-square detail atlas stores mean latent slope reconstructed from periodic XY/YZ/ZX rest-mm planes. It does not resolve individual submillimetre pores, anatomical crease directions or unresolved slope variance. Normal averaging can lose the distribution that broadens a highlight; [LEAN mapping](https://userpages.cs.umbc.edu/olano/papers/lean/) addresses that issue for its own Ward/Beckmann formulation, not automatically the installed GGX material.

Two RGBA mark images and an RGB papule normal at 2048-square consume 44 MiB raw; the 512-square detail normal adds 0.75 MiB. Encoded bytes, temporary arrays and triangle/site incidence add storage. A per-triangle site bound is not a total memory bound. Complete generation and viewer costs remain unmeasured.

## Optics and observations

[Donner and Jensen](https://diglib.eg.org/items/f7be9101-7b4c-4a57-ba69-eedd90acd23d) and [Weyrich et al.](../sources/weyrich-2006-skin-reflectance.md) support separating pigment, surface reflection and scattering. Human's 31-wavelength two-layer approximation, short-wavelength blood extrapolation and RGB white balancing have not been calibrated against measured skin spectra. Fixed RGB radii and curvature shading are not texture-space diffusion or [separable subsurface scattering](https://www.iryoku.com/separable-sss/).

Actual viewer observations of the uniform field included palmar and lip marks. Source eligibility changes do not establish that corrected rendered behavior has been observed. Existing construction views expose skin and hair geometry, not every seeded field primitive or microheight source. Field-source exposure, browser decode-failure/recovery, seam filtering and corrected appearance remain unresolved.
