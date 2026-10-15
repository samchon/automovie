# Le and Hodgins 2016, optimized centers of rotation

Le BH, Hodgins JK. "Real-time Skeletal Skinning with Optimized Centers of Rotation." ACM Transactions on Graphics 35(4) (SIGGRAPH 2016). Read from Disney Research's copy at https://la.disneyresearch.com/wp-content/uploads/Real-time-Skeletal-Skinning-with-Optimized-Centers-of-Rotation-Paper.pdf (abstract, sections 1 to 3).

## Licence

Paper copyright the authors, publication rights ACM. Human takes the method only.

## What it says

- LBS and DQS are the most widely used methods; their known artifacts are "collapsing elbows, candy wrapper twists, and bulging around the joints".
- LBS collapses and twists because linear blending produces shearing transformations that lose volume.
- DQS, like other non-linear blends, creates bulges near bent joints because "all vertices near a joint share the same center of rotation (CoR), which is located exactly at the joint".
- The method precomputes an optimized centre of rotation per vertex from the rest pose and the weights; at runtime the rotation is a normalized quaternion linear blend and the translation is t = R_lbs p* + t_lbs - R p*. Inputs are the same as LBS and DQS, so it fits existing pipelines; results show reduced DQS bulging on the chest and reduced LBS candy wrapper on the shoulder.
- Helper bones reduce volume loss by splitting large twist or bend angles over several bones.

## What Human takes

The explanation of the DQS bulge and the candidate fix to evaluate at the elbow, knee, shoulder and hip (`../techniques/skinning.md`, `../core/gaps.md`).
