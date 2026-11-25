# src/motion/IAutoMovieSteerCrowd.ts#IAutoMovieSteerCrowd.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Gives the film interval, step, force-law seconds and empty-crowd exception to interval admission.

## @evidence contracts/development/design.md#principled-representation

Agents use world floor metres; steering validates radius, desired speed, start and goals while trajectory integration validates nonempty-pass time and step.

## @evidence contracts/development/design.md#minimal-and-owned-surface

steerAutoMovieCrowd borrows agents and obstacles to plan one pass; input ordering remains reporting identity despite canonical integration order.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional obstacles and law parameters refine the same pass rather than embedding scene-specific routes or runtime actors.

# src/motion/IAutoMovieSteerCrowd.ts#IAutoMovieSteerCrowd.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Describes input-order courses and consecutive-knot overlap reports in detection order.

## @evidence contracts/development/design.md#principled-representation

Courses carry film-time readers; contacts carry original-array indices, first overlap time and depth in metres. Output arrays are not frozen.

## @evidence contracts/development/design.md#minimal-and-owned-surface

steerAutoMovieCrowd produces the retained trajectories and contact diagnostics for motion planners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contacts report observed persistent overlaps instead of converting a best-effort steering plan into an unconditional collision-free claim.
