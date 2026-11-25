# src/human/generation/IAutoMovieHumanTrunkInputs.ts#IAutoMovieHumanTrunkInputs

## @evidence contracts/development/common.md#meaningful-documentation

What the trunk and shoulders read: the person's tapes, courses and controls in calibration millimetres (the public input times the stature scale), the one fixed input every trunk piece is built from.

## @evidence contracts/development/design.md#principled-representation `hip`: Hip tape: the girth at the buttock point. `highHip`: High hip tape: midway between the waist and the hip. `waist`: Waist tape: the natural waist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanShoulderDatum.create. Also types AutoMovieHumanTrunkClosure.inputs, AutoMovieHumanTrunkKeys.inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `hip`, `highHip`, `waist`, `underbust`, `chest`, `bustSpan`, `neckBase`, `acrossShoulder`, `biacromial`, `cervicale`, `acromion`, `axilla`, `female`, `bicep`, `neckToWaist`, `shoulderToApex`, `upperArm`, `sex`, `fat`, `muscularity`, `scale`; callers supply the complete record.

The optional `kyphoticAngle` and `lordoticAngle` carry the person's posterior posture. The trunk solver otherwise takes the sex-specific postural study default.

Ordinary Human preparation supplies the optional signed `cervicaleForward` datum for the sagittal shoulder projection. Existing input records without it retain the neck support's fore-aft placement.
