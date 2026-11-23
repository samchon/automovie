# src/motion/human/law/IAutoMovieMotionPropHold.ts#IAutoMovieMotionPropHold

## @evidence contracts/development/common.md#meaningful-documentation

A planned hand attachment to a prop beginning at a share of the action's duration. Optional finger joint angles preserve the grip when performance evaluation carries the prop.

## @evidence contracts/development/design.md#principled-representation

The start is an action share. A staged capture borrows the matching launch and checks its displayed frame. A later prop action reads the grip's declared use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Held primitives and striking plans publish persistent grips that performance holding consumes across later actions; this planned hold differs from the evaluator's cached held state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The start remains a normalized duration share, while fingers remain readonly clinical joint angles. Grip takeover and missing-prop refusal belong to performance planning.

# src/motion/human/law/IAutoMovieMotionPropHold.ts#IAutoMovieMotionPropHold.ICapture

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the launch and the world frame the capture checks at grip closure.

## @evidence contracts/development/design.md#principled-representation

The held action borrows a launch identity and the original planned interception predicate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPerformanceGrips carries the capture to its actual grip consumer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The owning catch checks the displayed frame against its planned interception.
