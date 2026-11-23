# src/harness/IAutoMovieEnactAction.ts#IAutoMovieEnactAction

## @evidence contracts/development/design.md#principled-representation

The clip is resolved by exact id from a table the host supplies, then flows through `compilePerformance`'s region masking and lane arrangement and `performShot`'s range-of-motion gate like any synthesized clip.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One id field references motion that lives in the shot program's clip table, so the action list stays thin and a clip used by several actions is stored once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An authored clip gets no exemption from masking or the motion gate, and an unknown id is refused by the production builder rather than skipped as silence.

## @evidence contracts/development/common.md#meaningful-documentation

States when to use it, who computes the motion and who resolves the id, every enforcement step it still passes, the default region, the blank and absent-clip refusals, and the reference synthesizer's empty answer.
