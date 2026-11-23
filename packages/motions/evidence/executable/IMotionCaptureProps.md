# src/executable/IMotionCaptureProps.ts#IMotionCaptureProps

## @evidence contracts/development/common.md#meaningful-documentation

States who writes and reads it, why poses are sampled, the frame and units.

## @evidence contracts/development/design.md#principled-representation

The case's drawable content as plain data: bodies with one pose per instant, in the order of `seconds`, and the case's overlays as they are.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `planMotionCaptureProps`, read by `subjects` and `markMotionCaptureCase`; verdicts and metrics stay in Node, in the record's section.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses Human's canonical body and the interface's pose and vector; that every performer has one pose per second is kept by the writer.

# src/executable/IMotionCaptureProps.ts#IMotionCaptureProps.IFigure

## @evidence contracts/development/common.md#meaningful-documentation

Documents each member.

## @evidence contracts/development/design.md#principled-representation

A canonical body and its poses aligned with the case's seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the page to build and pose the figure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent colour is null, drawn in clay.
