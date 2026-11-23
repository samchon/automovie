# src/production/IAutoMovieSubjectGroup.ts#IAutoMovieSubjectGroup

## @evidence contracts/development/design.md#principled-representation

The composite pattern over `AutoMovieSubject`: a group is itself a subject whose default `render` merges its members' contributions, so clusters, units and maps nest to any depth behind one interface; it relies on membership being acyclic, which it does not check.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds only `members()` and a default `render` to the base, so a subclass states membership and arrangement and overrides `render` only to merge an extra contribution of its own with `super.render`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Names no member kind or layout and bounds members only by `AutoMovieSubject<unknown>`; an unchecked membership cycle overflows the stack, as documented, rather than being caught and retried.

## @evidence contracts/development/common.md#meaningful-documentation

States the nesting levels it models, that `render` composes members by default, how an override keeps its members' output, and the unchecked membership cycle.
