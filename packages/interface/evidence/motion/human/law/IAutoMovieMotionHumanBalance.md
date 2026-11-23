# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance

## @evidence contracts/development/common.md#meaningful-documentation

States when it is computed, how each field defaults, what absent computes, how a shift applies and why its bounds are events.

## @evidence contracts/development/design.md#principled-representation

One record names the part moved, its weight, its two event-named instants and easing durations in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPhysics resolves the author's part, bounds, weight and ramp. The receiving law supplies the supported correction for that part.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Balance is opt-in. The caller or law must supply the part and both event bounds, and the weight and ramp have explicit defaults.

# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States the timebase and the two readers.

## @evidence contracts/development/design.md#principled-representation

One part, admitted weight and ramp, and numeric bounds on one action clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The posture and audit borrow the same prepared window from HumanPhysics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record fixes timing without retaining poses or evaluated phase samples.

# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance.IInterval

## @evidence contracts/development/common.md#meaningful-documentation

Both endpoints use seconds since the action began and belong to the interval.

## @evidence contracts/development/design.md#principled-representation

Numeric endpoints distinguish a time from a duration. HumanPhysics checks ordering when resolving authored bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The prepared window and its eligible support phase share endpoints so pose and audit use the same clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The interval carries resolved times without assuming a frame rate or retaining schedule events.

# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance.Window

## @evidence contracts/development/common.md#meaningful-documentation

States when a plan has no active window.

## @evidence contracts/development/design.md#principled-representation

A numeric action-local window or no correction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by IAutoMovieMotionHumanActionPlan and the balance audit.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An off request carries no dummy window.

# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance.IRamp

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, where each duration is applied and how overlapping blends fit into the window.

## @evidence contracts/development/design.md#principled-representation

Two nonnegative finite durations; HumanPhysics validates finiteness and range at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPhysics uses each duration at its own endpoint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Blends use actual bounds and seconds, with the requested relative blend duration preserved when they meet.

# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance.ISupport

## @evidence contracts/development/common.md#meaningful-documentation

States the two readings, their frame and unit, and their reader.

## @evidence contracts/development/design.md#principled-representation

The centre and the support points, each world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What HumanBalance.support returns; nothing else.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3; the readings stay with their producer.

# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance.Part

## @evidence contracts/development/common.md#meaningful-documentation

Names the two parts.

## @evidence contracts/development/design.md#principled-representation

A closed set of named parts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parts today's balancing laws move.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No part is inferred from anything but this field.

# src/motion/human/law/IAutoMovieMotionHumanBalance.ts#IAutoMovieMotionHumanBalance.IBound

## @evidence contracts/development/common.md#meaningful-documentation

States each field, its default and the two reserved event names.

## @evidence contracts/development/design.md#principled-representation

An event of this action, another action or a cue, with its occurrence and an offset in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The terms the instant resolver reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No share of a duration: an event, resolved as the scheduled instants are.
