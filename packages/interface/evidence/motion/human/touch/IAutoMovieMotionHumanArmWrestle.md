# src/motion/human/touch/IAutoMovieMotionHumanArmWrestle.ts#IAutoMovieMotionHumanArmWrestle

## @evidence contracts/development/common.md#meaningful-documentation

table: The point on the table's top the clasp stands over, world metres; both roles give the same one. seconds: Seconds of struggle from `go` to the start of the pin; 3 when absent. pin: How far from upright the forearms end at the pin, degrees; both roles give the same one. `PIN` when absent. An angle this role's arm cannot hold with its elbow on its place on the table is refused with the largest it can.

## @evidence contracts/development/design.md#principled-representation

table: The point on the table's top the clasp stands over, world metres; both roles give the same one. seconds: Seconds of struggle from `go` to the start of the pin; 3 when absent. pin: How far from upright the forearms end at the pin, degrees; both roles give the same one. `PIN` when absent. An angle this role's arm cannot hold with its elbow on its place on the table is refused with the largest it can.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: touch/armWrestle.ts (armWrestle.plan, context); touch/armWrestle.ts (armWrestle.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/touch/IAutoMovieMotionHumanArmWrestle.ts#IAutoMovieMotionHumanArmWrestle.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

The partner, the shared point on the table, the declared outcome and the struggle's length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The outcome is declared, never drawn, so both roles agree without a shared draw.
