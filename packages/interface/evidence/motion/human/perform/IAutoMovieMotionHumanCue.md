# src/motion/human/perform/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.ISectionWave

## @evidence contracts/development/common.md#meaningful-documentation

States both inputs, their units and how section indices are assigned.

## @evidence contracts/development/design.md#principled-representation

Either film seconds or distances along a path with an origin time and constant speed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Provides the inputs of HumanCue.sectionWave in the existing cue contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Exclusive fields prevent competing timing sources. Runtime admission is owned by HumanCue.sectionWave.

# src/motion/human/perform/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IBeats

## @evidence contracts/development/common.md#meaningful-documentation

from: Film second of the first beat, which is a downbeat; 0 when absent. meter: Beats in a bar; 4 when absent.

## @evidence contracts/development/design.md#principled-representation

from: Film second of the first beat, which is a downbeat; 0 when absent. meter: Beats in a bar; 4 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanCue.ts (HumanCue.beats, beats).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCue.beats.

# src/motion/human/perform/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.ILine

## @evidence contracts/development/common.md#meaningful-documentation

accents: Film seconds of its stressed syllables, in order; none when absent. phrases: Film seconds its phrases end inside the line, in order; none when absent.

## @evidence contracts/development/design.md#principled-representation

accents: Film seconds of its stressed syllables, in order; none when absent. phrases: Film seconds its phrases end inside the line, in order; none when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanCue.ts (HumanCue.dialogue, lines); perform/HumanCue.ts (HumanCue.dialogue, line).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCue.dialogue.

# src/motion/human/perform/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IOrder

## @evidence contracts/development/common.md#meaningful-documentation

caution: Seconds the preparatory word comes before it; none when absent.

## @evidence contracts/development/design.md#principled-representation

caution: Seconds the preparatory word comes before it; none when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanCue.ts (HumanCue.orders, orders); perform/HumanCue.ts (HumanCue.orders.sorted, a); perform/HumanCue.ts (HumanCue.orders.sorted, b); perform/HumanCue.ts (HumanCue.orders, order); perform/HumanCue.ts (HumanCue.orders).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCue.orders.

# src/motion/human/perform/IAutoMovieMotionHumanCue.ts#IAutoMovieMotionHumanCue.IInstants

## @evidence contracts/development/common.md#meaningful-documentation

instants: The instants, each named, at film seconds.

## @evidence contracts/development/design.md#principled-representation

instants: The instants, each named, at film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanCue.ts (HumanCue.instants, source).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanCue.instants.
