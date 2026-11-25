# src/motion/perform/IAutoMovieCreateDynamicActorPoseClip.ts#IAutoMovieCreateDynamicActorPoseClip.IProps

## @evidence contracts/development/common.md#meaningful-documentation

A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. Finite in-span landmarks augment the 24 Hz grid and duplicate sample times collapse.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieCreateDynamicActorPoseClip.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

A caller-supplied pose reader uses local seconds and one skeleton identity over a finite positive duration; null refuses the whole bake and exceptions propagate. Finite in-span landmarks augment the 24 Hz grid and duplicate sample times collapse. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieCreateDynamicActorPoseClip.IProps contract belongs to interface; packages/engine/src/perform/createDynamicActorPoseClip.ts uses this boundary. Runtime computation remains with those consumers.
