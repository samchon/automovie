# Baran and Popović 2007, Pinocchio heat weights

Baran I, Popović J. "Automatic Rigging and Animation of 3D Characters." ACM Transactions on Graphics 26(3) (SIGGRAPH 2007). Read from https://people.csail.mit.edu/ibaran/papers/2007-SIGGRAPH-Pinocchio.pdf (section on skin attachment).

## Licence

Paper copyright ACM. Human takes the method only.

## What it says

- The character volume is treated as an insulated heat-conducting body; bone i is held at temperature 1 and others at 0, and the equilibrium temperature at a surface vertex is bone i's weight.
- Solved over the surface only: (-Δ + H) w_i = H p_i, with Δ the cotangent Laplacian, p_ij = 1 if bone i is nearest to vertex j, and H_jj = c / d(j)^2 when the segment to the nearest bone stays inside the volume, else 0. With k equidistant bones, p_j = 1/k for each and H_jj = kc / d(j)^2.
- c = 1 is used (anisotropic heat diffusion) because it looks more natural; c near 0.22 approximates volumetric equilibrium.

## What Human takes

An offline check for Human's analytic weights: a large difference from the heat solution at the same vertex marks a formula to inspect (`../techniques/skinning.md`).
