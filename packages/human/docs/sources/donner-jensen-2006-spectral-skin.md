# Donner and Jensen 2006, spectral BSSRDF for skin

Donner C, Jensen HW. "A Spectral BSSRDF for Shading Human Skin." Eurographics Symposium on Rendering 2006, pp. 409-417. Read from https://cseweb.ucsd.edu/~henrik/papers/skin_bssrdf/skin_bssrdf.pdf (abstract, sections 1 to 3.4).

## Licence

Copyright the authors and the Eurographics Association. Human takes the parameterization and quoted ranges, citing the paper.

## What it says

- Four parameters control oil, melanin and hemoglobin and match African, Asian and Caucasian skin types.
- Two layers: epidermis absorption from melanin, a blend of eumelanin and pheomelanin; dermis absorption from oxygenated and deoxygenated hemoglobin plus a baseline.
- Table 1 typical ranges:

| Parameter | Meaning | Typical range |
| --- | --- | --- |
| Ch | Hemoglobin fraction | 0.001 to 0.1 |
| Cm | Melanin fraction | 0 to 0.5 |
| βm | Melanin type blend | 0 to 1 |
| ρs | Oiliness | 0 to 1 |

- Surface: Torrance-Sparrow BRDF with a Beckmann distribution; roughness m in 0.2 to 0.4 "give good results for skin", m = 0.35 for all results, oiliness controlled by ρs.

## What Human takes

The pigmentation parameters of the identity and their ranges, converted to viewer material values by a documented formula (`../techniques/skin-material.md`).

## Absorption and scattering formulas (added; read from sections 3.3 to 3.5 of the same PDF)

λ in nanometres, coefficients in mm⁻¹. Grade: fits to published measurements (population-fitted), the rest conventional modelling choices.

| Quantity | Formula or value | Basis stated |
| --- | --- | --- |
| Eumelanin absorption | σa,em(λ) = 6.6 × 10¹⁰ λ^-3.33 | fit to Jacques and McAuliffe 1991 |
| Pheomelanin absorption | σa,pm(λ) = 2.9 × 10¹⁴ λ^-4.75 | authors' fit |
| Baseline absorption | σa,baseline(λ) = 0.0244 + 8.53 e^-(λ-154)/66.2 | Jacques 1998 |
| Epidermis | σa,epi = Cm (βm σa,em + (1-βm) σa,pm) + (1-Cm) σa,baseline | equation 6 |
| Dermis | σa,derm = Ch (γ σa,oxy + (1-γ) σa,deoxy) + (1-Ch) σa,baseline | equation 7 |
| Blood oxygenation γ | 0.75 fixed; varies 0.6 to 0.8 over sites and skin types | |
| Dermal hemoglobin fraction Ch | "usually about 0.1% - 20%" by location and skin type | |
| Reduced scattering | σ's(λ) = 14.74 λ^-0.22 + 2.2 × 10¹¹ λ^-4 (Mie plus Rayleigh) | |
| Dermis scattering | 50 percent of the epidermal value | |
| Epidermis thickness | 0.25 mm fixed | |
| Index of refraction | 1.4 throughout | |
| Dermis | semi-infinite | |

Figure captions: Cm swept 0.1 to 50 percent at βm 0.7 and Ch 0.5 percent goes from pale to dark brown; Ch swept 0.1 to 20 percent goes pale and translucent to pink to purple; lower βm (more pheomelanin) reads yellowish, higher βm tan and brown. The paper places Asian skin near the middle of its parameter chart.
