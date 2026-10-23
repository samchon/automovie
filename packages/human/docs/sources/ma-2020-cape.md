# Ma et al. 2020, CAPE

Ma Q, Yang J, Ranjan A, Pujades S, Pons-Moll G, Tang S, Black MJ. "Learning to Dress 3D People in Generative Clothing." CVPR 2020. Read from arXiv 1907.13615v3, https://arxiv.org/html/1907.13615v3 (method and limitations). Read 2026-10-23.

## Licence

Paper copyright the authors; arXiv non-exclusive licence. Read for technique comparison only; no data or model is used.

## What it says

- Clothing is a displacement layer on the SMPL body mesh: one 3D offset per body vertex, so the clothing graph inherits SMPL's topology. Offsets are measured as the difference between clothed and minimally clothed registrations in the unposed space.
- The clothed template is the body template plus the clothing displacement, posed by SMPL's own blend skinning; the displacement is learned so that it is correct after posing, and it depends on pose.
- Limits stated: garments whose topology differs from the body, such as skirts and open jackets, cannot be represented by offsets; detail is bounded by the SMPL mesh resolution; clothing depends on pose but not on dynamics.
