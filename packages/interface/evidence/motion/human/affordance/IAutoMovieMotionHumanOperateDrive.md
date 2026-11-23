# src/motion/human/affordance/IAutoMovieMotionHumanOperateDrive.ts#IAutoMovieMotionHumanOperateDrive.IHinge

## @evidence contracts/development/common.md#meaningful-documentation

point: A point of the line, world metres. axis: Its unit axis; the vertical when absent.

## @evidence contracts/development/design.md#principled-representation

point: A point of the line, world metres. axis: Its unit axis; the vertical when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateDrive.ts (operateDrive.hinge, return); affordance/operateDrive.ts (operateDrive.radius, line); affordance/operateDrive.ts (operateDrive.foot, line); affordance/operateState.ts (operateState.at, hinge); affordance/operate.ts (operate.plan); executable/cases/affordanceCases.ts (affordanceCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/affordance/IAutoMovieMotionHumanOperateDrive.ts#IAutoMovieMotionHumanOperateDrive.IPlace

## @evidence contracts/development/common.md#meaningful-documentation

point: World metres.

## @evidence contracts/development/design.md#principled-representation

point: World metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateDrive.ts (operateDrive.part, return); affordance/operateDrive.ts (operateDrive.part).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/affordance/IAutoMovieMotionHumanOperateDrive.ts#IAutoMovieMotionHumanOperateDrive.IPart

## @evidence contracts/development/common.md#meaningful-documentation

line: A hinge articulation's own line at the stroke's start, world: a point of it and its unit axis, the affordance frame's `+Y`, about which a positive travel turns by the right-hand rule (a door's upright hinge, a gun cock's cross pin). Absent for any other articulation.

## @evidence contracts/development/design.md#principled-representation

line: A hinge articulation's own line at the stroke's start, world: a point of it and its unit axis, the affordance frame's `+Y`, about which a positive travel turns by the right-hand rule (a door's upright hinge, a gun cock's cross pin). Absent for any other articulation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateDrive.ts (operateDrive.part, return); affordance/operateDrive.ts (operateDrive.hinge, part); affordance/operateDrive.ts (operateDrive.drive, part); affordance/operate.ts (operate.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanOperateDrive.IPlace, IAutoMovieMotionHumanOperateDrive.ILine identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/affordance/IAutoMovieMotionHumanOperateDrive.ts#IAutoMovieMotionHumanOperateDrive.ILine

## @evidence contracts/development/common.md#meaningful-documentation

point: A point of the line, metres.

## @evidence contracts/development/design.md#principled-representation

point: A point of the line, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateDrive.ts (operateDrive.part.line, return); affordance/operateDrive.ts (operateDrive.part).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/affordance/IAutoMovieMotionHumanOperateDrive.ts#IAutoMovieMotionHumanOperateDrive.IAmountMechanism

## @evidence contracts/development/common.md#meaningful-documentation

kind: Exclusion pattern removing insertion from the amount calculation; socket insertion is handled by its separate law.

## @evidence contracts/development/design.md#principled-representation

kind: Exclusion pattern removing insertion from the amount calculation; socket insertion is handled by its separate law.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateDrive.ts (operateDrive.amount, mechanism).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanOperate.Mechanism identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/affordance/IAutoMovieMotionHumanOperateDrive.ts#IAutoMovieMotionHumanOperateDrive.IHingeMechanism

## @evidence contracts/development/common.md#meaningful-documentation

kind: Selects rotation of the operated object about its hinge.

## @evidence contracts/development/design.md#principled-representation

kind: Selects rotation of the operated object about its hinge.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateDrive.ts (operateDrive.hinge, mechanism).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanOperate.Mechanism identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
