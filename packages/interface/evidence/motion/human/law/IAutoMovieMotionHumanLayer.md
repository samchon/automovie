# src/motion/human/law/IAutoMovieMotionHumanLayer.ts#IAutoMovieMotionHumanLayer

## @evidence contracts/development/common.md#meaningful-documentation

channels: The channels whose joints the layer writes: the head and the trunk for gaze, breath and an affect display, an arm for a mood that lets it hang. A layer scheduled in a window during which one of the person's actions holds a limb channel it names by a contact (a grip on that hand, a planted foot of that leg) is refused when the performance is built; the head and the trunk bear no contact window, so naming them refuses nothing. Absent for a layer that does not say what it writes. attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral. events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.

## @evidence contracts/development/design.md#principled-representation

channels: The channels whose joints the layer writes: the head and the trunk for gaze, breath and an affect display, an arm for a mood that lets it hang. A layer scheduled in a window during which one of the person's actions holds a limb channel it names by a contact (a grip on that hand, a planted foot of that leg) is refused when the performance is built; the head and the trunk bear no contact window, so naming them refuses nothing. Absent for a layer that does not say what it writes. attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral. events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanAffect.ts (HumanAffect.layer, return); everyday/HumanBreath.ts (HumanBreath.layer, return); everyday/HumanGaze.ts (HumanGaze.layer, return); lexicon/HumanAirborneShape.ts (HumanAirborneShape.layer, return); lexicon/HumanCarriedLean.ts (HumanCarriedLean.layer, return); lexicon/HumanCarriedLean.ts (HumanCarriedLean.coupled, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanChannel, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSkill, IAutoMovieMotionHumanAttribute.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanLayer.ts#IAutoMovieMotionHumanLayer.IContext

## @evidence contracts/development/common.md#meaningful-documentation

attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral.

## @evidence contracts/development/design.md#principled-representation

attributes: The person's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; absent reads as neutral.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanBreath.ts (HumanBreath.layer, context); everyday/HumanGaze.ts (HumanGaze.layer, context); lexicon/HumanAirborneShape.ts (HumanAirborneShape.layer, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSkill, IAutoMovieMotionHumanAttribute.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanLayer.ts#IAutoMovieMotionHumanLayer.IAction

## @evidence contracts/development/common.md#meaningful-documentation

events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.

## @evidence contracts/development/design.md#principled-representation

events: Its events, in film seconds. contacts: Its contact windows, as shares of its own duration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanSegmentPose.ts (HumanSegmentPose.layered.action, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanLayer.ts#IAutoMovieMotionHumanLayer.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

from: The second it starts. to: The second it ends.

## @evidence contracts/development/design.md#principled-representation

from: The second it starts. to: The second it ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanPursuit.ts (HumanPursuit.sweeps, window).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanPursuit.sweeps.

# src/motion/human/law/IAutoMovieMotionHumanLayer.ts#IAutoMovieMotionHumanLayer.IScheduled

## @evidence contracts/development/common.md#meaningful-documentation

layer: The layer, or what builds it from the window's seconds. from: When it starts; the film's start when absent. to: When it ends; the film's end when absent.

## @evidence contracts/development/design.md#principled-representation

layer: The layer, or what builds it from the window's seconds. from: When it starts; the film's start when absent. to: When it ends; the film's end when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanPursuit.ts (HumanPursuit.sweeps, return); perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window, scheduled); perform/HumanPerformanceState.ts (HumanPerformanceState, layer).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLayer, IAutoMovieMotionHumanLayer.IWindow, AutoMovieMotionHumanScheduledInstant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
