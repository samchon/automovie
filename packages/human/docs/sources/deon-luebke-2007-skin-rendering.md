# d'Eon and Luebke 2007, advanced real-time skin rendering

d'Eon E, Luebke D. "Advanced Techniques for Realistic Real-Time Skin Rendering." GPU Gems 3, chapter 14, NVIDIA, 2007. Read at https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-14-advanced-techniques-realistic-real-time-skin (the first 100,000 characters).

## Licence

Book chapter published free online by NVIDIA.

## What it says

- About 6 percent of incident light reflects directly at the oily surface layer.
- Specular: Kelemen/Szirmay-Kalos model with a Beckmann distribution; Fresnel F0 = 0.028 from an index of refraction of 1.4; specular colour white.
- Weyrich et al. 2006 measured roughness m and specular intensity ρs for ten facial regions over 149 faces; the chapter suggests a low-resolution two-channel map for them but does not reproduce the values.
- Diffusion profiles as sums of Gaussians; skin needs six Gaussians to fit the three-layer model of Donner and Jensen 2005; the six weights per channel sum to 1, so the diffuse colour map sets the tone.
- Texture-space diffusion with separable seven-tap blurs and a stretch-correction texture.
- "The true normal information should be used for both specular and diffuse computations".

## Sum-of-Gaussians skin profile

[Figure 14-13](https://developer.download.nvidia.com/books/gpugems3/14fig13.jpg) supplies the weights and variances. Each Gaussian is a 2D normalized Gaussian of variance v (mm²); the diffusion profile per channel is Σ wᵢ G(vᵢ, r). Grade: fitted by the authors to the three-layer Donner-Jensen profile for skin (derived).

| Variance (mm²) | Red | Green | Blue |
| --- | --- | --- | --- |
| 0.0064 | 0.233 | 0.455 | 0.649 |
| 0.0484 | 0.100 | 0.336 | 0.344 |
| 0.187 | 0.118 | 0.198 | 0 |
| 0.567 | 0.113 | 0.007 | 0.007 |
| 1.99 | 0.358 | 0.004 | 0 |
| 7.41 | 0.078 | 0 | 0 |

Red scatters furthest (36 percent of its weight at variance 1.99 mm², standard deviation 1.4 mm), blue barely leaves the entry point. The weighted standard deviation √(Σ wᵢ vᵢ) of each channel is red 1.18 mm, green 0.26 mm and blue 0.16 mm (derived, not in the chapter).
