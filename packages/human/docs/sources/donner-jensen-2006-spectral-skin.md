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
