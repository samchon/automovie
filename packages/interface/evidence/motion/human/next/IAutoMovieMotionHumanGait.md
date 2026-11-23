# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait

## @evidence contracts/development/common.md#meaningful-documentation

States the family, its two sub-interfaces, the speed model and the reference hip of every stated speed, the presets and their types, and what every method returns and what its anchor is.

## @evidence contracts/development/design.md#principled-representation

One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.WalkPace

## @evidence contracts/development/common.md#meaningful-documentation

States the three paces, the constant that gives each its Froude number and where each pace's result is documented.

## @evidence contracts/development/design.md#principled-representation

A closed string union, so only the walk's paces are admitted; a pace's Froude number and speed are the walk law's (`walk.FROUDE`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the paces; the walk, the approach, the load carry and the door read them for their `pace` members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the parameter types read this named union instead of restating or indexing it.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.RunPace

## @evidence contracts/development/common.md#meaningful-documentation

States the three paces, the constant that gives each its duty factor and Froude number and where each pace's result is documented.

## @evidence contracts/development/design.md#principled-representation

A closed string union, so only the run's paces are admitted; a pace's duty factor, Froude number and speed are the run law's (`run.GAITS`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the paces; the run and the pursuit laws read them for their `pace` members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the parameter types read this named union instead of restating or indexing it.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.IStridePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which presets use it, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

Three required members with the walk's own units and ranges, so a preset always fixes exactly these three and the walk keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanGait.STROLL`, `HURRY` and `TRUDGE` are its data and the stroll, hurry and trudge rows read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the walk's parameters.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.ICarriagePreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which preset uses it, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

Three required members with the walk's own units and ranges, so the preset always fixes exactly these three and the walk keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanGait.SWAGGER` is its data and the swagger row reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the walk's parameters.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.ApproachSide

## @evidence contracts/development/common.md#meaningful-documentation

States the four sides and the member that reads them.

## @evidence contracts/development/design.md#principled-representation

A closed string union of the body-relative sides, so only a side of the person is admitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the approach presets that fix a side; the approach's `from` takes the same four.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the preset type reads this named union instead of an indexed access onto the approach's parameters.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.ApproachTrack

## @evidence contracts/development/common.md#meaningful-documentation

States the three modes and the member that reads them.

## @evidence contracts/development/design.md#principled-representation

A closed union of the tracking modes the approach admits.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the approach presets that fix tracking; the approach's `track` takes the same modes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the preset type reads this named union instead of an inline union.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.ITrackingApproachPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which presets use it, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

Three required members with the approach's own units, so a preset always fixes exactly these three and the approach keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanGait.FOLLOW` and `ESCORT` are its data and the follow and escort rows read them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the approach's parameters.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.IFacingApproachPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which preset uses it, how it is applied and where its members' meanings are.

## @evidence contracts/development/design.md#principled-representation

Two required members with the approach's own units, so the preset always fixes exactly these two and the approach keeps every other default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; `AutoMovieMotionHumanGait.CONFRONT` is its data and the confront row reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the members are named once here instead of an inline pick of the approach's parameters.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.IParams

## @evidence contracts/development/common.md#meaningful-documentation

What a styled gait leaves to the composition: the walk's destination, waypoints, arrival heading and elbows.

## @evidence contracts/development/design.md#principled-representation

Closed choices "pace", "stride", "armSwing" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanGait.ts (HumanGait.doubleTime, context); lexicon/HumanGait.ts (HumanGait.sad, context); lexicon/HumanGait.ts (HumanGait.proud, context); lexicon/HumanGait.ts (HumanGait.drunk, context); lexicon/HumanGait.ts (mood, context); lexicon/HumanGait.ts (distance, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.IMarch

## @evidence contracts/development/common.md#meaningful-documentation

regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent.

## @evidence contracts/development/design.md#principled-representation

regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanGait.ts (HumanGait.march, context); lexicon/HumanGait.ts (regulated, params); lexicon/HumanGait.ts (HumanGait.march).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanDrillRegulation.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanGait.ts#IAutoMovieMotionHumanGait.ILimp

## @evidence contracts/development/common.md#meaningful-documentation

side: The leg spared; the right when absent.

## @evidence contracts/development/design.md#principled-representation

side: The leg spared; the right when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanGait.ts (HumanGait.stiffLimp, context); lexicon/HumanGait.ts (HumanGait.limp, context); lexicon/HumanGait.ts (HumanGait.stiffLimp); lexicon/HumanGait.ts (HumanGait.limp).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanGait.stiffLimp.
