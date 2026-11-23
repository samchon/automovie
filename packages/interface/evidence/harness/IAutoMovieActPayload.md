# src/harness/IAutoMovieActPayload.ts#IAutoMovieActPayload

## @evidence contracts/development/design.md#principled-representation

The act level of the script tree records intent as prose, because an act's purpose is read by people and the model, while every computed fact comes from the beats it contains.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One text field is the whole payload; ordering and containment belong to the enclosing script node's `parent` link, not to this record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No compiler stage parses the purpose for keywords or timing, so its wording cannot change a render; only emptiness is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States that the text is authoring-only, the non-empty rule, the one exporter that prints it and its heading form, and that no compiler stage reads it.
