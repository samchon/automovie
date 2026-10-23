# Skin appearance

Values retain their cited population, posture and measurement protocol. Derived ratios and modeling suggestions are research constraints, not current generator defaults or clinical identity.

Covers pigmentation parameters, colour, translucency, specular and micro-relief, as values. Rendering technique and delivery live in [skin-material](../techniques/skin-material.md).

## Layered optical model

Two layers over a semi-infinite dermis ([donner-jensen-2006-spectral-skin](../sources/donner-jensen-2006-spectral-skin.md), population-fitted spectra; λ in nm, coefficients in mm⁻¹):

```
σa,em(λ)   = 6.6e10 · λ^-3.33                 eumelanin
σa,pm(λ)   = 2.9e14 · λ^-4.75                 pheomelanin
σa,base(λ) = 0.0244 + 8.53 · exp(-(λ - 154) / 66.2)
σa,epi     = Cm · (βm σa,em + (1 - βm) σa,pm) + (1 - Cm) σa,base
σa,derm    = Ch · (γ σa,oxy + (1 - γ) σa,deoxy) + (1 - Ch) σa,base,  γ = 0.75
σ's(λ)     = 14.74 · λ^-0.22 + 2.2e11 · λ^-4  (epidermis; dermis 50 percent of it)
epidermis 0.25 mm, index of refraction 1.4
```

Hemoglobin absorption from Prahl's compilation: σa(λ) = 0.0054 · e(λ) cm⁻¹ for whole blood at 150 g/L ([prahl-hemoglobin-spectra](../sources/prahl-hemoglobin-spectra.md)); e.g. HbO2 55,540 and Hb 40,092 cm⁻¹/M at 576 nm but 368 and 3,750 at 650 nm, so red light survives deep and scatters wide while green and blue are absorbed near the surface.

## Pigmentation parameters

| Parameter | Range | Basis | Grade | Source |
| --- | --- | --- | --- | --- |
| Melanin volume fraction Cm | light adults 0.013 to 0.063, moderately pigmented 0.11 to 0.16, darkly pigmented 0.18 to 0.43 | melanosome volume fractions | measured (relayed) | [jacques-1998-skin-optics](../sources/jacques-1998-skin-optics.md) |
| Cm model range | 0 to 0.5 | model | conventional | Donner-Jensen 2006, Jimenez 2010 |
| Melanin type blend βm (eumelanin share) | 0 to 1; 0.61 fixed in the Jimenez renderer; 0.7 in Donner-Jensen figures | model | conventional | Donner-Jensen, [jimenez-2010-dynamic-facial-color](../sources/jimenez-2010-dynamic-facial-color.md) |
| Dermal hemoglobin Ch | typical 0.001 to 0.1; "about 0.1% - 20%" by site; Jimenez lookup 0.003 to 0.32 | model | conventional | Donner-Jensen, Jimenez |
| Average dermal blood volume | about 0.002; 0.02 to 0.05 locally in the venous plexus | blood volume fraction | measured (relayed) | Jacques 1998 |
| Epidermal hemoglobin | 25 percent of dermal (Jimenez renderer) | model | conventional | Jimenez 2010 |
| Blood oxygenation γ | 0.6 to 0.8, fixed 0.75 | relayed | conventional | Donner-Jensen |
| Oiliness ρs | 0 to 1, with Beckmann roughness m = 0.35 | model | conventional | Donner-Jensen |

An identity describes individual pigmentation with Cm and βm, rather than an RGB colour. Conventional population defaults do not measure an individual's optical quantities. Melanin is constant across expressions for one person; hemoglobin varies (Jimenez 2010).

## Dynamic colour

From [jimenez-2010-dynamic-facial-color](../sources/jimenez-2010-dynamic-facial-color.md) (measured on four adults under the paper's protocol): expression-induced hemoglobin changes were repeatable; compressed, stretched and flushed regions changed differently. The paper's renders used 127 percent for anger and 81 percent for fear. Its renderer uses a 2D colour lookup over (Cm, Chd) at fixed βm and Che = 0.25 Chd. These are the source's observations and modeling choices, not universal expression multipliers.

An expression-driven regional hemoglobin field remains a proposed use of those observations; no implemented Human expression or pigment-map behavior is established here.

## Translucency

- Lateral diffusion: d'Eon and Luebke's six-Gaussian skin profile ([deon-luebke-2007-skin-rendering](../sources/deon-luebke-2007-skin-rendering.md)), variances 0.0064, 0.0484, 0.187, 0.567, 1.99, 7.41 mm² with red weights 0.233, 0.100, 0.118, 0.113, 0.358, 0.078; green 0.455, 0.336, 0.198, 0.007, 0.004, 0; blue 0.649, 0.344, 0, 0.007, 0, 0. Weighted standard deviation per channel (derived): red 1.18 mm, green 0.26 mm, blue 0.16 mm, candidate scales for a renderer's scattering approximation (in metres: 0.00118, 0.00026, 0.00016).
- Back-lit transmission through thin parts (ear, nostril rim, eyelids): three.js's example translucency shader ([threejs-r186-subsurface](../sources/threejs-r186-subsurface.md)) adds (pow(saturate(V·-(L + N·0.1)), 2) · 10 + ambient) · thickness · 0.1 to direct diffuse. A Human thickness field would need to be derived from the actual emitted geometry and validated for the supported light directions and thin structures. Construction offsets are not exact optical path lengths. A curvature-based approximation does not establish thin-part transmission.

## Specular

F0 = 0.028 from index 1.4, white specular colour ([deon-luebke-2007-skin-rendering](../sources/deon-luebke-2007-skin-rendering.md)); Beckmann roughness about 0.35 (Donner-Jensen), with ρs scaling oiliness. [Weyrich 2006](../sources/weyrich-2006-skin-reflectance.md) reports measured regional reflectance: ten facial regions have differing reflectance distributions. These measurements do not directly calibrate GGX roughness, an artistic oiliness mapping or whole-body values.

## Homogeneity and age

The Fink perception study relates colour homogeneity to perceived age and attractiveness ([fink-2008-skin-colour-distribution](../sources/fink-2008-skin-colour-distribution.md), abstract). It does not establish universally smooth young skin or an age-only pigment-patch distribution. Any procedural variation needs independently stated scale, amplitude and regional assumptions.

## Micro-relief

Procedural pores and fine wrinkles as normal maps are described in [skin-material](../techniques/skin-material.md) (cellular noise after Worley 1996). Wrinkle maps masked by expression zones and combined as partial-derivative normals are the Jimenez 2010 renderer's method. [Skin-feature distribution sources](../sources/skin-feature-distribution.md) records measured cheek-visible depressions and site-specific follicles with their distinct protocols. These do not calibrate a universal pore tile; no general depth or wrinkle-depth distribution was found.

## Open questions

- Calibrated regional chromophore fractions for lips, palms, soles, nail beds, areas around the eyes and the ear: cell counts and colour measurements read so far do not directly supply these values.
- Pore entities, density and diameter beyond the specific protocols now read, and fine-wrinkle spacing and depth by age.
- The reflectance formula from (Cm, βm, Ch) to RGB: the multipole model (Donner and Jensen 2005) was not read; a simpler two-layer formula would need its own validation against the paper's figures.
- A mapping from the directly read Weyrich regional reflectance measurements to the installed renderer's material parameters.
- Vellus hair (peach fuzz) sheen on cheeks and its age and sex dependence.
