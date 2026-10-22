# Lévy et al. 2002, least squares conformal maps

Lévy B, Petitjean S, Ray N, Maillot J. "Least Squares Conformal Maps for Automatic Texture Atlas Generation." ACM Transactions on Graphics 21(3):362-371, 2002. Read from https://people.engr.tamu.edu/schaefer/teaching/689_Fall2006/p362-levy.pdf (abstract, sections 1 and 3).

## Licence

Paper copyright ACM.

## What it says

- A texture atlas decomposes a model into disc-like charts, parameterizes each and packs them.
- The LSCM objective minimizes angle deformation; its minimum is unique, independent of a similarity and of mesh resolution, and it cannot flip triangles.
- Chart boundaries go where discontinuities do not cause texture artifacts: high-curvature zones, where shading varies anyway, and not flat zones.
- A user decomposes a model "into parts resembling cylinders"; the automatic segmentation mimics that.
