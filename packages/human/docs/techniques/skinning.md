# Skinning

A valid joint angle does not establish acceptable tissue deformation. Compare deformation methods against the same rest surface, joint frames and boundary conditions; no method in this research note is certified as implemented in Human.

## Choice of deformation

| Method | Useful property | Limitation | Primary source |
| --- | --- | --- | --- |
| Linear blend skinning | Simple weighted matrices | Twist and bend can lose volume | [Kavan et al.](../sources/kavan-2008-dual-quaternion-skinning.md) |
| Dual quaternion skinning | Rigid blends avoid the LBS twist collapse | Joint bulging; relative rotations beyond 180 degrees can flip; scale needs separate treatment | [Kavan et al.](../sources/kavan-2008-dual-quaternion-skinning.md) |
| Optimized centres of rotation | Per-vertex centres improve bend behavior using the same rest mesh and weights | Additional precomputation and per-vertex data; some volume loss | [Le and Hodgins](../sources/le-hodgins-2016-optimized-centers.md) |
| Direct Delta Mush | Preserves rest detail after smoothing | Heavier per-vertex representation and work | [Le and Lewis](../sources/le-lewis-2019-direct-delta-mush.md) |

No blend alone supplies elbow, knee, shoulder or hip tissue folds. [SMPL](../sources/loper-2015-smpl.md) demonstrates the role of pose-dependent corrections, but its learned assets are outside Human's code-generated representation. [Pose space deformation](../sources/lewis-2000-pose-space-deformation.md) supplies the formulation for local displacements driven by pose. Core's scalar clinical-angle morph drivers do not establish that Human has supplied suitable anatomical formulas or cover effects needing multiple coupled angles.

## Weight construction

[Pinocchio](../sources/baran-popovic-2007-pinocchio.md) derives weights from heat equilibrium, [bounded biharmonic weights](../sources/jacobson-2011-bounded-biharmonic-weights.md) from constrained smoothness, and [geodesic voxel binding](../sources/maya-geodesic-voxel-binding.md) from volumetric distance. Their geometry and boundary assumptions differ from formulas using known part, station and angular semantics. Neither family has been established as Human's replacement.

Four influence slots limit the delivered weights. Keeping and normalizing the largest four can discard meaningful branch influence; the slot count does not establish deformation quality. DQS rotation limits concern actual relative influenced-bone rotations, not merely each admitted joint angle.
