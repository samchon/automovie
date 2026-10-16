# Skinning and skin weights

This note retains the initial method comparison and its sources. [#2843](https://github.com/samchon/automovie/issues/2843) replaces #2800's early DQS-only and closed-form-weight-only proposal: evaluate posed section re-sweeps for tubes, geometry/semantic-derived weights for branches and face, and anatomical correctives against a DQS baseline. Current Human joined skin still emits placeholder distance-based weights in `src/human/emitAutoMovieHumanSkin.ts`; admitting a pose does not establish its deformation quality.

## Methods

| Method | How it blends | Known artifacts | Source |
| --- | --- | --- | --- |
| Linear blend skinning (LBS) | Weighted sum of bone matrices | Elbow collapse near 180 degrees of bend, candy wrapper under twist, both from volume loss of the blended non-rigid matrix | `../sources/kavan-2008-dual-quaternion-skinning.md`, `../sources/le-hodgins-2016-optimized-centers.md`, `../sources/lewis-2000-pose-space-deformation.md` |
| Dual quaternion skinning (DQS) | Normalized weighted sum of unit dual quaternions, a rigid transform per vertex | Bulging near bent joints; a flipping artifact past 180 degrees of rotation; scale and shear need a separate first phase | `../sources/kavan-2008-dual-quaternion-skinning.md`, `../sources/le-hodgins-2016-optimized-centers.md` |
| Optimized centres of rotation (CoR) | Per-vertex centre p* precomputed from rest pose and weights; rotation R by normalized quaternion linear blend; translation t = R_lbs p* + t_lbs - R p*, so the centre moves as LBS moves it | Slight volume loss; same inputs as LBS and DQS plus one centre per vertex | `../sources/le-hodgins-2016-optimized-centers.md` |
| Delta Mush (DM) and Direct Delta Mush (DDM) | Smooth the rigidly skinned surface and add back rest-pose detail; DDM precomputes the smoothing into per-vertex multi-weights | DM iterates every frame; DDM is direct but heavier than LBS per vertex | `../sources/le-lewis-2019-direct-delta-mush.md` |

Facts that decide Human's choice:

- DQS bulges because "all vertices near a joint share the same center of rotation (CoR), which is located exactly at the joint" (`../sources/le-hodgins-2016-optimized-centers.md`). The bulge appears exactly where Human must look best: the elbow and knee crease, the chest under shoulder flexion.
- Kavan et al. note DQS flips past 180 degrees and that joint constraints usually prevent that (`../sources/kavan-2008-dual-quaternion-skinning.md`). Human's per-joint range admission alone is not evidence that every influenced bone pair stays below that relative rotation; the actual posed influences need checking.
- The CoR method keeps the LBS/DQS inputs (rest pose, weights, bone transforms) and adds a per-vertex centre computable once per identity from Human's own weights (`../sources/le-hodgins-2016-optimized-centers.md`).
- SMPL, a skinned body model, found that plain LBS and DQS "produce serious artifacts at the knees, elbows, shoulders and hips" and adds pose-dependent corrective blend shapes linear in the elements of (R(pose) - R(rest)) (`../sources/loper-2015-smpl.md`). Its learned data is not usable here (research licence, and no external data), but the formulation shows correctives are needed whichever blend is used.

## Initial recommendation for #2800

1. The initial proposal used DQS as the base because it removes the twist and collapse artifacts LBS shows on the forearm and the thigh. This default was superseded by the region-specific evaluation above.
2. Evaluate optimized centres of rotation against DQS at the elbow, knee, shoulder and hip in the viewer. If the DQS bulge shows, CoR is the orthodox next step, and its per-vertex centre is a core change (`../core/gaps.md`).
3. Express what neither blend can (the elbow and knee crease fold, the gluteal fold under hip flexion, the deltoid shape under abduction) as rule-based correctives: displacements in the rest pose computed by formula from joint angles, as pose space deformation defines them, "mappings from a pose space ... to displacements in the object local coordinate frames" (`../sources/lewis-2000-pose-space-deformation.md`).

## Where correctives run

Correctives are a function of pose, so they must run wherever the pose is applied. Core now carries relative morph targets and scalar clinical-angle drivers in `IAutoMovieMeshMorphTarget` and `IAutoMovieMorphTargetDriver`, with viewer application beside bone rotations. That capability removes the original delivery gap; Human must still generate and verify its anatomical correctives, and establish a reusable contract for effects the scalar driver cannot express. See the [core survey](../core/gaps.md).

## Weights from cage semantics

Automatic weighting methods compute weights from an arbitrary mesh:

- Pinocchio (Baran and Popović 2007) solves a heat-equilibrium system over the surface, (-Δ + H) w_i = H p_i, with the cotangent Laplacian Δ, p_ij = 1 when bone i is nearest to vertex j, and H_jj = c / d(j)^2 when the segment to the nearest bone stays inside the volume (c = 1), else 0 (`../sources/baran-popovic-2007-pinocchio.md`).
- Geodesic voxel binding voxelizes the mesh and takes weights from geodesic distance between skeleton and mesh voxels, robust to non-manifold and multi-component meshes, and needs every joint inside the volume (`../sources/maya-geodesic-voxel-binding.md`).
- Bounded biharmonic weights minimize the Laplacian energy under bound constraints, smooth, local and shape-aware (`../sources/jacobson-2011-bounded-biharmonic-weights.md`).

The initial plan proposed closed-form weights from each vertex's part, station and angle: smooth bone blends on tubes, spinal blends by trunk station, and shoulder blends by anatomical mass. These are candidate constructions, not the current placeholder weighting algorithm or a reason to dismiss geometry-derived methods. #2843 requires the choice to survive actual deformation/contact comparisons. Heat diffusion remains a useful offline comparison, with its geometry and boundary assumptions recorded.

## Influence count

`IAutoMovieMeshSkin` carries four influences per vertex. The current placeholder generator keeps its four largest distance-based influences and normalizes them. A replacement derived from geometry or semantics must quantify any discarded weight, particularly at shoulder and finger branches; four slots are a representation limit, not a proof of adequate deformation.
