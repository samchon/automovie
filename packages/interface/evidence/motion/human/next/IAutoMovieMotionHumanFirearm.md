# src/motion/human/next/IAutoMovieMotionHumanFirearm.ts#IAutoMovieMotionHumanFirearm

## @evidence contracts/development/common.md#meaningful-documentation

States the effector, how the firearm is given, how a shot is composed and the preset constants.

## @evidence contracts/development/design.md#principled-representation

One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The family's laws and presets and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanFirearm.ts#IAutoMovieMotionHumanFirearm.IDrawFirearm

## @evidence contracts/development/common.md#meaningful-documentation

Names the method it parameterises, the type it narrows and the members that narrowing removes.

## @evidence contracts/development/design.md#principled-representation

A named narrowing of `IAutoMovieMotionHumanPickUp.IParams`: every member kept has the units, frames, defaults and invariants that type states.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the members; this alias names the narrowing so no signature writes it inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanFirearm.ts#IAutoMovieMotionHumanFirearm.IReachHolsterPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanTouch.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanTouch.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanFirearm.ts#IAutoMovieMotionHumanFirearm.ISurrenderPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanGesture.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanGesture.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanGesture.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanFirearm.ts#IAutoMovieMotionHumanFirearm.IDrawPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanPickUp.IParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanPickUp.IParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.
