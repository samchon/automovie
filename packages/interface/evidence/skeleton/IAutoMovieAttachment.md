# src/skeleton/IAutoMovieAttachment.ts#IAutoMovieAttachment

## @evidence contracts/development/design.md#principled-representation

resolveAttachment applies parent-bone forward kinematics then rigidly composes the child offset, rotating translation, multiplying unit rotations and copying offset scale in the parent's model frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Parent bone and local offset describe one cross-rig coupling while scene node identity and world placement belong to the surrounding attachment action.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing or unreachable parent bones throw, and the bone frame carries no inherited scale; renderer and resolver must use matching clinical axes and rest frames.

## @evidence contracts/development/common.md#meaningful-documentation

Defines parent-skeleton bone ownership, local offset composition and rigid following with model-versus-world placement distinction.
