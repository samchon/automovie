# Hair cards and strips

## Practice

- Scheuermann (ATI, 2004) renders hair as "layered 2D polygon patches", with a base texture for the fine structure of a hair bundle and opacity maps to break up the patches. Diffuse is a scaled and biased N·L, max(0, 0.75 N·L + 0.25). Specular follows Kajiya-Kay, using the strand tangent instead of the normal, with two highlights after Marschner et al.: a primary one shifted toward the tip and a secondary, pigment-coloured one shifted toward the root and modulated by noise. The shift is T' = normalize(T + s N), with s looked up per pixel. Visibility uses four passes: depth prime of opaque regions with alpha test, opaque shading at equal depth, back faces of transparent regions, then front faces, with patches pre-sorted by distance from the head (`../sources/scheuermann-2004-hair.md`).
- Unreal's hair card generator clusters strands into clumps of three cards, distributes a triangle budget over cards, subdivides each card adaptively by curvature or with a fixed vertical segment count, adds single-strand flyaway cards, and packs strand textures into an atlas of texture islands; each LOD is its own setting (`../sources/unreal-hair-card-generator.md`).

## For Human

Human has no strands to cluster, so cards are generated directly:

1. Scalp coordinates: the hairline and parting are curves on the head surface's semantic coordinates; roots are placed by a deterministic blue-noise or jittered-grid scheme on that region.
2. Guide curves: each root grows a guide by a style formula (direction field from the parting, length, gravity sag, curl as a helix of named radius and pitch), offset from the scalp by at least the scalp-to-card clearance so cards never cross the skin.
3. Cards: a strip along each guide, width tapering root to tip, segments set by curvature as in the Unreal generator, layered in shells from the scalp outward so the inner layers read as volume.
4. Textures: a strand-pattern atlas (coverage, root-to-tip gradient, per-strand ID for shift and colour jitter) generated procedurally once per profile; per-identity colour comes from material parameters.
5. Brows and lashes: the same generator with short guides along the brow and lid margin coordinates from #2798 and #2799.

Binding: cards attach to the head through semantic scalp coordinates and inherit the `head` bone weight (or the skin weights at the root for hair that reaches the neck and shoulders), so they follow every pose without their own rig.

## Material requirements

- Alpha: cards need `alphaMode: "mask"` for the opaque core and blended fringes; the four-pass ordering above is a renderer concern.
- Double-sided: cards are seen from both sides (`doubleSided: true`).
- Anisotropic specular along the strand tangent with two shifted lobes is what makes cards read as hair. `IAutoMovieMaterial` has no anisotropy field, and the viewer's hair shading constants lived in the basis-era `viewer/src/human` that #2789 deletes (`../core/gaps.md`).
