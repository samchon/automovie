# src/architecture/IAutoMovieBuiltPlacementBodyLocator.ts#IAutoMovieBuiltPlacementBodyLocator

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `kind`; `builtEnvironmentPlacementBounds` resolves an element through its tessellated model and full hierarchy transform and a population by `set.id` through its placement-bounds fold, returning null for an unknown id or a model-less element.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two arms holding only a kind and an id, so the overlap and support queries and their sweeps share one addressing type instead of passing raw element or population records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Compact layouts are bounded without expanding realized members; explicit layouts still inspect their stored transforms. A missing locator becomes unresolved, while errors deriving a present body's bounds propagate. Runtime-model references can resolve to a labelled origin point without proving any external mesh extent.

## @evidence contracts/development/common.md#meaningful-documentation

States what each arm addresses, which id a population arm uses, and how an unknown id or a transform-only group is reported.
