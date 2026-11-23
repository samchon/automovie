# src/harness/IAutoMovieBeatPayload.ts#IAutoMovieBeatPayload

## @evidence contracts/development/design.md#principled-representation

The payload is joined to the flat beat list by id, a one-to-one mapping `validateScriptTree` enforces in both directions, so the tree refines beats without becoming a second source of shot identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Direction, dialogue and caption are the prose a beat carries for people and exporters; timing, staging and actions stay in the shot program, so this record holds no computed field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A blank caption is refused rather than read as no caption, so `null` is the only spelling of absence, and no compiler stage parses the direction to derive actions.

## @evidence contracts/development/common.md#meaningful-documentation

States the join to the beat list and the shot id, every refusal from the tree validator and project validation, and per member its readers, its ordering, and what `null` means.
