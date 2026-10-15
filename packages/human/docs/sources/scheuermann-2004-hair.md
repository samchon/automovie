# Scheuermann 2004, practical real-time hair rendering

Scheuermann T. "Practical Real-Time Hair Rendering and Shading." SIGGRAPH 2004 Sketches, ATI Research. Read from https://history.siggraph.org/wp-content/uploads/2022/12/2004-Talks-Scheuermann_Practical-Real-Time-Hair-Rendering-and-Shading.pdf (the full two-page sketch).

## Licence

Copyright the author and ACM. Human takes the shading and ordering method only.

## What it says

- Hair as "layered 2D polygon patches", with a base texture for bundle structure and opacity maps to break up the patches.
- Diffuse: max(0, 0.75 N·L + 0.25).
- Specular: Kajiya-Kay with the strand tangent, two terms per light after Marschner et al.: the primary shifted toward the tip, the secondary coloured by pigment, shifted toward the root and modulated by noise. Shift: T' = normalize(T + s N), with s from a texture.
- Ambient occlusion per vertex, precomputed.
- Approximate back-to-front order without runtime sorting: patches pre-sorted by distance from the head, then four passes (opaque depth prime with alpha test, opaque shading at equal depth, transparent back faces, transparent front faces). This assumes the patches move little relative to each other.

## What Human takes

The material requirements for cards (alpha, double sides, tangent-based anisotropic specular) and the pass ordering a renderer needs (`../techniques/hair-cards.md`, `../core/gaps.md`).
