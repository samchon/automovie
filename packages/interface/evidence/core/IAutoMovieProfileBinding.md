# src/core/IAutoMovieProfileBinding.ts#IAutoMovieProfileBinding

## @evidence contracts/development/design.md#principled-representation

Binding is a total lookup: each semantic key the profile's limits and drivers cite is replaced by `prefix + boneMap[key]`, and a key with no entry or a blank entry throws, so a bound profile never silently loses a constraint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The binding is separate from the profile so one profile serves many bodies, and the mapping is a plain record because lookup by key is its only operation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No key is guessed from node names, and no unread root or instance label claims a hierarchy constraint the binder does not enforce; only the profile identity and explicit semantic mapping drive binding.

## @evidence contracts/development/common.md#meaningful-documentation

States profile-id matching, semantic key mapping before the placement prefix, missing and blank mapping failures, articulation-node membership and the absence of a separate subtree-root assertion.
