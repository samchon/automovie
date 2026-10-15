# Kavan et al. 2008, dual quaternion skinning

Kavan L, Collins S, Žára J, O'Sullivan C. "Geometric Skinning with Approximate Dual Quaternion Blending." ACM Transactions on Graphics 27(4), Article 105, 2008. Read from the author's copy at https://users.cs.utah.edu/~ladislav/kavan08geometric/kavan08geometric.pdf (abstract, sections 1, 4.1, 4.2, 5 and 6).

## Licence

Paper copyright ACM, posted by permission for personal use. Human takes the method, reimplemented from the text (#2800 names this paper).

## What it says

- Linear blend skinning blends matrices linearly, which produces artifacts even for rigid transforms; the "candy-wrapper" under twist is the typical one.
- Dual quaternion linear blending gives a rigid transform per vertex, is approximate, avoids the artifacts of earlier methods and runs on the GPU; upgrading from LBS is easy.
- Antipodality: q and -q are the same transform, so signs must be made consistent before blending (section 4.1).
- Dual quaternions cannot represent scale or shear; non-rigid joint transforms need a separate first phase with extra 3 x 4 matrices (section 4.2).
- A "flipping artifact" occurs with joint rotations of more than 180 degrees; joint constraints usually prevent such rotations.

## What Human takes

DQS as the base blend, with antipodality resolved, rigid joints only, and the flip excluded by the admitted range of motion (`../techniques/skinning.md`).
