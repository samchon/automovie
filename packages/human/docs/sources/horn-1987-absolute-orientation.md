# Horn 1987, absolute orientation by unit quaternions

Horn BKP. "Closed-form solution of absolute orientation using unit quaternions." Journal of the Optical Society of America A 4(4), 629-642, April 1987. Read from the author's scan at https://people.csail.mit.edu/bkph/papers/Absolute_Orientation.pdf (pages 629-635: abstract, sections 1, 2.B to 2.E, 3 and 4.A to 4.C).

## Licence

Copyright 1987 Optical Society of America; read for reference only, nothing copied.

## What it says

- The least-squares transformation r_r = s R(r_l) + r_0 between corresponding points measured in a "left" and a "right" system is found in closed form, using every point rather than a selected few (sections 1 and 2.B).
- Translation: referring both sets to their centroids, the best offset is the right centroid minus the scaled, rotated left centroid (section 2.C).
- Scale can be found without knowing the rotation; the symmetric choice is the ratio of the two sets' root-mean-square spreads about their centroids (sections 2.D and 2.E). The rotation does not depend on which scale is chosen.
- Rotation: with M the 3 x 3 matrix of sums S_xy = sum of x'_l y'_r and so on over centred coordinates, the best unit quaternion maximises q^T N q, where N is a symmetric 4 x 4 matrix of sums and differences of M's elements: first row (S_xx + S_yy + S_zz, S_yz - S_zy, S_zx - S_xz, S_xy - S_yx), and so on, with zero trace (section 4.A).
- That quaternion is the eigenvector of N's most positive eigenvalue (section 4.B); the orthonormal rotation matrix follows from its components (section 3.E).

## Used for

`test/src/features/internal/HumanReferenceSurface.ts` removes each body segment's placement before reading the population's surface spread, so the spread is of shape, not of where a limb happens to sit.
