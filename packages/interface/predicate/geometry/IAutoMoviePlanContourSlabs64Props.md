# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props

## @evidence contracts/development/common.md#meaningful-documentation

The inputs describe increasing retained cuts, aligned rings and events, and switching to explicit adjacency with even an empty supplied list.

## @evidence contracts/development/design.md#principled-representation

The contour planner uses exact retained positions to resolve saved addresses. It indexes aligned inputs directly and retains unsupported slots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The planner borrows prepared data without copying ring geometry or re-admitting authored events.

# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props.slices

## @evidence contracts/development/common.md#meaningful-documentation

The list describes the required increasing station order and alignment with the ring lists.

# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props.rings

## @evidence contracts/development/common.md#meaningful-documentation

The list identifies cut and saved loop ordinals and retains unsupported entries to protect their addresses.

# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props.events

## @evidence contracts/development/common.md#meaningful-documentation

The prepared events preserve the declaration order and supply winding and brackets used for group assignment.

# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props.declaredEvents

## @evidence contracts/development/common.md#meaningful-documentation

The declarations align with prepared events and describe the adjacent-cut bracket requirement for explicit planning.

# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props.intervals

## @evidence contracts/development/common.md#meaningful-documentation

The option distinguishes absent geometric correspondence from explicit adjacency, including an empty list, and states how invalid interval ownership is represented.

# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props.ISliceAddress

## @evidence contracts/development/common.md#meaningful-documentation

The record states the physical station and documents exact addressing in millimetres.

## @evidence contracts/development/design.md#principled-representation

Interval admission addresses both saved endpoints by equality with retained cuts. Those cuts also identify prepared event brackets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A slice address carries its ordinate alone. The aligned rings own section geometry.

# src/geometry/IAutoMoviePlanContourSlabs64Props.ts#IAutoMoviePlanContourSlabs64Props.ISliceAddress.y

## @evidence contracts/development/common.md#meaningful-documentation

The value carries millimetres and documents equality against event and interval endpoints.
