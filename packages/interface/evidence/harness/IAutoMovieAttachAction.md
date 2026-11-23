# src/harness/IAutoMovieAttachAction.ts#IAutoMovieAttachAction

## @evidence contracts/development/design.md#principled-representation

The child's world frame is the product of the parent's placement, posed bone frame and bone-local rigid offset. An omitted offset is the identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The action adds a parent, bone and optional rigid offset. The child is the action's actor and the result uses the ordinary node clip representation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The shot gate refuses invalid parents, bones and offsets. The baker applies the authored offset directly at every key and omits parent scale as it does for identity offsets.

## @evidence contracts/development/common.md#meaningful-documentation

States where to author persistent mounts, how authored offsets determine the first key, what omission and auto duration mean, and the sampler's span behavior.
