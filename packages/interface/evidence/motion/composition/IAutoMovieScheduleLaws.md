# src/motion/composition/IAutoMovieScheduleLaws.ts#IAutoMovieScheduleLaws

## @evidence contracts/development/common.md#meaningful-documentation

Explains synchronous pure callbacks, borrowed growing entries, callback absence and retained opaque state.

## @evidence contracts/development/design.md#principled-representation

timing is mandatory; optional align and until are required only by matching composition features. Missing required laws throw during placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieSchedule holds these laws only during resolution; outcome and state run on the draft before it enters context.entries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pre-existing unknown state is deliberately uninterpreted production data; callers own its schema and immutability, and the engine retains it by reference.
