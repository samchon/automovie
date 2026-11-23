# src/motion/composition/IAutoMovieIntentTiming.ts#IAutoMovieIntentTiming

## @evidence contracts/development/common.md#meaningful-documentation

Separates full duration, relative contact offset and event shares before cuts.

## @evidence contracts/development/design.md#principled-representation

AutoMovieSchedulePlace admits finite nonnegative duration and a contact inside it; event shares are caller-admitted except when selected as a cut.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The production timing law creates this result; placement converts its relative values to absolute film seconds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing contact or event list records no such instant rather than silently inventing an action-specific phase.
