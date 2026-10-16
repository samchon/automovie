# Skin material and procedural maps

## Skin optics

- Donner and Jensen (2006) model skin with four parameters: hemoglobin fraction Ch (typical 0.001 to 0.1), melanin fraction Cm (0 to 0.5), melanin type blend βm between eumelanin and pheomelanin (0 to 1), and oiliness ρs (0 to 1). Surface reflection is a Torrance-Sparrow BRDF with a Beckmann distribution; roughness m in 0.2 to 0.4 "give good results for skin", and they use m = 0.35 throughout, controlling oiliness by ρs instead of m (`../sources/donner-jensen-2006-spectral-skin.md`).
- d'Eon and Luebke (GPU Gems 3, chapter 14): about 6 percent of incident light reflects at the oily surface; F0 = 0.028 from an index of refraction of 1.4; the specular colour should be white; skin diffusion needs six Gaussians to fit the three-layer model; "the true normal information should be used for both specular and diffuse computations"; Weyrich et al. 2006 measured roughness and specular intensity for ten facial regions over 149 faces, which can be painted as a low-resolution two-channel map (`../sources/deon-luebke-2007-skin-rendering.md`).

For Human: the pigmentation parameters of `IAutoMovieHumanIdentity` follow the Donner-Jensen quantities (melanin fraction, melanin type blend, hemoglobin fraction, oiliness). A converter maps them to the viewer's material: base colour (linear RGB) from the chromophores, specular F0 0.028 (index 1.4) with white specular, roughness from oiliness and region, and `subsurfaceRadius` per channel. The conversion from chromophores to RGB is a formula Human owns and documents; the spectral model itself is too heavy to evaluate per frame.

## Regional variation

Lips, palms, soles, nail beds, eyelids and ears differ in pigmentation, haemoglobin and roughness. Two carriers exist in `IAutoMovieMesh` and `IAutoMovieMaterial` today:

- `colors`: a per-vertex linear RGB multiplier of the base colour, enough for regional tint at the subdivision levels Human emits.
- A material per region requires splitting the skin into parts, which breaks the single joined surface; avoid it.

Roughness and specular intensity have no per-vertex channel, so regional roughness needs either a texture on the published UV layout or a core addition (`../core/gaps.md`).

## Micro-relief

- Worley's cellular basis partitions space into random cells with feature points from a hashed cube ID and a seeded linear congruential generator, needs no precalculation or table storage, and produced "organic crusty skin" textures (`../sources/worley-1996-cellular-texture.md`).

For Human: pores and fine wrinkles are a tangent-space normal map generated from a cellular field (pore pits at feature points, density and size by region) plus oriented ridges along Langer's lines for fine wrinkles, all from a fixed seed. Two layers fit the material as it is: `normalTexture` on the published UV layout for region-dependent relief, and `detailNormalTexture` tiled for pores. `reliefWeights` already scales the normal map per vertex, which suits wrinkles that flatten as a joint stretches the skin. Roughness variation (pores hold oil differently from ridges) goes in the green channel of `metallicRoughnessTexture`.

## Delivery of generated images

`IAutoMovieModel.images` now carries generated image bytes. The viewer resolves a texture id against those images before project assets, and Human's `AutoMovieHuman.getModel()` collects attachment, skin-finish and hair images. The original delivery gap is closed; [#2844](https://github.com/samchon/automovie/issues/2844) still requires appearance and save/resume verification. The optical model and regional recommendations above are research premises, not proof that every material quantity has been implemented or accepted.
