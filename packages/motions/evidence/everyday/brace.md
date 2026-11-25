# src/everyday/brace.ts#brace.plan

## @evidence contracts/development/common.md#meaningful-documentation

States what is planned, when the set is reached and how a short duration is treated; the law's doc gives the sources and the provisional magnitudes.

## @evidence contracts/development/implementation.md#principled-implementation

The original step and knee geometry place the body. Only the current planted feet constrain a requested shift. The palms are placed on the resulting posture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Plans the step and the set root once; the posture closure interpolates root, lean and palms on one minimum-jerk set curve and delegates legs to the stand law and hands to handGoals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

SET and SWING are cited and STEP derived from them; KNEE, STAGGER, HELD, SECONDS, LIFT, LEAN, AHEAD, SPREAD, RECEIVE and ELBOW_OUT are named provisional magnitudes with no source found; the centring runs exactly two corrections, a fixed precision policy, and the hull centre is the vertex mean, not the area centroid.

## @evidence contracts/development/implementation.md#efficient-algorithms

Planning costs two posture solves with centre-of-mass and hull evaluation, one lowering of the centred root so the landing foot asks no drop at `SET`, and the arms' one planned trajectory; each posture costs one leg solve and writes the planned arms. The standing legs' heading-dependent foot data is prepared once for the brace's fixed heading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The step, the set root, the foot data and the sternum's bone demand are prepared once per plan. The centring's two support solves share the set inclination's joints, one FK workspace and one ROM projector; each root tried is lowered and fitted afresh. The arm planner lends its FK workspace and ROM projector to each frame it asks for.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The centring releases its FK workspace and projector before returning the set root. The plan holds the body, the feet, the foot data and the bone demand until it is released; borrowed workspaces end with each call and enter no returned value.
