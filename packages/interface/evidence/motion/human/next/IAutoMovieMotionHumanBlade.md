# src/motion/human/next/IAutoMovieMotionHumanBlade.ts#IAutoMovieMotionHumanBlade

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared blade timing, what the composition gives and the preset constants.

## @evidence contracts/development/design.md#principled-representation

One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The family's laws and presets and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanBlade.ts#IAutoMovieMotionHumanBlade.IFootworkPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanStep.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanStep.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStep.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanBlade.ts#IAutoMovieMotionHumanBlade.IHoldPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanSwordParry.IParry` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanSwordParry.IParry` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSwordParry.IParry` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanBlade.ts#IAutoMovieMotionHumanBlade.IFeintPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanSword.ICut` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanSword.ICut` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSword.ICut` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanBlade.ts#IAutoMovieMotionHumanBlade.IClubPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanSword.ICut` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanSword.ICut` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSword.ICut` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanBlade.ts#IAutoMovieMotionHumanBlade.IReloadPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.
