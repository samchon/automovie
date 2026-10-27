# Abdrashitov et al. 2023, robust skin weight transfer

Abdrashitov R, Raichstat K, Monsen J, Hill D. "Robust Skin Weights Transfer via Weight Inpainting." SIGGRAPH Asia 2023 Technical Communications, doi:10.1145/3610543.3626180. Read from the authors' preprint, https://www.dgp.toronto.edu/~rinat/projects/RobustSkinWeightsTransfer/preprint.pdf (sections 1 to 4). Unreal Engine's `FTransferBoneWeights` (https://dev.epicgames.com/documentation/unreal-engine/API/Plugins/DynamicMesh/FTransferBoneWeights) exposes the same two methods, closest point and inpainting.

## Licence

Paper copyright ACM, author's version for personal use. Read for technique comparison only.

## What it says

- Garments are commonly bound to a skeleton by copying skin weights from the body: for each garment vertex, the closest point on the body and barycentric interpolation of its weights. This works for skin-tight clothing and fails for loose clothing, at the armpits, the crotch and between the legs.
- Stage one copies weights only where the match is trusted: closest point within D = 0.05 of the garment's bounding-box diagonal and normals within 35 degrees; an optional pass retries with flipped normals for inner layers.
- Stage two inpaints the remaining vertices by minimizing a combination of Dirichlet and Laplacian energies (cotangent Laplacian with lumped mass) with the copied rows fixed, solved as one sparse linear system per bone; slightly negative results are clamped and renormalized. A few Laplacian smoothing iterations can follow, useful at the armpits and the crotch.
- Artists may edit the trusted mask, for example to exclude a collar.
