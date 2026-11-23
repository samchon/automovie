# src/motion/human/lexicon/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk

## @evidence contracts/development/common.md#meaningful-documentation

Names the single-grip or paired-grip prop and the staged floor stations. The law admits the held grip and placement.

## @evidence contracts/development/design.md#principled-representation

The aid's two grip counts are distinct alternatives discriminated by `kind`. Floor stations use world metres and signed yaw relative to entry in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The action uses one prop, its selected support order, and the requested stations and timing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A walker needs both hands and has no hand selection to combine meaninglessly. Geometry comes from the staged prop, not the request.

# src/motion/human/lexicon/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.HeldKind

## @evidence contracts/development/common.md#meaningful-documentation

Names the two single-grip aids.

## @evidence contracts/development/design.md#principled-representation

A closed literal set; the staged prop supplies the geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The cane and crutch share one support order, so one alternative serves both.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No geometry is encoded in the kind.

# src/motion/human/lexicon/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.ICommon

## @evidence contracts/development/common.md#meaningful-documentation

States the staged prop's affordances and the station sequence.

## @evidence contracts/development/design.md#principled-representation

The prop is a scene id; stations carry world metres, degrees and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members both alternatives share, written once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The runtime owner admits the prop's affordances and the stations' reach.

# src/motion/human/lexicon/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IHeld

## @evidence contracts/development/common.md#meaningful-documentation

States the kind and the gripping hand's default.

## @evidence contracts/development/design.md#principled-representation `kind` discriminates it from the walker.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only a single-grip aid chooses a hand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hand is the only per-aid choice; reach is admitted at runtime.

# src/motion/human/lexicon/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IWalker

## @evidence contracts/development/common.md#meaningful-documentation

States the kind; both hands always grip.

## @evidence contracts/development/design.md#principled-representation `kind` discriminates it from the single-grip aids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A walker adds nothing to the shared members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

There is no hand to choose, so none can be given.

# src/motion/human/lexicon/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.ILaw

## @evidence contracts/development/common.md#meaningful-documentation

States the law and the track reader's inputs, frame and timebase.

## @evidence contracts/development/design.md#principled-representation

The track maps a film second to the aid's world rigid frame, in metres, from its start frame and the walk's stations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The law is what the vocabulary registers; the track is what the scene's prop reads, so both share one course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The track derives every frame from the same stations the law plans, with no separately authored prop path.

# src/motion/human/lexicon/IAutoMovieMotionHumanAidWalk.ts#IAutoMovieMotionHumanAidWalk.IStation

## @evidence contracts/development/common.md#meaningful-documentation

States world position, relative turn and phase duration.

## @evidence contracts/development/design.md#principled-representation

A floor point uses only horizontal coordinates while heading and seconds are separate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A station supplies the endpoint and timing for the rigid aid and both soles.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The runtime owner admits timing and rejects unreachable placements. The record has no joint or prop keyframes.
