# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal

## @evidence contracts/development/common.md#meaningful-documentation

States who reads a refusal, what each carries, that it is seed-independent and how it is located. minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.

## @evidence contracts/development/design.md#principled-representation

An `Error` whose message is composed from typed fields, so the text and the fields cannot disagree. minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields an author repairs from, one constructor and the locating copy. Runtime boundary references: compose/AutoMovieMotionHumanDrinkingArm.ts (AutoMovieMotionHumanDrinkingArm.refused, return); compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.of.handless, return); everyday/HumanObstacle.ts (HumanObstacle.of.refuse, return); handling/handshakeReach.ts (handshakeReach.refusal, return); law/HumanBound.ts (HumanBound.refuse, return); law/HumanRefusal.ts (HumanRefusal.locate, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The feasible set is a closed union of a range and alternatives, not free text. The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal.IRange

## @evidence contracts/development/common.md#meaningful-documentation

minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.

## @evidence contracts/development/design.md#principled-representation

minimum: The least accepted value, or null when unbounded below. maximum: The greatest accepted value, or null when unbounded above. unit: The unit of both ends (`m`, `s`, `degrees`), or empty for a pure number.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: law/HumanBound.ts (HumanBound.within, open); law/HumanBound.ts (HumanBound.refuse, feasible).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanBound.within.

# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal.IConstructor

## @evidence contracts/development/common.md#meaningful-documentation

message: The message of a refusal: `performer.act#instance axis: reason; feasible: ...; fix: ...`, the place left out until it is known. describe: A feasible set as text: `0.12 to 0.71 m`, `at least 1`, or the alternatives listed.

## @evidence contracts/development/design.md#principled-representation

message: The message of a refusal: `performer.act#instance axis: reason; feasible: ...; fix: ...`, the place left out until it is known. describe: A feasible set as text: `0.12 to 0.71 m`, `at least 1`, or the alternatives listed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the enclosing IAutoMovieMotionHumanRefusal contract's parameter and result relationships.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanRefusal.IProps, IAutoMovieMotionHumanRefusal, IAutoMovieMotionHumanRefusal.Feasible identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The classes of refusal, each repaired at a different place:

## @evidence contracts/development/design.md#principled-representation

Closed choices "parameter", "reach", "affordance", "channel", "cut", "participant", "base", "rule" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: law/HumanRefusal.ts (HumanRefusal); law/HumanRefusal.ts (HumanRefusal.KINDS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanRefusal.

# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal.Feasible

## @evidence contracts/development/common.md#meaningful-documentation

What an axis accepts: a numeric range or a list of alternatives.

## @evidence contracts/development/design.md#principled-representation

A feasible alternative is either a numerical range or a discrete alternative list, with the discriminant selecting which information an author can act on.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve.refuse, feasible); law/HumanRefusal.ts (HumanRefusal.describe, feasible); law/HumanRefusal.ts (HumanRefusal); law/HumanRefusal.ts (HumanRefusal.message).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanRefusal.IRange, IAutoMovieMotionHumanRefusal.IAlternatives identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal.IAlternatives

## @evidence contracts/development/common.md#meaningful-documentation

kind: The discriminator. values: The accepted values.

## @evidence contracts/development/design.md#principled-representation

kind: The discriminator. values: The accepted values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanScheduleRefusal.ts (HumanScheduleRefusal.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanScheduleRefusal.of.

# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal.IProps

## @evidence contracts/development/common.md#meaningful-documentation

feasible: What the axis accepts; null or absent when neither a range nor alternatives apply.

## @evidence contracts/development/design.md#principled-representation

feasible: What the axis accepts; null or absent when neither a range nor alternatives apply.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: law/HumanRefusal.ts (HumanRefusal.message, props); perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window.located, refusal); law/HumanRefusal.ts (HumanRefusal).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanRefusal.IWhere, IAutoMovieMotionHumanRefusal.Kind, IAutoMovieMotionHumanRefusal.Feasible identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanRefusal.ts#IAutoMovieMotionHumanRefusal.IWhere

## @evidence contracts/development/common.md#meaningful-documentation

performer: The performer. act: The action. instance: The occurrence of the action in the performer's chain, from 1.

## @evidence contracts/development/design.md#principled-representation

performer: The performer. act: The action. instance: The occurrence of the action in the performer's chain, from 1.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: law/HumanRefusal.ts (HumanRefusal.locate, where); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place, where); perform/HumanPerformanceRead.ts (HumanPerformanceRead.where, return); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.align, where); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.latency, where); perform/HumanPerformanceSchedule.ts (HumanPerformanceSchedule.resolve).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanRefusal.locate.
