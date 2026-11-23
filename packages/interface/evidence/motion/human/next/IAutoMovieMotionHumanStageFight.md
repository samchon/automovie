# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight

## @evidence contracts/development/common.md#meaningful-documentation

States the stage-fight model: the non-contact blows, the receiver's responses, the exchange and prop-beat compositions and the preset constants.

## @evidence contracts/development/design.md#principled-representation

One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The family's laws and presets and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IResponse

## @evidence contracts/development/common.md#meaningful-documentation

Names the other performer and the delay with its unit and default.

## @evidence contracts/development/design.md#principled-representation

The delay is seconds after the visual cue, so the partner's flinch is placed against the beat's own event.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The record of one response and nothing else.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the response adds no contact between performers.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IStageBladeFootwork

## @evidence contracts/development/common.md#meaningful-documentation

Names the method it parameterises and the law type it aliases unchanged.

## @evidence contracts/development/design.md#principled-representation

An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStageBladeFootwork` owns the type; the alias serves this family's `stageBladeFootwork` signature.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast, so `stageBladeFootwork` takes the type its law reads.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IStagePunchPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanPunch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanPunch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPunch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IStageHeadbuttPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanCloseStrike.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanCloseStrike.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCloseStrike.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.ITapPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IStageSlapPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IPressPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IPokePreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IHoldPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IClinchPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanClinch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanClinch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanClinch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IGivePreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanGive.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanGive.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGive.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IPushedPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanGive.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanGive.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGive.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IShovedPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanStagger.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanStagger.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStagger.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IDivePreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanLieDown.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanLieDown.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLieDown.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.ICrouchPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanCrouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanCrouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCrouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanStageFight.ts#IAutoMovieMotionHumanStageFight.IFootworkPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanStep.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanStep.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStep.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.
