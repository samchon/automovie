# Bommes et al. 2013, quad-mesh generation and processing

Bommes D, Lévy B, Pietroni N, Puppo E, Silva C, Tarini M, Zorin D. "Quad-Mesh Generation and Processing: A Survey." Computer Graphics Forum 32(6):51-76, 2013. Read from https://cims.nyu.edu/~dzorin/papers/bommes2013qmg.pdf (sections 1 to 2.2 and 4.3.4).

## Licence

Copyright the authors, the Eurographics Association and Wiley. Human takes design principles only.

## What it says

- Character meshes are designed with elements "arranged to follow line features of the represented shape, as well as to adapt to deformations imposed by animation"; quads suit this better than triangles.
- Quad and quad-dominant meshes are the control meshes of subdivision surfaces, the entertainment industry's standard.
- Semi-regular quad meshes map each patch trivially to a rectangle of texture.
- In cylinder-like regions, edges aligned with principal curvature give flatter quads and better approximation. Langer's lines are cited as feature lines for animatable human models.
- Resolution transitions need extra irregular vertices unless T-junctions are allowed.
- Good placement of irregular vertices "is crucial", is a modeller's skill, is "especially stereotyped" for human heads and bodies, and depends on the intended use.

## What Human takes

Cage design principles and one UV rectangle per patch (`../techniques/subdivision-and-cage.md`, `../techniques/uv-layout.md`).
