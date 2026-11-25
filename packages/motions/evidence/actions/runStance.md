# src/actions/runStance.ts#runStance.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The leg's length at a knee flexion is the law of cosines over the thigh and the shank; the heights are that length over the horizontal reach; the push is found by bisection on the ankle's distance from the hip, which falls as the heel rises about the ball.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two heights, one cosine fit and two bisections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A stance whose landing would leave the hip no higher than at mid-stance is given no oscillation rather than one rising at mid-stance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains both forty-halving searches and each mid-stance trial's bounded rocker search; the fixed ball contact and rigid-pivot/rocker geometry prepare once before the height trials.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

HumanFoot.offset owns sole points and walkFoot.STRIKE the landing pitch; HumanFoot.preparePivot and walkLeg.prepareHeelRise share this solve's unchanged ball/heading geometry across all trial hips.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/runStance.ts#runStance.airborne

## @evidence contracts/development/common.md#meaningful-documentation

States why a foot in the air claims only its ends and how they join.

## @evidence contracts/development/implementation.md#principled-implementation

A swinging foot's own reach is held by the swing's clamp; the pelvis answers only to the stances.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One blend.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is skipped.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's `minimumJerk`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
