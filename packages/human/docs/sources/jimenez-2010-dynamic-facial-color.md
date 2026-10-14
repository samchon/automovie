# Jimenez 2010, practical appearance model for dynamic facial colour

Jimenez J, Scully T, Barbosa N, Donner C, Alvarez X, Vieira T, Matts P, Orvalho V, Gutierrez D, Weyrich T. "A Practical Appearance Model for Dynamic Facial Color." *ACM Transactions on Graphics* 29(6):141, 2010 (SIGGRAPH Asia), doi:10.1145/1866158.1866167. Read from the author copy https://www.iryoku.com/skincolor/downloads/A-Practical-Appearance-Model-for-Dynamic-Facial-Color.pdf (sections 3, 6, 7, Table 1, Figure 9).

## Licence

Copyright ACM; author-hosted copy. Human takes the parameterization and observations, citing the paper.

## Population and protocol

Four Caucasian subjects (one woman 33, men 26, 33, 35), polarized imaging decomposed into melanin and hemoglobin maps, across the six basic emotions repeated several times, plus exercise and alcohol for one subject. Grade: measured on four people; the parameter ranges are the spectral model's.

## Findings

- Expression-induced changes were highly repeatable; melanin stayed constant across measurements of an individual; hemoglobin varied greatly.
- Visible blood sits in the capillaries from the superficial sub-papillary plexus.
- Global states (anger, fear) scale hemoglobin: the renders used 127 percent for anger and 81 percent for fear relative to neutral.

## Table 1 parameters (Donner et al. 2008 spectral model)

| Parameter | Meaning | Range |
| --- | --- | --- |
| Cm | Melanin fraction | 0 to 0.5 |
| βm | Melanin type blend | 0 to 1 |
| Che | Epidermal hemoglobin fraction | 0 to 0.1 |
| Chd | Dermal hemoglobin fraction | 0 to 0.32 |

The real-time renderer precomputes skin colour into a 2D lookup texture indexed by melanin and hemoglobin (Figure 9 axes: Cm 0, 0.002, 0.0135, 0.0425, 0.1, 0.185, 0.32, 0.5; Chd 0.003 to 0.32), with βm fixed at 0.61 (61 percent eumelanin) and Che at 25 percent of Chd. Subsurface scattering is the screen-space separable sum-of-Gaussians of Jimenez 2009, applied to diffuse light only, with albedo applied after scattering. Specular is Kelemen/Szirmay-Kalos with spatially varying roughness and intensity after Weyrich 2006. Wrinkles are masked zones that add partial-derivative normal maps.

## What Human takes

The appearance rig: identity sets melanin, the expression state scales a hemoglobin map per region (flush in anger, pallor in fear, local blanching where skin is compressed), and colour comes from a 2D lookup over (melanin, hemoglobin) rather than a spectral evaluation per frame.
