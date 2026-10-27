# Skin appearance

Each value holds only for its cited population, posture and measurement protocol. Derived ratios are research constraints, not generator defaults or clinical identity.

This file gives pigmentation parameters, colour, translucency, specular and micro-relief values. Rendering technique is in [skin-material](../techniques/skin-material.md).

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

Hemoglobin absorption from Prahl's compilation is σa(λ) = 0.0054 · e(λ) cm⁻¹ for whole blood at 150 g/L ([prahl-hemoglobin-spectra](../sources/prahl-hemoglobin-spectra.md)). For example, HbO2 is 55,540 and Hb 40,092 cm⁻¹/M at 576 nm but 368 and 3,750 at 650 nm, so red light survives deep and scatters wide while green and blue are absorbed near the surface.

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

An identity describes individual pigmentation with Cm and βm rather than an RGB colour. Conventional population defaults do not measure an individual's optical quantities. Melanin is constant across one person's expressions; hemoglobin varies (Jimenez 2010).

## Dynamic colour

[Jimenez 2010](../sources/jimenez-2010-dynamic-facial-color.md) measured four adults under its own protocol. Expression-induced hemoglobin changes were repeatable, and compressed, stretched and flushed regions changed differently. Its renders used 127 percent for anger and 81 percent for fear. Its renderer uses a 2D colour lookup over (Cm, Chd) at fixed βm and Che = 0.25 Chd. These are the source's observations and modelling choices, not universal expression multipliers.

## Translucency

- Lateral diffusion: d'Eon and Luebke's six-Gaussian skin profile ([deon-luebke-2007-skin-rendering](../sources/deon-luebke-2007-skin-rendering.md)) has variances 0.0064, 0.0484, 0.187, 0.567, 1.99, 7.41 mm² with red weights 0.233, 0.100, 0.118, 0.113, 0.358, 0.078; green 0.455, 0.336, 0.198, 0.007, 0.004, 0; blue 0.649, 0.344, 0, 0.007, 0, 0. The derived weighted standard deviation per channel is red 1.18 mm, green 0.26 mm, blue 0.16 mm (0.00118, 0.00026, 0.00016 m), candidate scales for a renderer's scattering approximation.
- Back-lit transmission through thin parts (ear, nostril rim, eyelids): three.js's example translucency shader ([threejs-r186-subsurface](../sources/threejs-r186-subsurface.md)) adds (pow(saturate(V·-(L + N·0.1)), 2) · 10 + ambient) · thickness · 0.1 to direct diffuse. The thickness must come from the emitted geometry and hold for the supported light directions and thin structures; construction offsets are not optical path lengths, and a curvature approximation does not establish thin-part transmission.

## Specular

F0 is 0.028 from index 1.4, with white specular colour ([deon-luebke-2007-skin-rendering](../sources/deon-luebke-2007-skin-rendering.md)). Beckmann roughness is about 0.35 (Donner-Jensen), with ρs scaling oiliness. [Weyrich 2006](../sources/weyrich-2006-skin-reflectance.md) measured differing reflectance distributions in ten facial regions. These measurements do not directly calibrate GGX roughness, an artistic oiliness mapping or whole-body values.

## Homogeneity and age

The Fink perception study relates colour homogeneity to perceived age and attractiveness ([fink-2008-skin-colour-distribution](../sources/fink-2008-skin-colour-distribution.md), abstract). It does not establish universally smooth young skin or an age-only pigment-patch distribution. Procedural variation needs its own stated scale, amplitude and regional assumptions.

## Micro-relief

The Jimenez 2010 renderer masks wrinkle maps by expression zones and combines them as partial-derivative normals. [Skin-feature distribution sources](../sources/skin-feature-distribution.md) records measured cheek-visible depressions and site-specific follicles, each under its own protocol. These do not calibrate a universal pore tile, and no general pore-depth or wrinkle-depth distribution was found.

## Open questions

- Calibrated regional chromophore fractions for lips, palms, soles, nail beds, the areas around the eyes and the ear; the cell counts and colour measurements read do not supply them.
- Pore entities, density and diameter beyond the specific protocols read, and fine-wrinkle spacing and depth by age.
- The reflectance formula from (Cm, βm, Ch) to RGB: the multipole model (Donner and Jensen 2005) was not read, and a simpler two-layer formula needs its own validation against the paper's figures.
- A mapping from the Weyrich regional reflectance measurements to the renderer's material parameters.
- Vellus hair (peach fuzz) sheen on cheeks and its age and sex dependence.
