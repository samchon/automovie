# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared grasp and release model, what it leaves to the carrier and the preset constants.

## @evidence contracts/development/design.md#principled-representation

One method per law of the family, each taking the law's own parameter type, and one named type per narrowing or preset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The family's laws and presets and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law or a named narrowing of it; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.ITakeArrow

## @evidence contracts/development/common.md#meaningful-documentation

Names the method it parameterises, the type it narrows and the members that narrowing removes.

## @evidence contracts/development/design.md#principled-representation

A named narrowing of `IAutoMovieMotionHumanPickUp.IParams`: every member kept has the units, frames, defaults and invariants that type states.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPickUp.IParams` owns the members; this alias names the narrowing so no signature writes it inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.IPresentBow

## @evidence contracts/development/common.md#meaningful-documentation

Names the method it parameterises, the type it narrows and the members that narrowing removes.

## @evidence contracts/development/design.md#principled-representation

A named narrowing of `IAutoMovieMotionHumanWeaponPresent.IPresent`: every member kept has the units, frames, defaults and invariants that type states.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IPresent` owns the members; this alias names the narrowing so no signature writes it inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.ILoose

## @evidence contracts/development/common.md#meaningful-documentation

Names the law type it extends and the member it adds.

## @evidence contracts/development/design.md#principled-representation `IAutoMovieMotionHumanRelease.IParams` keeps its units, frames and invariants; the added member is the one the row's continuation reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRelease.IParams` owns the parameters; the interface adds only the staged continuation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the law's members are inherited unchanged.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.IPresentCrossbow

## @evidence contracts/development/common.md#meaningful-documentation

Names the method it parameterises, the type it narrows and the members that narrowing removes.

## @evidence contracts/development/design.md#principled-representation

A named narrowing of `IAutoMovieMotionHumanWeaponPresent.IPresent`: every member kept has the units, frames, defaults and invariants that type states.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IPresent` owns the members; this alias names the narrowing so no signature writes it inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.IShootCrossbow

## @evidence contracts/development/common.md#meaningful-documentation

Names the law type it extends and the member it adds.

## @evidence contracts/development/design.md#principled-representation `IAutoMovieMotionHumanWeaponPresent.IWield` keeps its units, frames and invariants; the added member is the one the row's continuation reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IWield` owns the parameters; the interface adds only the staged continuation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the law's members are inherited unchanged.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.IPresentBowPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanWeaponPresent.IPresent` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanWeaponPresent.IPresent` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWeaponPresent.IPresent` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.IJavelinPreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanThrowObjectParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanThrowObjectParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanThrowObjectParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.

# src/motion/human/next/IAutoMovieMotionHumanArchery.ts#IAutoMovieMotionHumanArchery.IKnifePreset

## @evidence contracts/development/common.md#meaningful-documentation

Names the members of `IAutoMovieMotionHumanThrowObjectParams` that the rows reading it fix, with the values each preset gives them.

## @evidence contracts/development/design.md#principled-representation

The fixed members are those of `IAutoMovieMotionHumanThrowObjectParams` with its own units, frames and invariants; the values are the preset constants'.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanThrowObjectParams` owns the members; this alias types the family's preset constants so no preset is written inline.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast.
