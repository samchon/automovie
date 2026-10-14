# Skin appearance

Covers the skin half of #2801: pigmentation parameters, colour, translucency, specular and micro-relief, as values. Rendering technique and delivery live in `../techniques/skin-material.md`.

## Layered optical model

Two layers over a semi-infinite dermis (`../sources/donner-jensen-2006-spectral-skin.md`, population-fitted spectra; λ in nm, coefficients in mm⁻¹):

```
σa,em(λ)   = 6.6e10 · λ^-3.33                 eumelanin
σa,pm(λ)   = 2.9e14 · λ^-4.75                 pheomelanin
σa,base(λ) = 0.0244 + 8.53 · exp(-(λ - 154) / 66.2)
σa,epi     = Cm · (βm σa,em + (1 - βm) σa,pm) + (1 - Cm) σa,base
σa,derm    = Ch · (γ σa,oxy + (1 - γ) σa,deoxy) + (1 - Ch) σa,base,  γ = 0.75
σ's(λ)     = 14.74 · λ^-0.22 + 2.2e11 · λ^-4  (epidermis; dermis 50 percent of it)
epidermis 0.25 mm, index of refraction 1.4
```

Hemoglobin absorption from Prahl's compilation: σa(λ) = 0.0054 · e(λ) cm⁻¹ for whole blood at 150 g/L (`../sources/prahl-hemoglobin-spectra.md`); e.g. HbO2 55,540 and Hb 40,092 cm⁻¹/M at 576 nm but 368 and 3,750 at 650 nm, so red light survives deep and scatters wide while green and blue are absorbed near the surface.

## Pigmentation parameters

| Parameter | Range | Basis | Grade | Source |
| --- | --- | --- | --- | --- |
| Melanin volume fraction Cm | light adults 0.013 to 0.063, moderately pigmented 0.11 to 0.16, darkly pigmented 0.18 to 0.43 | melanosome volume fractions | measured (relayed) | `../sources/jacques-1998-skin-optics.md` |
| Cm model range | 0 to 0.5 | model | conventional | Donner-Jensen 2006, Jimenez 2010 |
| Melanin type blend βm (eumelanin share) | 0 to 1; 0.61 fixed in the Jimenez renderer; 0.7 in Donner-Jensen figures | model | conventional | Donner-Jensen, `../sources/jimenez-2010-dynamic-facial-color.md` |
| Dermal hemoglobin Ch | typical 0.001 to 0.1; "about 0.1% - 20%" by site; Jimenez lookup 0.003 to 0.32 | model | conventional | Donner-Jensen, Jimenez |
| Average dermal blood volume | about 0.002; 0.02 to 0.05 locally in the venous plexus | blood volume fraction | measured (relayed) | Jacques 1998 |
| Epidermal hemoglobin | 25 percent of dermal (Jimenez renderer) | model | conventional | Jimenez 2010 |
| Blood oxygenation γ | 0.6 to 0.8, fixed 0.75 | relayed | conventional | Donner-Jensen |
| Oiliness ρs | 0 to 1, with Beckmann roughness m = 0.35 | model | conventional | Donner-Jensen |

Ancestry and individual variation live in Cm and βm; an identity stores these, never an RGB colour. Melanin is constant across expressions for one person; hemoglobin varies (Jimenez 2010).

## Dynamic colour

From `../sources/jimenez-2010-dynamic-facial-color.md` (measured on four adults): expression-induced hemoglobin changes are highly repeatable per expression; compressed skin drains and stretched or flushed regions gain blood; global states scale hemoglobin (the paper's renders used 127 percent for anger, 81 percent for fear). Rendering uses a 2D lookup of colour over (Cm, Chd) at fixed βm and Che = 0.25 Chd, so per-pixel cost is one texture fetch. For Human the expression document drives a per-region hemoglobin scale; identity sets the neutral maps.

## Translucency

- Lateral diffusion: d'Eon and Luebke's six-Gaussian skin profile (`../sources/deon-luebke-2007-skin-rendering.md`), variances 0.0064, 0.0484, 0.187, 0.567, 1.99, 7.41 mm² with red weights 0.233, 0.100, 0.118, 0.113, 0.358, 0.078; green 0.455, 0.336, 0.198, 0.007, 0.004, 0; blue 0.649, 0.344, 0, 0.007, 0, 0. Weighted standard deviation per channel (derived): red 1.18 mm, green 0.26 mm, blue 0.16 mm, the obvious starting values for the viewer's `subsurfaceRadius` (in metres: 0.00118, 0.00026, 0.00016).
- Back-lit transmission through thin parts (ear, nostril rim, eyelids): three.js's translucency shader (`../sources/threejs-r186-subsurface.md`) adds (pow(saturate(V·-(L + N·0.1)), 2) · 10 + ambient) · thickness · 0.1 to direct diffuse; it needs a per-surface thickness, which the generator knows exactly (ear cartilage plate, alar wall, lid).

## Specular

F0 = 0.028 from index 1.4, white specular colour (`../sources/deon-luebke-2007-skin-rendering.md`); Beckmann roughness about 0.35 (Donner-Jensen), with ρs scaling oiliness. Weyrich 2006's per-region roughness and intensity (ten facial regions, 149 faces) are cited by d'Eon and Jimenez but were not read; the nose and lips are shinier per d'Eon.

## Homogeneity and age

Even skin colour distribution, independent of shape and relief, draws attention and reads younger and more attractive (`../sources/fink-2008-skin-colour-distribution.md`, abstract). Young identities get smooth melanin and hemoglobin maps; age adds low-frequency patchiness in both.

## Micro-relief

Procedural pores and fine wrinkles as normal maps are described in `../techniques/skin-material.md` (cellular noise after Worley 1996). Wrinkle maps masked by expression zones and combined as partial-derivative normals are the Jimenez 2010 renderer's method. No measured pore density, pore size or wrinkle depth was found in the sources read.

## Open questions

- Regional pigment and blood for lips, palms, soles, nail beds, areas around the eyes and the ear: no measured values read. These carry visible colour differences and need sources.
- Pore density and diameter by facial region, and fine-wrinkle spacing and depth by age.
- The reflectance formula from (Cm, βm, Ch) to RGB: the multipole model (Donner and Jensen 2005) was not read; a simpler two-layer formula would need its own validation against the paper's figures.
- Weyrich 2006 regional specular values.
- Vellus hair (peach fuzz) sheen on cheeks and its age and sex dependence.
