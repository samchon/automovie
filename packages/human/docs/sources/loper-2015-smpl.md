# Loper et al. 2015, SMPL

Loper M, Mahmood N, Romero J, Pons-Moll G, Black MJ. "SMPL: A Skinned Multi-Person Linear Model." ACM Transactions on Graphics 34(6) (SIGGRAPH Asia 2015). Read from https://files.is.tue.mpg.de/black/papers/SMPL2015.pdf (abstract, sections 1 to 3).

## Licence

Paper copyright ACM. The paper states that the model "is available for research purposes"; its learned data is unusable here both for that reason and under the no-external-data decision. Human takes only the formulation.

## What it says

- A skinned vertex-based body model whose template, blend weights, pose-dependent and identity-dependent blend shapes and joint regressor are learned from scans.
- Pose-dependent blend shapes are a linear function of the elements of the pose rotation matrices minus the rest-pose rotations, (R(θ) - R(θ*)), with 23 joints giving 207 elements.
- LBS and DQBS without correctives "produce serious artifacts at the knees, elbows, shoulders and hips"; the default SMPL uses DQBS with the correctives.
- At most four parts influence a vertex.

## What Human takes

The evidence that correctives are needed with either blend, and the form of a corrective driven by rotation elements, which Human writes as formulas instead of learning (`../techniques/skinning.md`).
