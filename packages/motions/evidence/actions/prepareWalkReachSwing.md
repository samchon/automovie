# src/actions/prepareWalkReachSwing.ts#prepareWalkReachSwing

## @evidence contracts/development/common.md#meaningful-documentation

States fixed body/side/bounds, the varying settled frame and the optional share semantics inherited from walkReach.swing.

## @evidence contracts/development/implementation.md#principled-implementation

Holds the foot inside the leg-length sphere, the thigh-extension cone, the hip-twist clamp (keeping the foot's pitch and roll) and the ankle's side and bending ranges, with the optional boundary fade. A foot the ankle's range turns is raised to its scheduled low point but no higher than the least toe clearance of walking (`walkFoot.CLEARANCE`), never back to a higher scheduled clearance: raising the ankle bends the knee, leans the shank and turns the foot further, a loop whose gain nears one at a straight leg, so the target stays the few millimetres every swing keeps over the floor's contact height. While the reach ranges fade in, the scheduled foot's lowest sole socket keeps its horizontal place, so the ankle range's turn about the ankle does not slide the anchor `walkFoot` holds at the departure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed reach/range/socket terms precede the one swing reader; walkReach owns the bounds and the entry.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ankle range is applied to the foot's own rotation at every trial lift, so the floor reading is one function of the lift and the fixed-point and bisection stages agree, and the foot ends within `SETTLED` of its target height. Fixed-point lifts by the penetration run while each at least halves it; a slower one hands over to a bisection on the lift, bracketed by the last lift and a lift to hip height, which converges while the lowest point rises with the lift (a lift-to-turn gain under one). Should the hip-height lift still leave the foot under the floor, which no reachable pose does, the foot is lifted onto it and keeps that trial's turn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and bounded constant work per foot; time queries skip body-only reach, range trigonometry and socket lookup. One toe-angle offset serves all trial lifts, and the ankle range is prepared once for the foot's initial heading. Each fixed-point lift at least halves the penetration and the bisection halves its bracket, so a foot costs at most about twenty trials per stage at a micrometre against centimetres of penetration and a metre of bracket.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, side and the reach owner's bounds fix this reader. Each foot correction binds its own toe offset and initial heading; every pelvis, ankle, rotation, toe angle and queried share is evaluated for its own query.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds fixed body/bound/socket geometry; each correction releases its toe-offset and ankle-range readers on return or throw; no queried foot, hip, rotation or time history is kept.
