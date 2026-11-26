# Procedural skin fields

The skin's procedural detail lives in two places with different units. Colour fields are evaluated per vertex in rest millimetres of the generated body; micro-relief is a periodic image tile in rest millimetres, sampled through the chart coordinates of [UV layout](uv-layout.md). Neither depends on vertex indices.

## Colour fields

`AutoMovieHumanSkinTone` evaluates regional chromophore multipliers and mottling at each vertex position and normal (see [Skin material](skin-material.md) for the regions). Mottling is three-dimensional value noise, so it has no chart seams; its octaves (16 to 40 mm) are coarse enough for the coarsest limb mesh (edges up to about 12 mm) and are the same on every piece.

Every field that reaches a piece boundary depends on position and normal only, because a field that depends on a piece's own edge length makes two pieces disagree at their shared ring and draws a sharp colour step there. Regional factors follow the same rule: the hand flush ramps over 20 mm about the wrist and the ear flush is a field about the ear rather than a factor on the ear chains.

Vertex colours cannot draw marks smaller than a few edge lengths. Freckles, moles and acne are drawn instead into a per-person image over the packed chart layout, 2048 pixels on its longer side (about 0.8 mm per pixel on f1, 12 MiB raw, produced only when marks are requested; see [Skin material](skin-material.md#marks)).

## Micro-relief tile

`AutoMovieHumanSkinImage` builds one height field over a 40 mm periodic tile: at most one pore per 0.625 mm cell (a third of the cells empty), radius 0.04 to 0.12 mm skewed toward small, depth 6 to 24 um growing with size and scaled by a 5 mm patchiness, plus a 2 to 8 mm undulation of 10 um and a 0.3 mm grain of 2 um. All randomness comes from `AutoMovieHumanAppearanceNoise.hash`, periodic in the tile, so the images repeat seamlessly. Pore spacing follows the order of magnitude of facial follicle densities ([skin-feature distribution sources](../sources/skin-feature-distribution.md)); sizes and depths are conventions. The furrow network of real skin is not drawn.

| Image | Content | Size | Raw |
| --- | --- | --- | --- |
| `human.skin.relief` | Tangent-space normal, x along `+u`, y along `+v` (down the rows) | 1024 square, 0.039 mm per texel | 3 MiB |
| `human.skin.grain` | sRGB base-colour multiplier, pores up to 5 percent darker, mean about 0.99 | 512 square | 0.75 MiB |
| `human.skin.gloss` | Roughness multiplier in green (1.0 in pores, 0.85 between), zero metalness in blue | 512 square | 0.75 MiB |

The PNGs are uncompressed (engine encoder), so the model carries about 6.3 MB of base64 for them; GPU memory with mipmaps is about 8 MiB. The images do not depend on the person, so their ids name content and every Human shares them; the module computes them once per process.

## Sampling limits

A pore of 0.08 mm spans two texels and is below one pixel at head-close-up distance (about 0.27 mm per pixel), where mipmapping averages it into slight specular breakup. The normal map is resolved only in eye and cheek close-ups. Normal averaging loses the slope variance that would broaden a highlight; [LEAN mapping](https://userpages.cs.umbc.edu/olano/papers/lean/) addresses that for its own Ward/Beckmann formulation, not automatically for the installed GGX material. A normal map changes shading without silhouette displacement.
