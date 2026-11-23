# src/motion/human/tasks/IAutoMovieMotionHumanLongTool.ts#IAutoMovieMotionHumanLongTool

## @evidence contracts/development/common.md#meaningful-documentation

States the held tool, the two hands and each stroke.

## @evidence contracts/development/design.md#principled-representation

A closed union of strokes over one held tool and a world work point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The long-tool law reads these inputs; the tool's reach is its own contacts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No tool length or hand place is typed.

# src/motion/human/tasks/IAutoMovieMotionHumanLongTool.ts#IAutoMovieMotionHumanLongTool.Stroke

## @evidence contracts/development/common.md#meaningful-documentation

Names each stroke's path.

## @evidence contracts/development/design.md#principled-representation

Closed choices, one per stroke path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The long-tool law dispatches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Names the stroke, not its geometry.

# src/motion/human/tasks/IAutoMovieMotionHumanLongTool.ts#IAutoMovieMotionHumanLongTool.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and default.

## @evidence contracts/development/design.md#principled-representation

The stroke, the held tool, the work point and where a dug load goes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the long-tool law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

World points in metres.
