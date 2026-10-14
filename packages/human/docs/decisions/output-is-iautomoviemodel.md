# IAutoMovieModel is the only interface contract

## Decision

Public input types live in `packages/human/src/structures` and stay typed end to end. The only contract with `interface` is the output: an `IAutoMovieModel` with `origin: "generated"`, the generic group of parts (mesh geometry with `IAutoMovieMeshSkin` weights on `AutoMovieHumanoidBone`, materials, attachments) plus skeleton and body. Films use that group like any other model. Human never enters films through `IAutoMovieModelRecipe` or its string-keyed `parameters`.

## Reasons

- `IAutoMovieModelRecipe.parameters` is `Record<string, number | string | boolean>`, the same untyped shape as the discarded basis-era `shape: Record<string, number>`.
- A film that consumes a generic model group needs no Human-specific code, and motion, staging and rendering stay shared with every other figure.
- Keeping Human's inputs inside the package lets them change with the rebuild without a core change each time.

## Consequences

- Anything Human needs to express in its output that `IAutoMovieModel` cannot carry is a core gap, fixed in core (`core-gaps-fixed-in-core.md`, `../core/gaps.md`).
- The archetype recipe retirement (#2805) removes the recipe path for every figure; Human does not depend on its timing.
