# src/production/IAutoMovieShotPhysicsAdvice.ts#IAutoMovieShotPhysicsAdvice

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `decision`, whose four states fix which of `selected` and `rationale` may be present; `compileDefinedShot` additionally requires a non-blank unique id and a non-blank rationale for every decision, and compares `selected` with `proposal` by key-sorted JSON, so `accepted` must equal the proposal and `modified` must differ from it regardless of key order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shared id and proposal live once in a base, and each state adds only the two fields whose meaning changes, so no state carries a field it cannot use; the record is a decision log, with applying a selected response left to the author's own motion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The compiler never folds `selected` into motion and never fills a missing rationale, so an accepted proposal still reaches the shot only through what the author wrote, and a pending item stays pending.

## @evidence contracts/development/common.md#meaningful-documentation

States that the response is advice never applied by the engine, who supplies it and through which field, each decision state and what its `selected` and `rationale` must be, and that the compiler validates and copies the list.
