# src/motion/perform/IAutoMovieMaskedContent.ts#IAutoMovieMaskedContent

## @evidence contracts/development/design.md#principled-representation

compilePerformance records losses while filtering the same keyframes it assembles, so the diagnostic describes actual discarded content rather than a second approximation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Action index, actor, region and channel-specific losses let performShot locate a failure without duplicating the source clip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The report does not assert that a masked clip is otherwise valid, and it never compensates for discarded content by synthesizing replacement motion.

## @evidence contracts/development/common.md#meaningful-documentation

Members explain original action indices, deterministic bone ordering and aggregate Boolean loss meaning.
