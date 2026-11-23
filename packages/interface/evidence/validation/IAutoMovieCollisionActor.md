# src/validation/IAutoMovieCollisionActor.ts#IAutoMovieCollisionActor

## @evidence contracts/development/design.md#principled-representation

Resolved motion joints provide proxy endpoints in the caller's shared coordinate frame; node labels emitted events and does not itself apply scene placement. Proxy admission precedes sampling.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Actor inputs keep motion/rig identity, optional axis/rest remaps and physical response facts explicit instead of looking them up through a scene registry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null body permits sampled geometry observations but supplies no guessed mass or restitution: an unsuppressed overlap that requests a physical response reports the absent body. Proxy geometry remains an authored volume approximation, not a mesh collision certificate.

## @evidence contracts/development/common.md#meaningful-documentation

Documents borrowed rig/motion/proxies, label-only node, optional remaps and null-body response meaning.
