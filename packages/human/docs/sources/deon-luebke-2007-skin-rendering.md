# d'Eon and Luebke 2007, advanced real-time skin rendering

d'Eon E, Luebke D. "Advanced Techniques for Realistic Real-Time Skin Rendering." GPU Gems 3, chapter 14, NVIDIA, 2007. Read at https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-14-advanced-techniques-realistic-real-time-skin (the first 100,000 characters).

## Licence

Book chapter published free online by NVIDIA. Human takes numbers and methods, citing the chapter.

## What it says

- About 6 percent of incident light reflects directly at the oily surface layer.
- Specular: Kelemen/Szirmay-Kalos model with a Beckmann distribution; Fresnel F0 = 0.028 from an index of refraction of 1.4; specular colour white.
- Weyrich et al. 2006 measured roughness m and specular intensity ρs for ten facial regions over 149 faces; the chapter suggests a low-resolution two-channel map for them but does not reproduce the values.
- Diffusion profiles as sums of Gaussians; skin needs six Gaussians to fit the three-layer model of Donner and Jensen 2005; the six weights per channel sum to 1, so the diffuse colour map sets the tone.
- Texture-space diffusion with separable seven-tap blurs and a stretch-correction texture.
- "The true normal information should be used for both specular and diffuse computations".

## What Human takes

Specular constants (F0 0.028, white specular), the per-region roughness idea, and normal-map usage (`../techniques/skin-material.md`). Weyrich et al. 2006 itself was not read.
